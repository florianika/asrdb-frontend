import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterLogService } from './register-log.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { map } from 'rxjs/internal/operators/map';
import { Observable } from 'rxjs/internal/Observable';
import { Log } from '../model/log';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConcatenateMessagePipe as ConcatinateMessagePipe } from './register-log-message.pipe';
import { LogExecutionPipe } from './register-log-execution.pipe';

@Component({
  selector: 'asrdb-register-log-table-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    ConcatinateMessagePipe,
    LogExecutionPipe
  ],
  providers: [
    RegisterLogService
  ],
  templateUrl: './register-log-table.component.html',
  styleUrls: ['./register-log-table.component.css']
})
export class RegisterLogTableComponent implements OnInit, AfterViewInit {
  @Input() building!: string;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private dataSource: MatTableDataSource<Log> = new MatTableDataSource();
  private interval: any = null;

  public isLoadingResults = this.logService.isLoadingResults;
  public executionStatus = this.logService.isExecutingRules;
  public displayedColumns = [
    'ruleId',
    'bldId',
    'entId',
    'dwlId',
    'qualityMessageAl',
    'entityType',
    'variable',
    'qualityStatus',
    'qualityAction',
    'errorLevel',
    'actions'
  ];
  public resultsLength = 0;

  dataSourceObservable: Observable<MatTableDataSource<Log>> = this.logService.logs.pipe(
    map(logs => {
      const dataSource = this.dataSource;
      dataSource.data = logs;
      this.resultsLength = logs.length;
      return dataSource;
    })
  );

  constructor(
    private logService: RegisterLogService) {

  }

  ngOnInit(): void {
    this.logService.loadLogs(this.building);
    this.logService.getExecutionStatus(this.building);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // TODO: Cean this. test only.
    this.interval = setInterval(() => {
      const data = this.dataSource.data;
      data.push(...data);
      this.dataSource.data = data;
      if (data.length > 100) {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  cleanInterval() {
    clearInterval(this.interval);
  }

}
