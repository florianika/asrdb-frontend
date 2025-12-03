import {AfterViewInit, Component, effect, inject, ViewChild} from '@angular/core';
import {FieldWork, FieldWorkService} from "../field-work.service";
import {AsyncPipe, DatePipe, NgIf} from "@angular/common";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatPaginator, MatPaginatorModule} from "@angular/material/paginator";
import {MatSort, MatSortModule} from "@angular/material/sort";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'asrdb-field-work-table',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    MatProgressSpinner,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    DatePipe,
    MatTooltipModule
  ],
  templateUrl: './field-work-table.component.html',
  styleUrl: './field-work-table.component.css'
})
export class FieldWorkTableComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  private fieldWorkService = inject(FieldWorkService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public fieldWorks$ = this.fieldWorkService.fieldWorksAsObservable;
  public fieldWorkState = this.fieldWorkService.fieldWorkState;
  public fieldWorkCanBeClosed = this.fieldWorkService.canBeClosed;
  public columns = [
    'fieldWorkName',
    'startDate',
    'endDate',
    'fieldWorkStatus',
    'description',
    'actions'
  ];
  public dataSource: MatTableDataSource<FieldWork> = new MatTableDataSource<FieldWork>();

  constructor() {
    this.fieldWorkService.loadAllFieldWorks();
    this.fieldWorkService.getActiveFieldWork();

    effect(() => {
      const fieldWorkId = this.fieldWorkState().activeFieldWork?.fieldWorkId;
      if (fieldWorkId) {
        this.fieldWorkService.canFieldWorkBeClosed(fieldWorkId);
      }
    });

    this.fieldWorks$.subscribe((fieldWorkState) => {
      this.dataSource.data = fieldWorkState.fieldWorks;
    });
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['action'] === 'close' && params['fieldWorkId']) {
        this.openDeleteFieldWork(params['fieldWorkId']);
      }
    })
  }

  addNewFieldWork() {
    void this.router.navigateByUrl('dashboard/field-work/create');
  }

  editFieldWork(row: FieldWork) {
    void this.router.navigateByUrl('dashboard/field-work/edit/' + row.fieldWorkId);
  }

  showActions(row: FieldWork) {
    return this.isNew(row) || this.canBeClosed(row);
  }

  // TODO: Remove 'true' condition when the backend is ready
  isNew(row: FieldWork) {
    return row.fieldWorkStatus === 'NEW'
  }

  // TODO: Remove 'true' condition when the backend is ready
  canBeClosed(row: FieldWork): boolean {
    return row.fieldWorkId == this.fieldWorkCanBeClosed()?.fieldwork_id
      && !!this.fieldWorkCanBeClosed()?.can_be_closed
  }

  openDeleteFieldWork(fieldWorkId: number) {
    void this.router.navigateByUrl('dashboard/field-work/close/' + fieldWorkId);
  }
}
