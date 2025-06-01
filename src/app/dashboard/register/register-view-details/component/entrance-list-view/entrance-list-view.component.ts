import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  isDevMode,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {catchError, merge, of as observableOf, startWith, Subject, switchMap, takeUntil} from 'rxjs';
import {Chip, ChipComponent} from 'src/app/common/standalone-components/chip/chip.component';
import {ActivatedRoute, Router} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {CommonModule} from '@angular/common';
import {EntranceListViewFilterComponent} from './entrance-list-view-filter/entrance-list-view-filter.component';
import {Entrance, EntranceFilter} from '../../../model/entrance';
import {QueryFilter} from '../../../model/query-filter';
import {CommonEntranceService} from '../../../../common/service/common-entrance.service';
import {CommonRegisterHelperService} from '../../../../common/service/common-helper.service';
import {EntranceDetailsComponent} from './entrance-details/entrance-details.component';
import {RegisterLogService} from "../../../register-log-view/register-log-table/register-log.service";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";
import {CommonStreetService} from "../../../../common/service/common-street.service";
import {
  EntityDeleteConfirmationDialogComponent,
  EntityDeleteDialogData
} from "../../../../common/components/entity-delete-confirmation-doalog/entity-delete-confirmation-dialog.component";
import {MatDivider} from "@angular/material/divider";

