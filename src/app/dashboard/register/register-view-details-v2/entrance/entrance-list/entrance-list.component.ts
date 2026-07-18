import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { EntranceDetailsService } from '../entrance-details.service';
import { EntranceDetailsDialogService } from '../entrance-details-dialog.service';
import { Entrance } from '../../../model/entrance';
import { AuthorizationPolicyService } from '../../../../../common/services/authorization-policy.service';
import { RegisterViewDetailsService } from '../../register-view-details.service';
import { merge, startWith, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import {
  EntityDeleteConfirmationDialogComponent,
  EntityDeleteDialogData,
} from '../../../../common/components/entity-delete-confirmation-doalog/entity-delete-confirmation-dialog.component';
import { ENTRANCE_ENTITY } from '../../../../../common/constants/common-constants';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'asrdb-entrance-list',
    imports: [
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatDividerModule,
    ],
    templateUrl: './entrance-list.component.html',
    styleUrl: './entrance-list.component.css'
})
export class EntranceListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

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
  private destroy$ = new Subject<boolean>();

  displayedColumns: string[] = this.columns
    .concat(['actions'])
    .filter(column => !['ObjectID', 'EntBldGlobalID'].includes(column));

  private router = inject(Router);
  private authorizationPolicy = inject(AuthorizationPolicyService);
  private entranceDetailsService = inject(EntranceDetailsService);
  private entranceDetailsDialogService = inject(EntranceDetailsDialogService);
  private registerViewDetailsService = inject(RegisterViewDetailsService);
  private matDialog = inject(MatDialog);

  private viewData = this.entranceDetailsService.viewData;
  private buildingViewData = this.registerViewDetailsService.viewData;

  ngOnInit() {
    const buildingId = this.buildingViewData().building?.GlobalID;
    this.entranceDetailsService.viewData.update(data => ({
      ...data,
      buildingId: buildingId ?? '',
    }));
    this.entranceDetailsService.init();
  }

  ngAfterViewInit() {
    merge(this.paginator.page)
      .pipe(takeUntil(this.destroy$), startWith({}))
      .subscribe(() =>
        this.entranceDetailsService.init(
          this.paginator.pageIndex,
          this.paginator.pageSize
        )
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  get entranceList() {
    return this.viewData().entranceList;
  }

  get isLoadingResults() {
    return this.viewData().isLoadingEntrances;
  }

  get canManageEntities() {
    return this.authorizationPolicy.can('manage-entities');
  }

  get canDeleteEntities() {
    return this.authorizationPolicy.can('delete-entities');
  }

  get selectedEntrance() {
    return this.viewData().selectedEntrance;
  }

  get totalCount() {
    return this.viewData().totalCount;
  }

  createEntrance() {
    const buildingId = this.viewData().buildingId;
    void this.router.navigateByUrl(
      'dashboard/register/form/ENTRANCE/' + buildingId
    );
  }

  getValueFromStatus(key: string, entrance?: Entrance) {
    if (entrance) {
      return this.entranceDetailsService.getValueFromStatus(
        key as keyof Entrance,
        entrance
      );
    }
    return this.entranceDetailsService.getValueFromStatus(
      key as keyof Entrance
    );
  }

  reload() {
    this.entranceDetailsService.init(
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
  }

  viewEntranceDetails(id: string) {
    const logs = this.buildingViewData().logs;
    this.entranceDetailsDialogService.open(id, logs);
  }

  editEntrance(id: string) {
    const buildingId = this.viewData().buildingId;
    void this.router.navigateByUrl(
      'dashboard/register/form/ENTRANCE/' + buildingId + '?entranceId=' + id
    );
  }

  openDeleteDialog(id: string) {
    const dialog = this.matDialog.open(
      EntityDeleteConfirmationDialogComponent,
      {
        hasBackdrop: true,
        disableClose: true,
        data: {
          type: ENTRANCE_ENTITY,
          idToDelete: id,
          reload: () => {
            const buildingGlobalId =
              this.buildingViewData().building?.GlobalID || '';
            if (buildingGlobalId) {
              this.registerViewDetailsService.markAsUntested(
                buildingGlobalId,
                undefined
              );
              dialog.close();
            }
          },
        } as EntityDeleteDialogData,
      }
    );
  }

  selectEntrance(entrance: Entrance) {
    this.entranceDetailsService.viewData.update(data => ({
      ...data,
      selectedEntrance: entrance,
    }));
  }
}
