import {Component, effect, inject, ViewChild} from '@angular/core';
import {PivotRow, StatisticExportService} from "../../statistic-export.service";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatSort, MatSortModule} from "@angular/material/sort";
import {MatButtonModule} from "@angular/material/button";
import {NgForOf} from "@angular/common";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatIcon} from "@angular/material/icon";

@Component({
  selector: 'asrdb-statistic-export-create-step-1',
  standalone: true,
  imports: [
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    NgForOf,
    MatProgressSpinner,
    MatIcon
  ],
  templateUrl: './statistic-export-create-step-1.component.html',
  styleUrl: './statistic-export-create-step-1.component.css'
})
export class StatisticExportCreateStep1Component {
  @ViewChild(MatSort) sort!: MatSort;

  private statisticExportService = inject(StatisticExportService);
  public statisticsForMunicipalityAndBuildingQuality = this.statisticExportService.statisticsForMunicipalityAndBuildingQuality;

  constructor() {
    this.statisticExportService.getStatisticsForMunicipalityAndBuildingQuality();
    effect(() => {
      if (!this.isLoadingBuildingQualityStatistics) {
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
    const municipalities = [...new Set(this.statisticsForMunicipalityAndBuildingQualityData.map(d => d.municipality))];

    // Unique qualities (sorted numerically)
    this.qualities = [...new Set(this.statisticsForMunicipalityAndBuildingQualityData.map(d => d.quality))]
      .sort((a, b) => +a - +b);

    this.displayedColumns = ['municipality', ...this.qualities];
    this.dataSource.data = municipalities.map(municipality => {
      const row: PivotRow = {municipality};

      this.qualities.forEach(q => {
        const match = this.statisticsForMunicipalityAndBuildingQualityData.find(
          d => d.municipality === municipality && d.quality === q
        );
        row[q] = match ? match.totalBuildings : 0;
      });

      return row;
    });
  }

  get statisticsForMunicipalityAndBuildingQualityData() {
    return this.statisticsForMunicipalityAndBuildingQuality().data;
  }

  get isLoadingBuildingQualityStatistics() {
    return this.statisticsForMunicipalityAndBuildingQuality().isLoading;
  }

  public moveToNext() {
    this.statisticExportService.goToStep(2);
  }

  public moveToPrevious() {
    this.statisticExportService.goToStep(0);
  }
}
