import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatDialog} from "@angular/material/dialog";
import {environment} from "../../../../environments/environment";
import {UserViewDialogComponent} from "../user-management/user-view-dialog/user-view-dialog.component";
import {EmailTemplate, EmailTemplateForm} from "../../../model/EmailTemplate.model";
import {
    EmailTemplateManagementFormComponent
} from "./email-template-management-form/email-template-management-form.component";

@Injectable({
    providedIn: 'root'
})
export class EmailTemplateManagementService {
    private emailTemplates = new BehaviorSubject<EmailTemplate[]>([]);
    private emailTemplate = new BehaviorSubject<EmailTemplate | null>(null);
    private loading = new BehaviorSubject(false);
    private saving = new BehaviorSubject(false);

    constructor(private httpClient: HttpClient, private snackbarService: MatSnackBar, private dialog: MatDialog) { }

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
        this.httpClient.get<{emailTemplateDTOs: EmailTemplate[]}>(environment.base_url + '/qms/emailtemplate').subscribe({
            next: (result) => {
                this.loading.next(false);
                this.emailTemplates.next(result.emailTemplateDTOs);
            },
            error: (error) => {
                this.loading.next(false);
                console.error(error);
                this.showMessage('Could not load the emailTemplates. Please reload the page to try again.');
            }
        });
    }

    getEmailTemplate(templateId: number) {
        this.loading.next(true);
        return this.httpClient.get<{emailTemplateDTO: EmailTemplate}>(environment.base_url + `/qms/emailtemplate/${templateId}`).subscribe({
            next: (result) => {
                this.loading.next(false);
                this.emailTemplate.next(result.emailTemplateDTO);
            },
            error: (error) => {
                this.loading.next(false);
                console.error(error);
                this.showMessage('Could not load the emailTemplate. Please reload the page to try again.');
            }
        });
    }

    openViewEmailTemplate(id: number) {
        this.dialog.open(UserViewDialogComponent, {data: {templateId: id}, width: '700px'});
    }

    openEditEmailTemplateDialog(id?: number) {
        const editDialog = this.dialog.open(
            EmailTemplateManagementFormComponent,
            {data: {templateId: id}, width: '700px'}
        );
        const editDialogSubscription = editDialog.afterClosed().subscribe((data: EmailTemplate) => {
            if (data) {
                this.editEmailTemplate(data);
                editDialogSubscription.unsubscribe();
            }
        });
    }

    createEmailTemplate(emailTemplate: EmailTemplateForm) {
        this.saving.next(true);
        this.httpClient
            .post(
                environment.base_url + `/qms/emailtemplate`,
                JSON.stringify(emailTemplate),
                {headers: {'Content-Type': 'application/json'}})
            .subscribe({
                next: () => {
                    this.saving.next(false);
                    this.getEmailTemplates();
                },
                error: (error) => {
                    this.saving.next(false);
                    console.error(error);
                    this.showMessage('Could not update emailTemplate.');
                }
        });
    }

    editEmailTemplate(emailTemplate: EmailTemplateForm) {
        this.saving.next(true);
        this.httpClient
            .put(
                environment.base_url + `/qms/emailtemplate/${emailTemplate.emailTemplateId}`,
                JSON.stringify(emailTemplate),
                {headers: {'Content-Type': 'application/json'}})
            .subscribe({
                next: () => {
                    this.saving.next(false);
                    this.getEmailTemplates();
                },
                error: (error) => {
                    this.saving.next(false);
                    console.error(error);
                    this.showMessage('Could not update emailTemplate.');
                }
        });
    }

    private showMessage(message: string) {
        this.snackbarService.open(message, 'Ok', {
            duration: 3000
        });
    }
}
