import {AfterViewInit, Component, effect, inject, ViewChild} from '@angular/core';
import {MatButton} from "@angular/material/button";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatSort, MatSortHeader} from "@angular/material/sort";
import {FieldWorkService} from "../../../field-work.service";
import {FieldWorkStatistics, FieldWorkStatisticService} from "../../../field-work-statistic.service";
import {MatIcon} from "@angular/material/icon";

@Component({
  selector: 'asrdb-field-work-form-step3-statistic-table',
  standalone: true,
  imports: [
    MatButton,
    MatTable,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatPaginator,
    MatProgressSpinner,
    MatRow,
    MatRowDef,
    MatSort,
    MatSortHeader,
    MatHeaderCellDef,
    MatNoDataRow,
    MatIcon
  ],
  providers: [
  ],
  templateUrl: './field-work-form-step3-statistic-table.component.html',
  styleUrl: './field-work-form-step3-statistic-table.component.css'
})
export class FieldWorkFormStep3StatisticTableComponent implements AfterViewInit {
  private _fieldWorkService = inject(FieldWorkService);
  private _fieldWorkStatisticService = inject(FieldWorkStatisticService);

  public fieldWorkState = this._fieldWorkService.fieldWorkState;
  public statistics = this._fieldWorkStatisticService.statistics;

  public columns = [
    'municipality',
    'ruleStatistics',
    'bldStatistics'
  ];
  public dataSource: MatTableDataSource<FieldWorkStatistics> = new MatTableDataSource<FieldWorkStatistics>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor() {
    effect(() => {
      this.dataSource.data = this.statistics().statistics;
      this.dataSource.paginator?.firstPage();
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

  public startFieldWorkJobExecution() {
    const id = this.fieldWorkState().activeFieldWork?.fieldWorkId;
    if (id) {
      this._fieldWorkStatisticService.startFieldWorkJobExecution(id);
    }
  }
}
