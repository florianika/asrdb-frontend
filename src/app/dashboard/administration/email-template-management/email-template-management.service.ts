import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import {
  EmailTemplate,
  EmailTemplateForm,
} from '../../../model/EmailTemplate.model';

@Injectable({
  providedIn: 'root',
})
export class EmailTemplateManagementService {
  private emailTemplates = new BehaviorSubject<EmailTemplate[]>([]);
  private emailTemplate = new BehaviorSubject<EmailTemplate | null>(null);
  private loading = new BehaviorSubject(false);
  private saving = new BehaviorSubject(false);

  constructor(
    private httpClient: HttpClient,
    private snackbarService: MatSnackBar
  ) {}

  get emailTemplatesAsObservable() {
    return this.emailTemplates.asObservable();
  }

  get emailTemplateAsObservable() {
    return this.emailTemplate.asObservable();
  }

  get loadingAsObservable() {
    return this.loading.asObservable();
  }

  get savingAsObservable() {
    return this.saving.asObservable();
  }

  getEmailTemplates() {
    this.loading.next(true);
    this.httpClient
      .get<{
        emailTemplateDTOs: EmailTemplate[];
      }>(environment.base_url + '/qms/emailtemplate')
      .subscribe({
        next: result => {
          this.loading.next(false);
          this.emailTemplates.next(result.emailTemplateDTOs);
        },
        error: error => {
          this.loading.next(false);
          console.error(error);
          this.showMessage(
            $localize`Could not load the email templates. Please reload the page to try again.`
          );
        },
      });
  }

  getEmailTemplateFromList(templateId: number): EmailTemplate | undefined {
    if (this.emailTemplates.value) {
      return this.emailTemplates.value.find(template => {
        if (template.emailTemplateId === templateId) {
          this.emailTemplate.next(template);
          return true;
        }
        return false;
      });
    }
    return undefined;
  }

  getEmailTemplate(templateId: number) {
    this.loading.next(true);
    return this.httpClient
      .get<{
        emailTemplateDTO: EmailTemplate;
      }>(environment.base_url + `/qms/emailtemplate/${templateId}`)
      .subscribe({
        next: result => {
          this.loading.next(false);
          this.emailTemplate.next(result.emailTemplateDTO);
        },
        error: error => {
          this.loading.next(false);
          console.error(error);
          this.showMessage(
            $localize`Could not load the email template. Please reload the page to try again.`
          );
        },
      });
  }

  createEmailTemplate(emailTemplate: EmailTemplateForm) {
    this.saving.next(true);
    this.httpClient
      .post(
        environment.base_url + '/qms/emailtemplate',
        JSON.stringify(emailTemplate),
        { headers: { 'Content-Type': 'application/json' } }
      )
      .subscribe({
        next: () => {
          this.saving.next(false);
          this.getEmailTemplates();
        },
        error: error => {
          this.saving.next(false);
          console.error(error);
          this.showMessage(
            $localize`Could not create the email template.`
          );
        },
      });
  }

  editEmailTemplate(emailTemplate: EmailTemplateForm) {
    this.saving.next(true);
    this.httpClient
      .put(
        environment.base_url +
          `/qms/emailtemplate/${emailTemplate.emailTemplateId}`,
        JSON.stringify(emailTemplate),
        { headers: { 'Content-Type': 'application/json' } }
      )
      .subscribe({
        next: () => {
          this.saving.next(false);
          this.getEmailTemplates();
        },
        error: error => {
          this.saving.next(false);
          console.error(error);
          this.showMessage(
            $localize`Could not update the email template.`
          );
        },
      });
  }

  private showMessage(message: string) {
    this.snackbarService.open(message, $localize`Ok`, {
      duration: 3000,
    });
  }
}
