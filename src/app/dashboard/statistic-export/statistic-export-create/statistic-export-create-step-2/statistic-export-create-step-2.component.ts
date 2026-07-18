import { Component, effect, inject, ViewChild } from '@angular/core';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  PivotRow,
  StatisticExportService,
} from '../../statistic-export.service';
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
  MatTableDataSource,
} from '@angular/material/table';

import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'asrdb-statistic-export-create-step-2',
  imports: [
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatSort,
    MatSortHeader,
    MatTable,
    MatProgressSpinner,
    MatNoDataRow,
    MatHeaderCellDef,
    MatButton,
    MatIcon,
  ],
  templateUrl: './statistic-export-create-step-2.component.html',
  styleUrl: './statistic-export-create-step-2.component.css',
})
export class StatisticExportCreateStep2Component {
  @ViewChild(MatSort) sort!: MatSort;

  private statisticExportService = inject(StatisticExportService);
  public statisticsForMunicipalityAndDwellingQuality =
    this.statisticExportService.statisticsForMunicipalityAndDwellingQuality;
  public statisticsGenerationData =
    this.statisticExportService.statisticsGenerationData;

  constructor() {
    this.statisticExportService.getStatisticsForMunicipalityAndDwellingQuality();
    effect(() => {
      if (!this.isLoadingDwellingQualityStatistics) {
        this.buildPivotTable();
        this.dataSource.sort = this.sort;
      }
    });
  }

  qualities: string[] = [];
  displayedColumns: string[] = [];

  dataSource = new MatTableDataSource<PivotRow>();

  private buildPivotTable() {
    // Unique municipalities
    const municipalities = [
      ...new Set(
        this.statisticsForMunicipalityAndDwellingQualityData.map(
          d => d.municipality
        )
      ),
    ];

    // Unique qualities (sorted numerically)
    this.qualities = [
      ...new Set(
        this.statisticsForMunicipalityAndDwellingQualityData.map(d => d.quality)
      ),
    ].sort((a, b) => +a - +b);

    this.displayedColumns = ['municipality', ...this.qualities];
    this.dataSource.data = municipalities.map(municipality => {
      const row: PivotRow = { municipality };

      this.qualities.forEach(q => {
        const match = this.statisticsForMunicipalityAndDwellingQualityData.find(
          d => d.municipality === municipality && d.quality === q
        );
        row[q] = match ? match.totalDwellings : 0;
      });

      return row;
    });
  }

  get statisticsForMunicipalityAndDwellingQualityData() {
    return this.statisticsForMunicipalityAndDwellingQuality().data;
  }

  get isLoadingDwellingQualityStatistics() {
    return this.statisticsForMunicipalityAndDwellingQuality().isLoading;
  }

  public moveToPrevious() {
    this.statisticExportService.goToStep(1);
  }

  public moveToNext() {
    this.statisticExportService.goToStep(3);
  }
}
