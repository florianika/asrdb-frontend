import { Component, inject } from '@angular/core';
import { StatisticExportService } from '../../statistic-export.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';
import { AuthStateService } from '../../../../common/services/auth-state.service';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../../register/model/common-utils';
import Moment from 'moment';

@Component({
    selector: 'asrdb-statistic-export-create-step-3',
    imports: [
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatDatepickerModule,
        FormsModule,
        MatProgressSpinner,
    ],
    providers: [
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE],
        },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
    templateUrl: './statistic-export-create-step-3.component.html',
    styleUrl: './statistic-export-create-step-3.component.css'
})
export class StatisticExportCreateStep3Component {
  private statisticExportService = inject(StatisticExportService);
  private authState = inject(AuthStateService);

  public statisticsGenerationData =
    this.statisticExportService.statisticsGenerationData;

  public date = Moment(new Date());
  public notes = '';

  get isCreatingSnapshot() {
    if (!this.statisticsGenerationData().generationStatus) {
      return false;
    }
    return (
      this.statisticsGenerationData().generationStatus !== 'COMPLETED' &&
      this.statisticsGenerationData().generationStatus !== 'FAILED'
    );
  }

  public moveToPrevious() {
    this.statisticExportService.goToStep(2);
  }

  public createStatisticExport() {
    this.statisticExportService.startDataSnapshotCreation(
      this.date?.year() ?? new Date().getFullYear(),
      this.notes,
      this.authState.getNameId() ?? ''
    );
  }
}
