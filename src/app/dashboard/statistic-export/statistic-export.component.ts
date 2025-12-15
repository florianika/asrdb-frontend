import {AfterViewInit, Component, effect, inject, OnInit, ViewChild} from '@angular/core';
import {StatisticExportService} from './statistic-export.service';
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSort, MatSortModule} from "@angular/material/sort";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {DatePipe} from "@angular/common";
import {FieldWorkService} from "../field-work/field-work.service";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatDialog} from "@angular/material/dialog";
import {StatisticExportCreateComponent} from "./statistic-export-create/statistic-export-create.component";

@Component({
  selector: 'asrdb-statistic-export',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinner,
    MatMenuModule,
    DatePipe,
    MatTooltipModule
  ],
  templateUrl: './statistic-export.component.html',
  styleUrl: './statistic-export.component.css'
})
export class StatisticExportComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, {static: true}) sort!: MatSort;

  private statisticExportService = inject(StatisticExportService);
  private fieldWorkService = inject(FieldWorkService);
  private matSnackBar = inject(MatSnackBar);
  private matDialog = inject(MatDialog);

  public statisticsTableData = this.statisticExportService.statisticsTableData;
  public fieldWork = this.fieldWorkService.fieldWorkState;
  public tableColumns = ['id', 'referenceYear', 'createdBy', 'createdAt', 'completedAt', 'lastUpdatedBy', 'status', 'actions'];
  public datasource = new MatTableDataSource();

  get hasActiveFieldWork(): boolean {
    return this.fieldWork().activeFieldWork !== null;
  }

  get downloadRowId() {
    return this.statisticsTableData().downloadRowId;
  }

  constructor() {
    effect(() => {
      if (!this.statisticsTableData().isLoading) {
        this.datasource.data = this.statisticsTableData().data;
      }
    });
  }

  ngOnInit() {
    this.statisticExportService.getAllStatistics();
    this.fieldWorkService.getActiveFieldWork();
  }

  ngAfterViewInit() {
    this.datasource.sort = this.sort;
  }

  download(url: string, rowId: number) {
    this.statisticExportService.downloadFile(url, rowId);
  }

  add() {
    if (this.hasActiveFieldWork) {
      this.matSnackBar.open("You cannot generate statistics while a field work is active.", "Close", { duration: 4000 });
    }
    this.matDialog
      .open(
        StatisticExportCreateComponent,
        {
          width: '900px',
          height: '600px',
          disableClose: true,
        }
      )
      .afterClosed()
      .subscribe({
        next: () => {
          this.statisticExportService.reset();
          this.statisticExportService.getAllStatistics();
        }
    });
  }
}
