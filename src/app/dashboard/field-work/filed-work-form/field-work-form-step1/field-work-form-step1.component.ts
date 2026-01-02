import { Component, inject, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import {
  MatFormField,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  FieldWork,
  FieldWorkCreateRequest,
  FieldWorkService,
} from '../../field-work.service';
import { AuthStateService } from '../../../../common/services/auth-state.service';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'asrdb-field-work-form-step1',
  standalone: true,
  imports: [
    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatFormField,
    MatInput,
    MatLabel,
    MatSuffix,
    ReactiveFormsModule,
    MatIcon,
  ],
  templateUrl: './field-work-form-step1.component.html',
  styleUrl: './field-work-form-step1.component.css',
})
export class FieldWorkFormStep1Component {
  @Input() formGroup!: FormGroup;

  private _fieldWorkService = inject(FieldWorkService);
  private _authState = inject(AuthStateService);
  private _router = inject(Router);

  public fieldWorkState = this._fieldWorkService.fieldWorkState;

  public handleGeneralPage() {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    const data = {
      fieldWorkName: this.formGroup.value.fieldWorkName,
      description: this.formGroup.value.description,
      startDate: this.formGroup.value.startDate,
      endDate: this.formGroup.value.endDate,
      createdUser: this._authState.getNameId(),
    } as Partial<FieldWork> | FieldWorkCreateRequest;

    if (data.startDate) {
      const startDate = new Date(data.startDate);
      startDate.setHours(0, 0, 0, 0);
      data.startDate = startDate.toISOString();
    }
    if (data.endDate) {
      const endDate = new Date(data.endDate);
      endDate.setHours(23, 59, 59, 999);
      data.endDate = endDate.toISOString();
    }

    const activeFieldWork = this.fieldWorkState().activeFieldWork;
    if (activeFieldWork) {
      this._fieldWorkService.updateFieldWork(data, activeFieldWork.fieldWorkId);
    } else {
      this._fieldWorkService.createFieldWork(data as FieldWorkCreateRequest);
    }
  }

  public handleClose() {
    void this._router.navigate(['/dashboard/field-work']);
  }
}
