import { Component, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { CommonBuildingService } from '../../../common/service/common-building.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FieldWorkClosureService } from '../../../field-work/field-work-closure/field-work-closure.service';
import { FieldWorkService } from '../../../field-work/field-work.service';
import { StatisticExportService } from '../../statistic-export.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'asrdb-statistic-export-create-step-0',
  standalone: true,
  imports: [MatButton, MatIcon, MatProgressSpinner],
  templateUrl: './statistic-export-create-step-0.component.html',
  styleUrl: './statistic-export-create-step-0.component.css',
})
export class StatisticExportCreateStep0Component implements OnInit, OnDestroy {
  private commonBuildingService = inject(CommonBuildingService);
  private fieldWorkClosureService = inject(FieldWorkClosureService);
  private fieldWorkService = inject(FieldWorkService);
  private statisticExportService = inject(StatisticExportService);
  private destroy$ = new Subject<void>();

  public hasUntestedBuildings: number | null = null;
  public fieldWorkState = this.fieldWorkService.fieldWorkState;
  public fieldWorkClosureStatistics =
    this.fieldWorkClosureService.fieldWorkStatistics;

  get isLoadingStatistics(): boolean {
    return this.fieldWorkClosureStatistics().loading;
  }

  constructor() {
    effect(() => {
      if (
        !this.isLoadingStatistics &&
        this.fieldWorkClosureStatistics().stats.length > 0
      ) {
        this.checkForUntestedBuildings();
      }
    });
  }

  ngOnInit() {
    this.checkForUntestedBuildings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.fieldWorkClosureService.cancelStatusPolling(true);
  }

  public testAllBuildings(): void {
    const activeFieldWork = this.fieldWorkState().activeFieldWork?.fieldWorkId;
    if (activeFieldWork) {
      this.hasUntestedBuildings = null;
      this.fieldWorkClosureService.executeFieldWorkClosureStatistics(
        activeFieldWork.toString()
      );
    }
  }

  public moveToNext() {
    this.statisticExportService.goToStep(1);
  }

  private checkForUntestedBuildings(): void {
    this.commonBuildingService
      .hasUntestedBuildings()
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasUntestedBuildings => {
        this.hasUntestedBuildings = hasUntestedBuildings ? 1 : 0;
      });
  }
}
