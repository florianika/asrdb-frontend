import {Component, isDevMode, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {BuildingDetailComponent} from './component/building-detail/building-detail.component';
import {EntranceListViewComponent} from './component/entrance-list-view/entrance-list-view.component';
import {DwellingListViewComponent} from './component/dwelling-list-view/dwelling-list-view.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, Router} from '@angular/router';
import {catchError, of, Subject, takeUntil} from 'rxjs';
import {QueryFilter} from '../model/query-filter';
import {CommonBuildingService} from '../../common/service/common-building.service';
import {CommonRegisterHelperService} from '../../common/service/common-helper.service';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Entrance} from '../model/entrance';
import {RegisterMapComponent} from '../../common/components/register-map/register-map.component';
import {RegisterFilterService} from '../register-table-view/register-filter.service';
import {NOT_EXECUTING, RegisterLogService} from '../register-log-view/register-log-table/register-log.service';
import {MatTooltipModule} from '@angular/material/tooltip';
import {CommonEntranceService} from '../../common/service/common-entrance.service';
import {HistoryDetailsComponent} from './component/history-details/history-details.component';
import {MatDivider} from '@angular/material/divider';
import {BUILDING_ENTITY} from '../../../common/constants/common-constants';
import {CommonEntityStructureService, EntityAttribute,} from '../../common/service/common-entity-structure.service';
import {SectionField} from '../constant/common-constants';
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {CommentViewComponent} from "./component/comment-view/comment-view.component";
import {MatMenu, MatMenuModule} from "@angular/material/menu";
import {MatDialog, MatDialogModule, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'asrdb-register-view-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    BuildingDetailComponent,
    EntranceListViewComponent,
    DwellingListViewComponent,
    RegisterMapComponent,
    MatTooltipModule,
    HistoryDetailsComponent,
    MatDivider,
    MatProgressSpinner,
    CommentViewComponent,
    MatMenuModule,
    MatDialogModule
  ],
  providers: [],
  templateUrl: './register-view-details.component.html',
  styleUrls: ['./register-view-details.component.css'],
})
export class RegisterViewDetailsComponent implements OnInit, OnDestroy {
  @ViewChild("approveReview") approveReview?: any;
  @ViewChild("rejectReview") rejectReview?: any;

  isLoadingResults = true;
  isUpdatingFeature = false;
  building: any;
  selectedEntrance: string | undefined;
  id?: string = '';

  sections = [
    {
      title: 'Technical variables',
      entries: [] as SectionField[],
    },
    {
      title: 'Identifying variables',
      entries: [] as SectionField[],
    },
    {
      title: 'Describing variables',
      entries: [] as SectionField[],
    },
  ];
  titleSection = [] as SectionField[];
  loadedEntrances: Entrance[] = [];
  isExecutingRules = false;

  private destroy$ = new Subject();
  private fields: any[] = [];
  private dialog?: MatDialogRef<any>;

