import {Component, inject} from '@angular/core';
import {StatisticExportService} from "../../statistic-export.service";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {FormsModule} from "@angular/forms";
import {AuthStateService} from "../../../../common/services/auth-state.service";
import {provideNativeDateAdapter} from "@angular/material/core";
import {MatProgressSpinner} from "@angular/material/progress-spinner";

@Component({
  selector: 'asrdb-statistic-export-create-step-3',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    MatProgressSpinner
  ],
  providers: [
    provideNativeDateAdapter()
  ],
  templateUrl: './statistic-export-create-step-3.component.html',
  styleUrl: './statistic-export-create-step-3.component.css'
})
export class StatisticExportCreateStep3Component {
  private statisticExportService = inject(StatisticExportService);
  private authState = inject(AuthStateService);

  public statisticsGenerationData = this.statisticExportService.statisticsGenerationData;

  public date = new Date();
  public notes = '';

  get isCreatingSnapshot() {
    if (!this.statisticsGenerationData().generationStatus) {
      return false;
    }
    return this.statisticsGenerationData().generationStatus !== 'COMPLETED' && this.statisticsGenerationData().generationStatus !== 'FAILED';
  }

  public moveToPrevious() {
    this.statisticExportService.goToStep(2);
  }

  public createStatisticExport() {
    this.statisticExportService.startDataSnapshotCreation(
      this.date?.getFullYear() ?? (new Date()).getFullYear(),
      this.notes,
      this.authState.getNameId() ?? ''
    )
  }
}
