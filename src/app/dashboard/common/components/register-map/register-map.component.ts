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
import { RegisterFilterService } from '../../service/register-filter.service';
import { BaseMapChangeService } from './custom-map-logic/basemap-change';
import { FeatureSelectionService } from './custom-map-logic/feature-selection';
import { WmtsCapabilitiesService } from './wmts-capabilities.service';
import { CommonEsriAuthService } from '../../service/common-esri-auth.service';
import { LoggerService } from '../../../../common/services/logger.service';

@Component({
  selector: 'asrdb-register-map',
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
  @Input() highlightSelectedBuildings = false;
  @Input() highlightSelectedEntrance = false;
  @ViewChild('mapViewNode', { static: true }) private mapViewEl!: ElementRef;
  mapAuthError: string | null = null;
  isMapInitializing = false;
  isMapReady = false;
  isRefreshing$ = this.authStateService.isRefreshing$();
  private destroyed$ = new Subject<void>();

  constructor(
    private registerMapService: RegisterMapService,
    private registerFilterService: RegisterFilterService,
    private esriAuthService: CommonEsriAuthService,
    private authStateService: AuthStateService,
    private logger: LoggerService
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
        if (this.isMapInitializing) {
          return;
        }
        try {
          await this.registerMapService.filterBuildingData(
            this.getBuildingWhereCase()
          );
          await this.highlightSelectedBuildingPolygons();
          this.mapAuthError = null;
        } catch (error) {
          this.handleMapError(error);
        }
      });

    this.registerFilterService.globalIdsObservable
      .pipe(takeUntil(this.destroyed$))
      .subscribe(async () => {
        if (this.isMapInitializing) {
          return;
        }
        try {
          await this.updateEntranceLayer();
          this.mapAuthError = null;
        } catch (error) {
          this.handleMapError(error);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['entranceGlobalId']) {
      void this.updateEntranceLayer()
        .then(() => {
          this.mapAuthError = null;
        })
        .catch(error => {
          this.handleMapError(error);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.registerMapService.cleanup();
  }

  async initializeMap(): Promise<void> {
    this.mapAuthError = null;
    this.isMapInitializing = true;
    this.isMapReady = false;

    try {
      const isReady = await firstValueFrom(
        this.esriAuthService.ensureEsriReady(1200, 'esri-auth-retry')
      );

      if (!isReady) {
        this.mapAuthError = $localize`Map authentication failed. Please retry.`;
        return;
      }

      const mapInitPromise = this.registerMapService.init(this.mapViewEl, {
        enableFilter: this.enableFilter,
        enableSelection: this.enableSelection,
        enableLegend: this.enableLegend,
        showBuildingLayer: this.showBuildingLayer,
        showEntranceLayer: this.showEntranceLayer,
        bldWhereCase: this.getBuildingWhereCase(),
        entWhereCase: this.getEntranceWhereCase(),
      });

      // The view is created synchronously at init start; clear the overlay as
      // soon as the map is usable, even if background map setup is still running.
      if (this.registerMapService.hasActiveView()) {
        this.isMapReady = true;
      }

      await mapInitPromise;
      await this.highlightSelectedBuildingPolygons();
      await this.highlightSelectedEntrancePoint();
      this.mapAuthError = null;
      this.isMapReady = true;
    } catch (error) {
      if (this.registerMapService.hasActiveView()) {
        // Keep map usable when initial filtering fails after view bootstrap.
        this.mapAuthError = null;
        this.isMapReady = true;
      } else {
        this.handleMapError(error);
      }
    } finally {
      this.isMapInitializing = false;
    }
  }

  retryMapAuth() {
    this.registerMapService.cleanup();
    void this.initializeMap();
  }

  private getBuildingWhereCase() {
    return this.registerFilterService.prepareWhereCase({
      includeGlobalId: !this.highlightSelectedBuildings,
    });
  }

  private async highlightSelectedBuildingPolygons() {
    if (!this.highlightSelectedBuildings) {
      return;
    }
    await this.registerMapService.highlightBuildings(
      this.registerFilterService.getSelectedBuildingGlobalIds()
    );
  }

  private getEntranceWhereCase() {
    return this.registerFilterService.prepareWhereCaseForEntrance(
      this.entranceGlobalId,
      { includeEntranceId: !this.highlightSelectedEntrance }
    );
  }

  private async updateEntranceLayer() {
    await this.registerMapService.filterEntranceData(
      this.getEntranceWhereCase()
    );
    await this.highlightSelectedEntrancePoint();
  }

  private async highlightSelectedEntrancePoint() {
    if (!this.highlightSelectedEntrance) {
      return;
    }
    await this.registerMapService.highlightEntrance(this.entranceGlobalId);
  }

  private handleMapError(error: unknown) {
    this.logger.error('Map operation failed', error);
    if (this.isMapReady) {
      this.mapAuthError = null;
      return;
    }
    this.mapAuthError = this.esriAuthService.isEsriAuthError(error)
      ? $localize`Map authentication failed. Please retry.`
      : $localize`Could not load map data. Please retry.`;
  }
}
