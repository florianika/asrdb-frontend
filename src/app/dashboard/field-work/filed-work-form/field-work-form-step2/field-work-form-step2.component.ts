import { Component, effect, inject, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FieldWorkService } from '../../field-work.service';
import { EmailTemplateManagementService } from '../../../administration/email-template-management/email-template-management.service';
import { MatOption, MatSelect } from '@angular/material/select';
import { AsyncPipe } from '@angular/common';
import { EmailTemplate } from '../../../../model/EmailTemplate.model';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'asrdb-field-work-form-step2',
  standalone: true,
  imports: [
    MatButton,
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    MatSelect,
    MatOption,
    AsyncPipe,
    NgxEditorModule,
    FormsModule,
    NgxEditorModule,
    MatIcon,
  ],
  templateUrl: './field-work-form-step2.component.html',
  styleUrl: './field-work-form-step2.component.css',
})
export class FieldWorkFormStep2Component {
  @Input() formGroup!: FormGroup;

  private _fieldWorkService = inject(FieldWorkService);
  private _emailTemplateService = inject(EmailTemplateManagementService);
  private _router = inject(Router);

  public fieldWorkState = this._fieldWorkService.fieldWorkState;
  public emailTemplates$ =
    this._emailTemplateService.emailTemplatesAsObservable;
  public selectedEmailTemplate: EmailTemplate | undefined = undefined;
  public editor: Editor = new Editor();

  constructor() {
    this._emailTemplateService.getEmailTemplates();
    effect(() => {
      const value = this.fieldWorkState().activeFieldWork?.openEmailTemplateId;
      if (
        value &&
        (!this.selectedEmailTemplate ||
          this.selectedEmailTemplate.emailTemplateId !== value)
      ) {
        this.selectedEmailTemplate =
          this._emailTemplateService.getEmailTemplateFromList(value);
      }
    });
  }

  public handleEmailTemplatePage() {
    if (!this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    const activeFieldWork = this.fieldWorkState().activeFieldWork;
    if (activeFieldWork) {
      this._fieldWorkService.assignEmailTemplate(
        this.formGroup.value.emailTemplateId,
        activeFieldWork.fieldWorkId
      );
    }
  }

  public back() {
    this.fieldWorkState.update(state => ({
      ...state,
      currentStep: Math.max(state.currentStep - 1, 0),
    }));
  }

  public setSelectedEmailTemplate(emailTemplateId: number) {
    this.selectedEmailTemplate =
      this._emailTemplateService.getEmailTemplateFromList(emailTemplateId);
  }

  public handleClose() {
    void this._router.navigate(['/dashboard/field-work']);
  }
}
