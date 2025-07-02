import {AfterViewInit, Component, ViewChild} from '@angular/core';
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
import {Router} from "@angular/router";

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
  public fieldWorks$ = this.filedWorkService.fieldWorksAsObservable;
  public fieldWorkState = this.filedWorkService.fieldWorkState;
  public columns = [
    'fieldWorkName',
    'startDate',
    'endDate',
    'fieldWorkStatus',
    'description',
    'actions'
  ];
  public dataSource: MatTableDataSource<FieldWork> = new MatTableDataSource<FieldWork>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor(private filedWorkService: FieldWorkService, private router: Router) {
    this.filedWorkService.loadAllFieldWorks();
    this.filedWorkService.getActiveFieldWork();

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
  }

  addNewFieldWork() {
    this.router.navigateByUrl('dashboard/field-work/create');
  }

  editFieldWork(row: FieldWork) {
    this.router.navigateByUrl('dashboard/field-work/edit/' + row.fieldWorkId);
  }
}
