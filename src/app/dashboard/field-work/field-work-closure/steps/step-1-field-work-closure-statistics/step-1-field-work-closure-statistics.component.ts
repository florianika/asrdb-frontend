import {AfterViewInit, Component, effect, inject, ViewChild} from '@angular/core';
import {MatButton} from "@angular/material/button";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
  MatTableModule
} from "@angular/material/table";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatOption} from "@angular/material/core";
import {MatPaginator} from "@angular/material/paginator";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatSelect, MatSelectChange} from "@angular/material/select";
import {NgForOf} from "@angular/common";
import {FieldWorkClosureService, FieldWorkClosureStatistic} from "../../field-work-closure.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MUNICIPALITIES} from "../../../../../common/data/municipalities";
import {AggregatedStatistic} from "../../field-work-closure-modal.component";
import {MatIcon} from "@angular/material/icon";

@Component({
  selector: 'asrdb-step-1-field-work-closure-statistics',
  standalone: true,
  imports: [
    MatButton,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatFormField,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatLabel,
    MatOption,
    MatPaginator,
    MatProgressSpinner,
    MatRow,
    MatRowDef,
    MatSelect,
    MatTable,
    NgForOf,
    MatTableModule,
    MatIcon
  ],
  templateUrl: './step-1-field-work-closure-statistics.component.html',
  styleUrl: './step-1-field-work-closure-statistics.component.css'
})
export class Step1FieldWorkClosureStatisticsComponent implements AfterViewInit {

  private fieldWorkClosureService = inject(FieldWorkClosureService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  public fieldWorkStatistics = this.fieldWorkClosureService.fieldWorkStatistics;
  public aggregatedStatisticsDatasource = new MatTableDataSource<AggregatedStatistic>();
  public municipalities = MUNICIPALITIES.sort((a, b) => a.name.localeCompare(b.name));

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public columns = [
    "municipality",
    "quality",
    "kërkohet rishikim",
    "nuk ka nevojë për rishikim",
    "rishikim i aprovuar",
    "rishikim i ekzekutuar",
    "rishikim i rihapur",
    "rishikimi në pritje"
  ];

  constructor() {
    const pathParams = this.activatedRoute.snapshot.paramMap;
    const fieldWorkId = pathParams.get('id');
    if (!fieldWorkId) {
      void this.router.navigate(['dashboard', 'field-work']);
      return;
    }
    this.fieldWorkClosureService.executeFieldWorkClosureStatistics(fieldWorkId);
    effect(() => {
      if (!this.fieldWorkStatistics().loading && this.fieldWorkStatistics().stats.length > 0) {
        const stats = this.fieldWorkStatistics().stats as FieldWorkClosureStatistic[];
        this.aggregatedStatisticsDatasource.data = stats.reduce((acc, stat) => {
          let existing = acc.find(item => item.municipality === stat.municipality && item.quality === stat.quality);
          if (!existing) {
            existing = {
              id: `${stat.municipality}-${stat.quality}`,
              municipality: stat.municipality,
              quality: stat.quality,
              data: [0, 0, 0, 0, 0, 0]
            };
          }
          const index = this.columns
            .indexOf(
              stat.review
                .toLowerCase()
                .substring(stat.review.indexOf('|')
                  + 1)
                .trim());
          if (index !== -1 && index - 2 >= 0) {
            existing.data[index - 2] = stat.totalBuildings;
          }
          if (!acc.some(item => item.id === existing.id)) {
            acc.push(existing);
          }
          return acc;
        }, [] as AggregatedStatistic[]);
      }
    });
  }

  ngAfterViewInit() {
    this.aggregatedStatisticsDatasource.paginator = this.paginator;
    this.aggregatedStatisticsDatasource.filterPredicate = (data: AggregatedStatistic, filter: string) => {
      const filterValue = filter.toLowerCase();
      return data.municipality.toLowerCase().includes(filterValue);
    }
  }

  applyFilter(event: MatSelectChange) {
    const filterValue = event.value;
    this.aggregatedStatisticsDatasource.filter = filterValue.trim().toLowerCase();

    if (this.aggregatedStatisticsDatasource.paginator) {
      this.aggregatedStatisticsDatasource.paginator.firstPage();
    }
  }

  close() {
    void this.router.navigate(['dashboard', 'field-work']);
  }

  next() {
    this.fieldWorkStatistics.update((prev) => ({
      ...prev,
      step: prev.step ? prev.step + 1 : 1,
    }));
  }
}
