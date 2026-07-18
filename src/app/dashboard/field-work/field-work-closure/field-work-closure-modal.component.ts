import { Component, OnDestroy, inject } from '@angular/core';
import { FieldWorkClosureService } from './field-work-closure.service';
import { MatStepperModule } from '@angular/material/stepper';
import { Step1FieldWorkClosureStatisticsComponent } from './steps/step-1-field-work-closure-statistics/step-1-field-work-closure-statistics.component';
import { Step2FieldWorkClosureEmailComponent } from './steps/step-2-field-work-closure-email/step-2-field-work-closure-email.component';
import { Step3FieldWorkClosureSummaryComponent } from './steps/step-3-field-work-closure-summary/step-3-field-work-closure-summary.component';

export type AggregatedStatistic = {
  id: string;
  municipality: string;
  quality: string;
  data: number[];
};

@Component({
    selector: 'asrdb-field-work-closure-modal',
    imports: [
        MatStepperModule,
        Step1FieldWorkClosureStatisticsComponent,
        Step2FieldWorkClosureEmailComponent,
        Step3FieldWorkClosureSummaryComponent,
    ],
    templateUrl: './field-work-closure-modal.component.html',
    styleUrl: './field-work-closure-modal.component.css'
})
export class FieldWorkClosureModalComponent implements OnDestroy {
  private fieldWorkClosureService = inject(FieldWorkClosureService);
  public fieldWorkStatistics = this.fieldWorkClosureService.fieldWorkStatistics;

  public updateIndex = (index: number) => {
    this.fieldWorkClosureService.fieldWorkStatistics.update(prev => ({
      ...prev,
      step: index,
    }));
  };

  ngOnDestroy(): void {
    this.fieldWorkClosureService.cancelStatusPolling(true);
  }
}
