import {
  AfterViewInit,
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { RegisterViewDetailsService } from '../../register-view-details.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { merge, Subject, takeUntil } from 'rxjs';
import { DwellingDetailsService } from '../dwelling-details.service';
import { Dwelling } from '../../../model/dwelling';
import { AuthStateService } from '../../../../../common/services/auth-state.service';
import { DWELLING_ENTITY } from '../../../../../common/constants/common-constants';
import { MatDialog } from '@angular/material/dialog';
import { EntranceDetailsService } from '../../entrance/entrance-details.service';
import { DwellingDetailsFormComponent } from '../../../register-form/dwelling-details-form/dwelling-details-form.component';
import { Log } from '../../../register-log-view/model/log';
import {
  EntityDeleteConfirmationDialogComponent,
  EntityDeleteDialogData,
} from '../../../../common/components/entity-delete-confirmation-doalog/entity-delete-confirmation-dialog.component';

const DWELLINGS_LIST_COLUMNS = [
  'GlobalID',
  'BldNumber',
  'EntNumber',
  'DwlFloor',
  'DwlApartNumber',
  'DwlStatus',
  'DwlType',
  'DwlQuality',
];

@Component({
  selector: 'asrdb-dwelling-list',
  standalone: true,
  imports: [
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinner,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './dwelling-list.component.html',
  styleUrl: './dwelling-list.component.css',
})
export class DwellingListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private destroy$ = new Subject();

  private dwellingDetailsService = inject(DwellingDetailsService);
  private entranceDetailsService = inject(EntranceDetailsService);
  private registerViewDetailsService = inject(RegisterViewDetailsService);
  private authStateService = inject(AuthStateService);

  private matDialog = inject(MatDialog);

  private viewData = this.dwellingDetailsService.viewData;
  private entranceViewData = this.entranceDetailsService.viewData;
  private buildingViewData = this.registerViewDetailsService.viewData;

  get displayedColumns() {
    return DWELLINGS_LIST_COLUMNS.concat(['actions']);
  }

  get totalCount() {
    return this.viewData().totalCount;
  }

  get entranceId() {
    return this.viewData().entranceId;
  }

  get isLoadingDwellings() {
    return this.viewData().isLoadingDwellings;
  }

  get dwellings() {
    return this.viewData().dwellingList;
  }

  get buildingNumber(): number {
    return this.entranceViewData().selectedEntrance?.EntBuildingNumber || 0;
  }

  get entranceNumber(): number {
    return this.entranceViewData().selectedEntrance?.EntEntranceNumber || 0;
  }

  get isAdmin() {
    return this.authStateService.isAdmin();
  }

  constructor() {
    effect(
      () => {
        if (this.entranceViewData().selectedEntrance) {
          this.dwellingDetailsService.viewData.update(data => ({
            ...data,
            entranceId:
              this.entranceViewData().selectedEntrance?.GlobalID || '',
          }));
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.dwellingDetailsService.init();
  }

  ngAfterViewInit() {
    // If the user changes the sort order, reset back to the first page.
    if (this.entranceId) {
      merge(this.paginator.page)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.dwellingDetailsService.init(
            this.paginator.pageIndex,
            this.paginator.pageSize
          );
        });
      return;
    }
    merge(this.paginator.page)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.dwellingDetailsService.init(
          this.paginator.pageIndex,
          this.paginator.pageSize
        );
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  viewDwellingDetails(id: string) {
    const logs = this.buildingViewData().logs;
    this.dwellingDetailsService.viewDwellingDetails(
      id,
      logs,
      this.buildingNumber,
      this.entranceNumber,
      this.entranceId
    );
  }

  addDwelling() {
    this.matDialog
      .open(DwellingDetailsFormComponent, {
        width: '600px',
        data: {
          entrances: this.entranceViewData().entranceList,
          logs: [],
          entranceId: this.entranceId,
        },
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.registerViewDetailsService.markAsUntested(
          this.buildingViewData().building?.GlobalID || '',
          this.entranceId
        );
        this.entranceDetailsService.dialogRef?.close();
      });
  }

  editDwellingDetails(id: string) {
    this.matDialog
      .open(DwellingDetailsFormComponent, {
        width: '600px',
        data: {
          entrances: this.entranceViewData().entranceList,
          id: id,
          entranceId: this.entranceId,
          logs: this.dwellingDetailsService.getLogs(id),
        },
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: string) => {
        if (!data) {
          return;
        }
        this.registerViewDetailsService.markAsUntested(
          this.buildingViewData().building?.GlobalID || '',
          this.entranceId
        );
        this.entranceDetailsService.dialogRef?.close();
      });
  }

  openDeleteDialog(id: string) {
    const dialog = this.matDialog.open(
      EntityDeleteConfirmationDialogComponent,
      {
        hasBackdrop: true,
        disableClose: true,
        data: {
          type: DWELLING_ENTITY,
          idToDelete: id,
          reload: () => {
            const buildingGlobalId =
              this.buildingViewData().building?.GlobalID || '';
            if (buildingGlobalId) {
              this.registerViewDetailsService.startExecution(
                buildingGlobalId,
                () => {
                  this.registerViewDetailsService.markAsUntested(
                    buildingGlobalId,
                    this.entranceId
                  );
                }
              );
            }
            dialog.close();
          },
        } as EntityDeleteDialogData,
      }
    );
  }

  reload() {
    this.dwellingDetailsService.init(
      this.paginator?.pageIndex,
      this.paginator?.pageSize
    );
  }

  getValueFromStatus(key: string, element: Dwelling) {
    return this.dwellingDetailsService.getValueFromStatus(
      key as keyof Dwelling,
      element
    );
  }
}