@Component({
  selector: 'asrdb-entrance-list-view',
  templateUrl: './entrance-list-view.component.html',
  styleUrls: ['./entrance-list-view.component.css'],
  standalone: true,
  providers: [CommonEntranceService, CommonStreetService],
  imports: [
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    ChipComponent,
    MatProgressSpinnerModule,
    CommonModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDivider
  ]
})
export class EntranceListViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() buildingGlobalId?: string;
  @Input() building?: any;
  @Output() entrancesLoaded = new EventEmitter<Entrance[]>();
  @Output() entranceSelected = new EventEmitter<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  buildingIdQueryParam?: string | null;
  selectedEntrance: string | undefined;

  private columns = [
    'EntBldGlobalID',
    'EntStrGlobalID',
    'GlobalID',
    'ObjectID',
    'EntBuildingNumber',
    'EntEntranceNumber',
    'EntDwellingRecs',
    'EntDwellingExpec',
    'EntQuality',
  ];
  private destroy$ = new Subject();

  displayedColumns: string[] = this.columns
    .concat(['actions'])
    .filter(column => !['ObjectID', 'EntBldGlobalID'].includes(column));
  data: any[] = [];
  fields: any[] = [];
  resultsLength = 0;
  isLoadingResults = true;

  // TODO: Add correct filter
  filterConfig: EntranceFilter = {
    filter: {
      EntBuildingNumber: 0,
      EntEntranceNumber: 0,
      EntPointStatus: '',
      GlobalID: '',
      EntBldGlobalID: ''
    },
    options: {
      EntPointStatus: [] as any[],
    }
  };

  get filterChips(): Chip[] {
    return Object
      .entries(this.filterConfig.filter)
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({column: key, value: this.getValueFromStatus(key, value.toString())}));
  }

  constructor(
    private commonEntranceService: CommonEntranceService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private commonStreetService: CommonStreetService,
    private matDialog: MatDialog,
    private matSnack: MatSnackBar,
    private registerLogService: RegisterLogService,
    private router: Router,
    private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this.buildingIdQueryParam = this.activatedRoute.snapshot.queryParamMap.get('building');
    if (this.buildingIdQueryParam) {
      this.filterConfig.filter.EntBldGlobalID = this.buildingIdQueryParam?.replace('{', '').replace('}', '');
    } else if (this.buildingGlobalId) {
      this.filterConfig.filter.EntBldGlobalID = this.buildingGlobalId?.replace('{', '').replace('}', '');
    }
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.pipe(takeUntil(this.destroy$)).subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        takeUntil(this.destroy$),
        startWith({}),
        switchMap(() => this.loadEntrances()),
      )
      .subscribe((res) => this.handleResponse(res));
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  getValueFromStatus(column: string, code: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, code);
  }

  openFilter() {
    this.matDialog
      .open(EntranceListViewFilterComponent, {
        data: {filter: JSON.parse(JSON.stringify(this.filterConfig)), showBuildingIdFilter: !this.buildingGlobalId}
      }).afterClosed().pipe(takeUntil(this.destroy$)).subscribe((newFilterConfig: EntranceFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  reload() {
    this.loadEntrances().pipe(takeUntil(this.destroy$)).subscribe((res) => this.handleResponse(res));
  }

  remove($event: Chip) {
    (this.filterConfig.filter as any)[$event.column] = '';
    this.reload();
  }

  viewEntranceDetails(globalId: string) {
    this.matDialog.open(EntranceDetailsComponent, {
      width: '80vw',
      data: {
        globalId,
        buildingGlobalId: this.buildingGlobalId,
        building: this.building,
        logs: this.registerLogService.getAllLogs('ENTRANCE')
          .filter(log => globalId.toLowerCase().includes(log.entId?.toLowerCase() as string))
      }
    });
  }

  createEntrance(buildingId: string) {
    this.router.navigateByUrl('dashboard/register/form/ENTRANCE/' + buildingId);
  }


  editEntrance(buildingId: string, globalId: string) {
    this.router.navigateByUrl('dashboard/register/form/ENTRANCE/' + buildingId + '?entranceId=' + globalId);
  }

  selectEntrance(entranceId: string) {
    this.entranceSelected.emit(entranceId);
    this.selectedEntrance = entranceId;
  }

  openDeleteDialog(globalId: string) {
    const dialog = this.matDialog.open(EntityDeleteConfirmationDialogComponent, {
      hasBackdrop: true,
      disableClose: true,
      data: {
        type: 'ENTRANCE',
        idToDelete: globalId,
        reload: () => {
          this.reload();
          this.selectedEntrance = undefined;
          this.entranceSelected.emit("");
          dialog.close();
        }
      } as EntityDeleteDialogData
    });
  }

  private handlePopupClose(newFilterConfig: EntranceFilter | null) {
    if (newFilterConfig) {
      this.filterConfig = newFilterConfig;
      this.reload();
    }
  }

  private prepareWhereCase() {
    const conditions: string[] = ['EntQuality <> 0'];
    Object
      .entries(this.filterConfig.filter)
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({column: key, value} as Chip))
      .forEach(filter => {
        conditions.push(filter.column + '=' + this.getWhereConditionValue(filter.value));
      });
    return conditions.length ? conditions.join(' and ') : '1=1';
  }

  private getWhereConditionValue(value: string | number) {
    return (typeof value == 'number') ? value : `'${value}'`;
  }

  private loadEntrances() {
    this.isLoadingResults = true;
    const filter = {
      start: this.paginator.pageIndex * this.paginator.pageSize,
      num: this.paginator.pageSize,
      outFields: this.columns,
      where: this.prepareWhereCase()
    } as Partial<QueryFilter>;
    if (this.sort?.active) {
      filter.orderByFields = [this.sort.active + ' ' + this.sort.direction.toUpperCase()];
    }
    return this.commonEntranceService
      .getEntranceData(filter)
      .pipe(
        catchError((err) => {
          console.error(err);
          return observableOf(null);
        })
      );
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Entrances: ', res);
    }
    if (!res) {
      this.matSnack.open('Could not load result. Please try again', 'Ok', {duration: 3000});
      this.isLoadingResults = false;
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.resultsLength = res.count;

    const attributes = res.data.features.map((feature: any) => feature.attributes);
    const streetIds = attributes.map((el: any) => el.EntStrGlobalID.replace('{', '').replace('}', ''));

    this.commonStreetService.getStreets({
      where: `GlobalID in (${streetIds.map((id: string) => `'${id}'`).join(',')})`,
      outFields: ['GlobalID', 'StrNameCore']
    }).pipe(takeUntil(this.destroy$))
      .subscribe((streetRes) => {
        const streets = streetRes.data.features.map((feature: any) => feature.attributes);
        attributes.forEach((attribute: any) => {
          const street = streets
            .find((streat: any) => streat.GlobalID === attribute.EntStrGlobalID);
          attribute.EntStrGlobalID = street?.StrNameCore;
        });
        this.data = attributes;
        this.isLoadingResults = false;
        this.prepareFilter();
        this.entrancesLoaded.emit(this.data);
      });
  }

  private prepareFilter() {
    this.filterConfig = {
      ...this.filterConfig,
      options: {
        EntPointStatus: this.getOptions('EntPointStatus').length
          ? this.getOptions('EntPointStatus')
          : this.filterConfig.options.EntPointStatus,
      }
    };
  }

  private getOptions(column: string) {
    const field = this.commonBuildingRegisterHelper.getField(this.fields, column);
    if (!field) {
      return [];
    }
    return field.domain?.codedValues?.map((codeValue: { name: string, code: string }) => {
      return {
        name: codeValue.name,
        code: codeValue.code,
      };
    });
  }
}
