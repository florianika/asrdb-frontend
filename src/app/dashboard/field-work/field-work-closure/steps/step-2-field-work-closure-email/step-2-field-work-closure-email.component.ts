import { Component, inject, OnDestroy } from '@angular/core';
import { FieldWorkClosureService } from '../../field-work-closure.service';
import { AsyncPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { EmailTemplateManagementService } from '../../../../administration/email-template-management/email-template-management.service';
import { EmailTemplate } from '../../../../../model/EmailTemplate.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'asrdb-step-2-field-work-closure-email',
  imports: [
    AsyncPipe,
    FormsModule,
    MatButton,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    NgxEditorModule,
    ReactiveFormsModule,
    MatIcon,
  ],
  templateUrl: './step-2-field-work-closure-email.component.html',
  styleUrl: './step-2-field-work-closure-email.component.css',
})
export class Step2FieldWorkClosureEmailComponent implements OnDestroy {
  private fieldWorkClosureService = inject(FieldWorkClosureService);
  private _emailTemplateService = inject(EmailTemplateManagementService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private fieldWorkId = this.activatedRoute.snapshot.params['id'];

  public fieldWorkStatistics = this.fieldWorkClosureService.fieldWorkStatistics;
  public emailTemplates$ =
    this._emailTemplateService.emailTemplatesAsObservable;
  public selectedEmailTemplate: EmailTemplate | undefined = undefined;

  public editor: Editor = new Editor();

  constructor() {
    this._emailTemplateService.getEmailTemplates();
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  public setSelectedEmailTemplate(emailTemplateId: number) {
    this.selectedEmailTemplate =
      this._emailTemplateService.getEmailTemplateFromList(emailTemplateId);
  }

  close() {
    void this.router.navigate(['dashboard', 'field-work']);
  }

  back() {
    this.fieldWorkStatistics.update(prev => ({
      ...prev,
      step: Math.max(0, prev.step - 1),
    }));
  }

  next() {
    const emailTemplateId = this.selectedEmailTemplate?.emailTemplateId;
    if (!emailTemplateId) {
      return;
    }
    this.fieldWorkClosureService.assignClosureEmail(
      emailTemplateId,
      this.fieldWorkId
    );
  }
}
