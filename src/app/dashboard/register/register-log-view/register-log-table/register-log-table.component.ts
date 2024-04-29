import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RegisterLogService} from './register-log.service';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatMenuModule} from '@angular/material/menu';
import {map} from 'rxjs/internal/operators/map';
import {Observable} from 'rxjs/internal/Observable';
import {Log} from '../model/log';
import {MatTooltipModule} from '@angular/material/tooltip';
import {ConcatenateMessagePipe as ConcatinateMessagePipe} from './register-log-message.pipe';
import {LogExecutionPipe} from './register-log-execution.pipe';
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {RegisterLogTableFilterComponent} from "./register-log-table-filter/register-log-table-filter.component";
import {LogFilter} from "../model/log-filter";
import {Chip, ChipComponent} from "../../../../common/standalone-components/chip/chip.component";
import {MatSnackBarModule} from "@angular/material/snack-bar";

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
    LogExecutionPipe,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    RegisterLogTableFilterComponent,
    ChipComponent,
    MatSnackBarModule
  ],
  providers: [
    RegisterLogService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-log-table.component.html',
  styleUrls: ['./register-log-table.component.css']
})
export class RegisterLogTableComponent implements OnInit, AfterViewInit {
  @Input() building!: string;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild("confirmDialog") confirmDialog!: TemplateRef<any>;
  private dataSource: MatTableDataSource<Log> = new MatTableDataSource<Log>();

  public isLoadingResults = this.logService.isLoadingResults;
  public executionStatus = this.logService.isExecutingRules;
  public isResolvingLog = this.logService.isResolvingLog;
  public buildingQuality = this.logService.bldQuality;
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
  private filter = {
    entityType: '',
    variable: '',
    status: '',
    qualityAction: '',
    errorLevel: ''
  } as LogFilter;

  dataSourceObservable: Observable<MatTableDataSource<Log>> = this.logService.logs.pipe(
    map(logs => {
      const dataSource = this.dataSource;
      dataSource.data = logs;
      this.resultsLength = logs.length;
      return dataSource;
    })
  );

  get filterChips(): Chip[] {
    return Object
      .entries(this.filter)
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({ column: key, value: value }));
  }

  constructor(
    private logService: RegisterLogService,
    private changeDetectionRef: ChangeDetectorRef,
    private matDialog: MatDialog) {
  }

  ngOnInit(): void {
    this.logService.loadLogs(this.building);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  startExecuting() {
    this.logService.executeRules(this.building);
  }

  filterData() {
    this.matDialog.open(RegisterLogTableFilterComponent, {data: this.filter})
      .afterClosed()
      .subscribe((filter) => {
        if (filter) {
          this.filter = filter;
          this.filterLogs();
        }
    });
  }

  remove($event: Chip) {
    (this.filter as any)[$event.column] = '';
    this.filterLogs();
  }

  resolve(id: string) {
    this.matDialog.open(this.confirmDialog).afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.logService.resolveLog(id, this.building);
      }
    });
  }

  private filterLogs() {
    this.paginator.firstPage();
    const logs = this.logService.logsValue;
    this.dataSource.data = logs.filter(log => {
      const variableCondition = this.filter.variable ? log.variable === this.filter.variable : true;
      const entityCondition = this.filter.entityType ? log.entityType === this.filter.entityType : true;
      const qualityActionCondition = this.filter.qualityAction ? log.qualityAction === this.filter.qualityAction : true;

      return variableCondition && entityCondition && qualityActionCondition;
    });
    this.resultsLength = this.dataSource.data.length;
  }
}
