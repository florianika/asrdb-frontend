import { Component, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldWorkService } from '../field-work.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../register/model/common-utils';
import { ActivatedRoute } from '@angular/router';
import { FieldWorkFormStep1Component } from './field-work-form-step1/field-work-form-step1.component';
import { FieldWorkFormStep2Component } from './field-work-form-step2/field-work-form-step2.component';
import { FieldWorkFormStep3Component } from './field-work-form-step3/field-work-form-step3.component';
import { FieldWorkFormStep4Component } from './field-work-form-step4/field-work-form-step4.component';

@Component({
  selector: 'asrdb-filed-work-form',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    FieldWorkFormStep1Component,
    FieldWorkFormStep2Component,
    FieldWorkFormStep3Component,
    FieldWorkFormStep4Component,
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  templateUrl: './filed-work-form.component.html',
  styleUrl: './filed-work-form.component.css',
})
export class FiledWorkFormComponent implements OnInit, OnDestroy {
  private _formBuilder = inject(FormBuilder);
  private _fieldWorkService = inject(FieldWorkService);
  private _activatedRoute = inject(ActivatedRoute);
  private id: string | null = null;

  public fieldWorkState = this._fieldWorkService.fieldWorkState;

  firstFormGroup = this._formBuilder.group({
    fieldWorkName: ['', Validators.required],
    description: ['', Validators.required],
    startDate: [new Date(), Validators.required],
    endDate: [new Date(), Validators.required],
  });
  secondFormGroup = this._formBuilder.group({
    emailTemplateId: [0, Validators.required],
  });
  thirdFormGroup = this._formBuilder.group({
    rule: [null],
    searchText: [''],
  });

  constructor() {
    this.handleFieldWorkState();
  }

  ngOnInit() {
    this.id = this._activatedRoute.snapshot.paramMap.get('id');
    if (this.id) {
      this._fieldWorkService.getActiveFieldWork();
    }
  }

  ngOnDestroy(): void {
    this._fieldWorkService.cancelActiveFieldWorkStatusPolling(true);
  }

  private handleFieldWorkState() {
    effect(
      () => {
        const activeFieldWork = this.fieldWorkState().activeFieldWork;
        if (
          activeFieldWork &&
          this.id &&
          activeFieldWork.fieldWorkId.toString() === this.id
        ) {
          this.firstFormGroup.patchValue({
            fieldWorkName: activeFieldWork.fieldWorkName,
            description: activeFieldWork.description,
            startDate: new Date(activeFieldWork.startDate),
            endDate: new Date(activeFieldWork.endDate),
          });
          this.secondFormGroup.patchValue({
            emailTemplateId: activeFieldWork.openEmailTemplateId,
          });
        }
      },
      { allowSignalWrites: true }
    );
  }

  public updateCurrentTab(index: number) {
    this._fieldWorkService.setCurrentStep(index);
  }
}
