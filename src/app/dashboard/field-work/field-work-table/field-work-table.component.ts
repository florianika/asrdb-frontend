import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FieldWork, FieldWorkService } from '../field-work.service';
import { DatePipe, NgIf } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'asrdb-field-work-table',
  standalone: true,
  imports: [
    NgIf,
    MatProgressSpinner,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    DatePipe,
    MatTooltipModule,
  ],
  templateUrl: './field-work-table.component.html',
  styleUrl: './field-work-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldWorkTableComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  private fieldWorkService = inject(FieldWorkService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroyed$ = new Subject<void>();
  private lastCanBeClosedCheckFieldWorkId: number | null = null;

  public fieldWorksState = this.fieldWorkService.fieldWorksState;
  public fieldWorkState = this.fieldWorkService.fieldWorkState;
  public fieldWorkCanBeClosed = this.fieldWorkService.canBeClosed;
  public columns = [
    'fieldWorkName',
    'startDate',
    'endDate',
    'fieldWorkStatus',
    'description',
    'actions',
  ];
  public dataSource: MatTableDataSource<FieldWork> =
    new MatTableDataSource<FieldWork>();

  constructor() {
    this.fieldWorkService.loadAllFieldWorks();
    this.fieldWorkService.getActiveFieldWork();

    effect(() => {
      const fieldWorkId =
        this.fieldWorkState().activeFieldWork?.fieldWorkId ?? null;
      if (!fieldWorkId) {
        this.lastCanBeClosedCheckFieldWorkId = null;
        return;
      }
      if (this.lastCanBeClosedCheckFieldWorkId === fieldWorkId) {
        return;
      }
      this.lastCanBeClosedCheckFieldWorkId = fieldWorkId;
      this.fieldWorkService.canFieldWorkBeClosed(fieldWorkId, true);
    });

    effect(() => {
      this.dataSource.data = this.fieldWorksState().fieldWorks;
    });
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        if (params['action'] === 'close' && params['fieldWorkId']) {
          this.openDeleteFieldWork(params['fieldWorkId']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  addNewFieldWork() {
    void this.router.navigateByUrl('dashboard/field-work/create');
  }

  editFieldWork(row: FieldWork) {
    void this.router.navigateByUrl(
      'dashboard/field-work/edit/' + row.fieldWorkId
    );
  }

  showActions(row: FieldWork) {
    return this.isNew(row) || this.canBeClosed(row);
  }

  isNew(row: FieldWork) {
    return row.fieldWorkStatus === 'NEW';
  }

  canBeClosed(row: FieldWork): boolean {
    return (
      row.fieldWorkId == this.fieldWorkCanBeClosed()?.fieldWorkId &&
      !!this.fieldWorkCanBeClosed()?.canBeClosed
    );
  }

  openDeleteFieldWork(fieldWorkId: number) {
    void this.router.navigateByUrl('dashboard/field-work/close/' + fieldWorkId);
  }
}
