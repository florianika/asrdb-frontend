import {
  AfterViewInit,
  Component,
  effect,
  inject,
  ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
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
  MatTableModule,
} from '@angular/material/table';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { NgForOf, NgIf } from '@angular/common';
import {
  FieldWorkClosureService,
  FieldWorkClosureStatistic,
} from '../../field-work-closure.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MUNICIPALITIES } from '../../../../../common/data/municipalities';
import { AggregatedStatistic } from '../../field-work-closure-modal.component';
import { MatIcon } from '@angular/material/icon';

type CompletenessMetric = {
  numerator: number;
  denominator: number;
  percent: number;
};

type MunicipalityCompleteness = {
  municipality: string;
  numerator: number;
  denominator: number;
  percent: number;
};

@Component({
  selector: 'asrdb-step-1-field-work-closure-statistics',
  standalone: true,
  imports: [
    MatButton,
    MatCheckbox,
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
    MatProgressBarModule,
    MatProgressSpinner,
    MatRow,
    MatRowDef,
    MatSelect,
    MatTable,
    NgForOf,
    NgIf,
    MatTableModule,
    MatIcon,
    MatInput,
    FormsModule,
  ],
  templateUrl: './step-1-field-work-closure-statistics.component.html',
  styleUrl: './step-1-field-work-closure-statistics.component.css',
})
export class Step1FieldWorkClosureStatisticsComponent implements AfterViewInit {
  private fieldWorkClosureService = inject(FieldWorkClosureService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  public fieldWorkStatistics = this.fieldWorkClosureService.fieldWorkStatistics;
  public aggregatedStatisticsDatasource =
    new MatTableDataSource<AggregatedStatistic>();
  public overallCompleteness: CompletenessMetric = {
    numerator: 0,
    denominator: 0,
    percent: 0,
  };
  public municipalityCompleteness: MunicipalityCompleteness[] = [];
  public selectedMunicipalityCompleteness: MunicipalityCompleteness | null = null;
  public selectedMunicipality = '';
  public municipalityFilterValue = '';
  public showAllMunicipalityProgressBars = false;
  public municipalities = MUNICIPALITIES.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public columns = [
    'municipality',
    'quality',
    'kërkohet rishikim',
    'nuk ka nevojë për rishikim',
    'rishikimi i aprovuar',
    'rishikimi i ekzekutuar',
    'rishikimi i rihapur',
    'rishikimi në pritje',
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
      if (this.fieldWorkStatistics().loading) {
        return;
      }

      const stats = this.fieldWorkStatistics().stats as FieldWorkClosureStatistic[];
      const filteredStats = stats.filter(
        stat => !this.isDisallowedQuality(stat.quality)
      );

      if (!filteredStats.length) {
        this.aggregatedStatisticsDatasource.data = [];
        this.overallCompleteness = { numerator: 0, denominator: 0, percent: 0 };
        this.municipalityCompleteness = [];
        this.updateSelectedMunicipalityCompleteness();
        return;
      }

      const municipalityMetrics = new Map<string, CompletenessMetric>();
      let overallNumerator = 0;
      let overallDenominator = 0;

      this.aggregatedStatisticsDatasource.data = filteredStats.reduce((acc, stat) => {
          const normalizedQuality = this.normalizeQuality(stat.quality);
          const qualityKey = normalizedQuality.toLowerCase();
          const reviewCode = this.getReviewCode(stat.review);
          if (reviewCode !== null) {
            const municipalityMetric = municipalityMetrics.get(stat.municipality) ?? {
              numerator: 0,
              denominator: 0,
              percent: 0,
            };

            if (reviewCode === 2) {
              overallNumerator += stat.totalBuildings;
              municipalityMetric.numerator += stat.totalBuildings;
            }

            if (reviewCode !== 1) {
              overallDenominator += stat.totalBuildings;
              municipalityMetric.denominator += stat.totalBuildings;
            }

            municipalityMetrics.set(stat.municipality, municipalityMetric);
          }

          let existing = acc.find(
            item =>
              item.municipality === stat.municipality &&
              item.quality.toLowerCase() === qualityKey
          );
          if (!existing) {
            existing = {
              id: `${stat.municipality}-${qualityKey}`,
              municipality: stat.municipality,
              quality: stat.quality,
              data: [0, 0, 0, 0, 0, 0],
            };
          }
          const reviewLabel = this.getReviewLabel(stat.review);
          const index = this.columns.indexOf(reviewLabel);
          if (index !== -1 && index - 2 >= 0) {
            existing.data[index - 2] = stat.totalBuildings;
          }
          if (!acc.some(item => item.id === existing.id)) {
            acc.push(existing);
          }
          return acc;
        }, [] as AggregatedStatistic[]);

      this.overallCompleteness = {
        numerator: overallNumerator,
        denominator: overallDenominator,
        percent: this.calculatePercent(overallNumerator, overallDenominator),
      };

      this.municipalityCompleteness = Array.from(municipalityMetrics.entries())
        .map(([municipality, metric]) => ({
          municipality,
          numerator: metric.numerator,
          denominator: metric.denominator,
          percent: this.calculatePercent(metric.numerator, metric.denominator),
        }))
        .sort(
          (a, b) =>
            b.percent - a.percent ||
            a.municipality.localeCompare(b.municipality)
        );
      this.updateSelectedMunicipalityCompleteness();
    });
  }

  ngAfterViewInit() {
    this.aggregatedStatisticsDatasource.paginator = this.paginator;
    this.aggregatedStatisticsDatasource.filterPredicate = (
      data: AggregatedStatistic,
      filter: string
    ) => {
      const filterValue = filter.toLowerCase();
      return data.municipality.toLowerCase().includes(filterValue);
    };
  }

  applyFilter(event: MatSelectChange) {
    const filterValue = (event.value ?? '').toString();
    this.selectedMunicipality = filterValue;
    this.aggregatedStatisticsDatasource.filter = filterValue
      .trim()
      .toLowerCase();
    this.updateSelectedMunicipalityCompleteness();

    if (this.aggregatedStatisticsDatasource.paginator) {
      this.aggregatedStatisticsDatasource.paginator.firstPage();
    }
  }

  clearMunicipalityFilter(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.municipalityFilterValue = '';
  }

  get filteredMunicipalities() {
    if (!this.municipalityFilterValue) {
      return this.municipalities;
    }

    return this.municipalities.filter(municipality =>
      municipality.name
        .toLowerCase()
        .includes(this.municipalityFilterValue.toLowerCase())
    );
  }

  close() {
    void this.router.navigate(['dashboard', 'field-work']);
  }

  next() {
    this.fieldWorkStatistics.update(prev => ({
      ...prev,
      step: prev.step ? prev.step + 1 : 1,
    }));
  }

  public formatPercent(value: number) {
    return `${value.toFixed(2)}%`;
  }

  private getReviewCode(review: string): number | null {
    const reviewValue = review?.trim();
    if (!reviewValue) {
      return null;
    }

    const separatorIndex = reviewValue.indexOf('|');
    const numericPart =
      separatorIndex >= 0
        ? reviewValue.slice(0, separatorIndex).trim()
        : reviewValue;
    const parsedCode = Number.parseInt(numericPart, 10);

    return Number.isNaN(parsedCode) ? null : parsedCode;
  }

  private getReviewLabel(review: string): string {
    const reviewValue = review?.trim().toLowerCase();
    if (!reviewValue) {
      return '';
    }

    const separatorIndex = reviewValue.indexOf('|');
    if (separatorIndex < 0) {
      return reviewValue;
    }

    return reviewValue.slice(separatorIndex + 1).trim();
  }

  private isDisallowedQuality(quality: string): boolean {
    const qualityValue = quality?.trim();
    if (!qualityValue) {
      return false;
    }

    const separatorIndex = qualityValue.indexOf('|');
    const numericPart =
      separatorIndex >= 0
        ? qualityValue.slice(0, separatorIndex).trim()
        : qualityValue;
    const qualityCode = Number.parseInt(numericPart, 10);

    return !Number.isNaN(qualityCode) && qualityCode === 0;
  }

  private normalizeQuality(quality: string): string {
    const qualityValue = quality?.trim();
    if (!qualityValue) {
      return '';
    }

    const separatorIndex = qualityValue.indexOf('|');
    if (separatorIndex < 0) {
      return qualityValue.replace(/\s+/g, ' ');
    }

    const labelPart = qualityValue.slice(separatorIndex + 1).trim();
    if (!labelPart) {
      return qualityValue.slice(0, separatorIndex).trim();
    }

    return labelPart.replace(/\s+/g, ' ');
  }

  private calculatePercent(numerator: number, denominator: number) {
    if (denominator <= 0) {
      return 0;
    }

    return Math.round((numerator / denominator) * 10000) / 100;
  }

  private updateSelectedMunicipalityCompleteness() {
    if (!this.selectedMunicipality) {
      this.selectedMunicipalityCompleteness = null;
      return;
    }

    this.selectedMunicipalityCompleteness =
      this.municipalityCompleteness.find(
        item => item.municipality === this.selectedMunicipality
      ) ?? null;
  }
}
