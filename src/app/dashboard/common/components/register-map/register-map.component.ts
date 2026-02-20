import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { AuthStateService } from '../../../../common/services/auth-state.service';
import { RegisterMapService } from './register-map.service';
import { RegisterFilterService } from '../../../register/register-table-view/register-filter.service';
import { BaseMapChangeService } from './custom-map-logic/basemap-change';
import { FeatureSelectionService } from './custom-map-logic/feature-selection';
import { WmtsCapabilitiesService } from './wmts-capabilities.service';
import { CommonEsriAuthService } from '../../service/common-esri-auth.service';

@Component({
  selector: 'asrdb-register-map',
  standalone: true,
  imports: [CommonModule],
  providers: [
    RegisterMapService,
    BaseMapChangeService,
    FeatureSelectionService,
    WmtsCapabilitiesService,
  ],
  templateUrl: './register-map.component.html',
  styleUrls: ['./register-map.component.css'],
})
export class RegisterMapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() enableFilter = true;
  @Input() enableSelection = true;
  @Input() enableLegend = false;
  @Input() buildingGlobalId?: string;
  @Input() entranceGlobalId?: string;
  @Input() skipOtherFiltersApartFromGlobalId = false;
  @Input() small = false;
  @Input() showBuildingLayer = true;
  @Input() showEntranceLayer = true;
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;
  mapAuthError: string | null = null;
  isMapInitializing = false;
  isRefreshing$ = this.authStateService.isRefreshing$();
  private destroyed$ = new Subject<void>();

  constructor(
    private registerMapService: RegisterMapService,
    private registerFilterService: RegisterFilterService,
    private esriAuthService: CommonEsriAuthService,
    private authStateService: AuthStateService
  ) {}

  ngOnInit(): void {
    this.registerFilterService.skipOtherFiltersApartFromGlobalId =
      this.skipOtherFiltersApartFromGlobalId;
    this.registerFilterService.setBuildingGlobalIdFilter(this.buildingGlobalId);
    this.registerFilterService.updateGlobalIds(
      this.buildingGlobalId ? [this.buildingGlobalId] : undefined
    );
    // Initialize MapView and return an instance of MapView
    void this.initializeMap();

    if (this.small) {
      this.registerMapService.isOnlyOneBuilding = true;
    }

    this.registerFilterService.filterObservable
      .pipe(takeUntil(this.destroyed$))
      .subscribe(async () => {
        if (this.isMapInitializing || this.mapAuthError) {
          return;
        }
        try {
          await this.registerMapService.filterBuildingData(
            this.registerFilterService.prepareWhereCase()
          );
        } catch (error) {
          this.handleMapError(error);
        }
      });

    this.registerFilterService.globalIdsObservable
      .pipe(takeUntil(this.destroyed$))
      .subscribe(async () => {
        if (this.isMapInitializing || this.mapAuthError) {
          return;
        }
        try {
          await this.registerMapService.filterEntranceData(
            this.registerFilterService.prepareWhereCaseForEntrance(
              this.entranceGlobalId
            )
          );
        } catch (error) {
          this.handleMapError(error);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['entranceGlobalId'] &&
      changes['entranceGlobalId'].currentValue
    ) {
      void this.registerMapService.filterEntranceData(
        this.registerFilterService.prepareWhereCaseForEntrance(
          this.entranceGlobalId
        )
      );
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.registerMapService.cleanup();
  }

  async initializeMap(): Promise<any> {
    this.mapAuthError = null;
    this.isMapInitializing = true;

    const isReady = await firstValueFrom(
      this.esriAuthService.ensureEsriReady(1200, 'esri-auth-retry')
    );

    if (!isReady) {
      this.isMapInitializing = false;
      this.mapAuthError = $localize`Map authentication failed. Please retry.`;
      return;
    }

    try {
      await this.registerMapService.init(this.mapViewEl, {
        enableFilter: this.enableFilter,
        enableSelection: this.enableSelection,
        enableLegend: this.enableLegend,
        showBuildingLayer: this.showBuildingLayer,
        showEntranceLayer: this.showEntranceLayer,
        bldWhereCase: this.registerFilterService.prepareWhereCase(),
        entWhereCase: this.registerFilterService.prepareWhereCaseForEntrance(
          this.entranceGlobalId
        ),
      });
      this.mapAuthError = null;
    } catch (error) {
      this.handleMapError(error);
    } finally {
      this.isMapInitializing = false;
    }
  }

  retryMapAuth() {
    this.registerMapService.cleanup();
    void this.initializeMap();
  }

  private handleMapError(error: unknown) {
    console.error(error);
    this.mapAuthError = this.esriAuthService.isEsriAuthError(error)
      ? $localize`Map authentication failed. Please retry.`
      : $localize`Could not load map data. Please retry.`;
  }
}