  constructor(
    private commonBuildingService: CommonBuildingService,
    private commonEntranceService: CommonEntranceService,
    private commonEntityStructureService: CommonEntityStructureService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private registerFilterService: RegisterFilterService,
    private registerLogService: RegisterLogService,
    private matSnack: MatSnackBar,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private matDialog: MatDialog
  ) {
    this.commonEntityStructureService.structureLoaded
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        if (!response.loading && response.structure && response.type === BUILDING_ENTITY) {
          this.prepareStructure(response.structure);
          this.loadLogs();
        }
      });
  }

  ngOnInit(): void {
    this.id = this.activatedRoute.snapshot.paramMap.get('id') ?? '';
    if (this.id) {
      this.registerLogService.loadLogs(this.id);
      this.loadBuildingData();
      this.commonEntityStructureService.getEntityStructure(BUILDING_ENTITY);
    } else {
      void this.router.navigateByUrl('dashboard/register');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  getTitle(column: string) {
    return this.commonBuildingRegisterHelper.getTitle(this.fields, column);
  }

  getMunicipality(): string | number {
    return this.commonBuildingRegisterHelper.getMunicipality(
      this.fields,
      'BldMunicipality',
      this.building.BldMunicipality
    );
  }

  getValueFromStatus(column: string) {
    return (
      this.commonBuildingRegisterHelper.getValueFromStatus(
        this.fields,
        column,
        this.building[column]
      ) ?? ''
    );
  }

  editBuilding(globalId: string) {
    this.router.navigateByUrl('dashboard/register/form/BUILDING/' + globalId);
  }

  setEntrances(entrances: Entrance[]) {
    this.loadedEntrances = entrances;
  }

  setSelectedEntrance(entranceId: string) {
    this.selectedEntrance = entranceId;
  }

  markEntranceAsUntestedData(entranceId: string) {
    const entrance = this.loadedEntrances.find(
      entrance => entrance.GlobalID === entranceId
    );
    if (entrance) {
      // Update entrance
      this.commonEntranceService.resetStatus(entranceId);

      // Update building
      this.commonBuildingService.resetStatus(this.id!, () => {
        setTimeout(() => {
          this.loadBuildingData();
        }, 500);
      });
    }
  }

  gotToLogs() {
    this.router.navigateByUrl('dashboard/register/logs?buildings=' + this.id);
  }

  startExecution() {
    this.registerLogService.executeRules(this.id!);
    this.matSnack.open('Started execution of quality rules', 'Ok', {
      duration: 5000,
    });
    this.isExecutingRules = true;
    const subscription = this.registerLogService.isExecutingRules
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
      if (value === NOT_EXECUTING) {
        this.matSnack.open('Execution of quality rules finished. Reloading logs!', 'Ok', {
          duration: 5000,
        });
        subscription.unsubscribe();
        this.loadBuildingData();
      }
    });
  }

  goBack() {
    this.router.navigateByUrl('dashboard/register?from=details');
  }

  openApproveReview() {
    if (this.approveReview) {
      this.dialog = this.matDialog.open(this.approveReview);
    }
  }

  approveReviewForBuilding() {
    this.isUpdatingFeature = true;
    const feature = {
      attributes: {
        ...this.building,
        BldReview: 2,
      }
    }
    this.commonBuildingService
      .updateFeature([feature])
      .pipe(takeUntil(this.destroy$), catchError(err => {
        console.error('Error updating feature', err);
        this.isUpdatingFeature = false;
        this.matSnack.open('Could not approve review. Please try again.', 'Ok', {
          duration: 3000,
        });
        return of(null);
      }))
      .subscribe(feature => {
        if (feature) {
          if (isDevMode()) {
            console.log('Feature updated', feature);
          }
          this.matSnack.open('Review approved successfully', 'Ok', {
            duration: 3000,
          });
          this.dialog?.close();
          this.loadBuildingData();
        }
        this.isUpdatingFeature = false;
      })
  }

  openRejectReview() {
    if (this.rejectReview) {
      this.dialog = this.matDialog.open(this.rejectReview);
    }
  }

  rejectReviewForBuilding() {
    this.isUpdatingFeature = true;
    const feature = {
      attributes: {
        ...this.building,
        BldReview: 5,
      }
    }
    this.commonBuildingService
      .updateFeature([feature])
      .pipe(takeUntil(this.destroy$), catchError(err => {
        console.error('Error updating feature', err);
        this.isUpdatingFeature = false;
        this.matSnack.open('Could not reject review. Please try again.', 'Ok', {
          duration: 3000,
        });
        return of(null);
      }))
      .subscribe(feature => {
        if (feature) {
          if (isDevMode()) {
            console.log('Feature updated', feature);
          }
          this.matSnack.open('Review reopened successfully', 'Ok', {
            duration: 3000,
          });
          this.dialog?.close();
          this.loadBuildingData();
        }
        this.isUpdatingFeature = false;
      });
  }

  private loadLogs() {
    this.registerLogService.logs
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.fields.length) {
          this.isExecutingRules = false;
          this.fillSections();
        }
      });
  }

  private prepareWhereCase() {
    return `GlobalID='${this.id}'`;
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Data', res);
    }
    if (!res) {
      this.matSnack.open('Could not load result. Please try again', 'Ok', {
        duration: 3000,
      });
      this.isLoadingResults = false;
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.building = res.data.features.map(
      (feature: any) => feature.attributes
    )[0];
    this.fillSections();
    this.isLoadingResults = false;
  }

  private fillSections() {
    this.sections.forEach(section => {
      section.entries.forEach(entry => {
        entry.value = this.getValue(entry);
        entry.log =
          this.registerLogService.getLogForVariable(
            BUILDING_ENTITY,
            entry.propName,
            this.id
          )?.qualityMessageEn ?? '';
        entry.logType =
          this.registerLogService.getLogForVariable(
            BUILDING_ENTITY,
            entry.propName,
            this.id
          )?.qualityAction ?? '';
      });
    });
  }

  private getValue(entry: any) {
    return entry.propName === 'BldMunicipality'
      ? this.getMunicipality()
      : this.getValueFromStatus(entry.propName);
  }

  private loadBuilding() {
    this.isLoadingResults = true;
    const filter = {
      where: this.prepareWhereCase(),
    } as Partial<QueryFilter>;
    return this.commonBuildingService.getBuildingData(filter).pipe(
      catchError(err => {
        console.log(err);
        this.matSnack.open('Could not load building. Please try again.', 'Ok', {
          duration: 3000,
        });
        return of(null);
      })
    );
  }

  private loadBuildingData() {
    this.loadBuilding()
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => this.handleResponse(res));
  }

  private prepareStructure(structure: EntityAttribute[]) {
    const visibleFields = structure.reduce(
      (acc, attr: EntityAttribute) => {
        if (attr.section !== 'none' && !attr.internal) {
          if (attr.section === 'technical') {
            acc.technical.push({
              title: attr.label.en,
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          } else if (attr.section === 'identification') {
            acc.identifying.push({
              title: attr.label.en,
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          } else if (attr.section === 'info') {
            acc.describing.push({
              title: attr.label.en,
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          } else if (attr.section === 'title') {
            acc.title.push({
              title: attr.label.en,
              propName: attr.name,
              value: '',
              log: '',
              logType: '',
            } as SectionField);
          }
        }
        return acc;
      },
      {
        technical: [] as SectionField[],
        identifying: [] as SectionField[],
        describing: [] as SectionField[],
        title: [] as SectionField[],
      }
    );

    this.sections[0].entries = visibleFields.technical;
    this.sections[1].entries = visibleFields.identifying;
    this.sections[2].entries = visibleFields.describing;
    this.titleSection = visibleFields.title;
  }
}
