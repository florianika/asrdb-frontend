import { Component, OnDestroy, inject } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../register/model/common-utils';
import { MatButtonModule } from '@angular/material/button';
import {
  TEST_JOB_ID,
  TestBuildingInput,
  TestBuildingService,
} from './test-building.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import Moment from 'moment';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'asrdb-test-buildings',
  standalone: true,
  imports: [
    MatCheckbox,
    FormsModule,
    MatRadioModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
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
  templateUrl: './test-buildings.component.html',
  styleUrl: './test-buildings.component.css',
})
export class TestBuildingsComponent implements OnDestroy {
  private testBuildingService = inject(TestBuildingService);
  private destroy$ = new Subject<void>();
  private now = Moment();
  public testBuildingSignal = this.testBuildingService.testBuildingSignal;
  public hours = this.buildTimeOptions(24);
  public minutes = this.buildTimeOptions(60);
  public formGroup = new FormGroup({
    runUpdates: new FormControl(false),
    buildingSelection: new FormControl('all'),
    executionType: new FormControl('immediate'),
    startAt: new FormControl(Moment(new Date())),
    startHour: new FormControl(this.now.format('HH')),
    startMinute: new FormControl(this.now.format('mm')),
  });

  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const jobId = params[TEST_JOB_ID];
        if (jobId) {
          this.testBuildingService.updateJobIdFromUrl(jobId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.testBuildingService.cancelStatusPolling(true);
  }

  get isRunning() {
    return this.testBuildingSignal().isRunning;
  }

  get status() {
    return this.testBuildingSignal().status;
  }

  openHangfireDashboard() {
    const hangfireJobId = this.testBuildingSignal().hangfireJobId;
    if (hangfireJobId) {
      const url = environment.hangfire_url + 'details/' + hangfireJobId;
      window.open(url, '_blank');
    } else {
      window.open(environment.hangfire_url + 'enqueued', '_blank');
    }
  }

  onTestBuildings() {
    const formValue = this.formGroup.value;
    const input = {
      runUpdates: formValue.runUpdates || false,
      startAt:
        formValue.executionType === 'scheduled'
          ? this.getScheduledStartAt()
          : new Date().toISOString(),
    } as TestBuildingInput;
    if (formValue.buildingSelection === 'all') {
      this.testBuildingService.testAllBuildings(input);
    } else {
      this.testBuildingService.testUntestedBuildings(input);
    }
  }

  private getScheduledStartAt(): string {
    const dateValue = this.formGroup.get('startAt')?.value;
    const hourValue = this.formGroup.get('startHour')?.value || '00';
    const minuteValue = this.formGroup.get('startMinute')?.value || '00';
    const scheduledStartAt = Moment(dateValue);

    if (!scheduledStartAt.isValid()) {
      return '';
    }

    scheduledStartAt
      .hour(Number(hourValue))
      .minute(Number(minuteValue))
      .second(0)
      .millisecond(0);

    return scheduledStartAt.toISOString();
  }

  private buildTimeOptions(limit: number): string[] {
    return Array.from({ length: limit }, (_, index) =>
      index.toString().padStart(2, '0')
    );
  }
}
