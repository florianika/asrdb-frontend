import {Component, effect, inject, ViewChild} from '@angular/core';
import {MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {MatStepper, MatStepperModule} from "@angular/material/stepper";
import {StatisticExportService} from "../statistic-export.service";
import {
  StatisticExportCreateStep1Component
} from "./statistic-export-create-step-1/statistic-export-create-step-1.component";
import {
  StatisticExportCreateStep2Component
} from "./statistic-export-create-step-2/statistic-export-create-step-2.component";
import {
  StatisticExportCreateStep0Component
} from "./statistic-export-create-step-0/statistic-export-create-step-0.component";
import {
  StatisticExportCreateStep3Component
} from "./statistic-export-create-step-3/statistic-export-create-step-3.component";
import {MatIcon} from "@angular/material/icon";

@Component({
  selector: 'asrdb-statistic-export-create',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatStepperModule,
    StatisticExportCreateStep1Component,
    StatisticExportCreateStep2Component,
    StatisticExportCreateStep0Component,
    StatisticExportCreateStep3Component,
    MatIcon
  ],
  templateUrl: './statistic-export-create.component.html',
  styleUrl: './statistic-export-create.component.css'
})
export class StatisticExportCreateComponent {
  @ViewChild(MatStepper) stepper!: MatStepper;
  private statisticExportService = inject(StatisticExportService);
  private dialogRef = inject(MatDialogRef);
  public statisticsGenerationData = this.statisticExportService.statisticsGenerationData;

  get stepperIndex(): number {
    return this.statisticExportService.statisticsGenerationData().step;
  }

  get isCreatingSnapshot() {
    if (!this.statisticsGenerationData().generationStatus) {
      return false;
    }
    return this.statisticsGenerationData().generationStatus !== 'COMPLETED' && this.statisticsGenerationData().generationStatus !== 'FAILED';
  }

  constructor() {

    effect(() => {
      if (!this.isCreatingSnapshot && !!this.statisticsGenerationData().jobId) {
        // close dialog
        this.dialogRef.close();
      }
    });
  }

  protected readonly close = close;
}
