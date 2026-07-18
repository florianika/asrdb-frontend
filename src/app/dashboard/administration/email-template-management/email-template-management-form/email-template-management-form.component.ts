import {
  Component,
  Inject,
  isDevMode,
  OnDestroy,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { catchError, Observable, of, Subject, takeUntil } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmailTemplateManagementService } from '../email-template-management.service';
import { EmailTemplateForm } from '../../../../model/EmailTemplate.model';
import { AuthStateService } from '../../../../common/services/auth-state.service';
import { Editor, Toolbar } from 'ngx-editor';

@Component({
    selector: 'asrdb-email-template-management-form',
    templateUrl: './email-template-management-form.component.html',
    styleUrls: ['./email-template-management-form.component.css'],
    standalone: false
})
export class EmailTemplateManagementFormComponent implements OnDestroy {
  private onDestroy = new Subject();
  private initialized = false;
  public template: EmailTemplateForm | undefined;
  editor: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  @ViewChild('cancelConfirmDialog') cancelConfirmDialog?: TemplateRef<any>;

  id?: number;
  isSaving: Observable<boolean>;
  isLoadingResults: Observable<boolean>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { templateId?: number },
    public dialogRef: MatDialogRef<EmailTemplateManagementFormComponent>,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private authState: AuthStateService,
    private emailTemplateManagementService: EmailTemplateManagementService
  ) {
    this.id = data.templateId;
    this.editor = new Editor();

    this.loadTemplateById(data.templateId);
    this.isSaving = this.emailTemplateManagementService.savingAsObservable;
    this.isLoadingResults =
      this.emailTemplateManagementService.loadingAsObservable;
    this.isSaving.pipe(takeUntil(this.onDestroy)).subscribe(saving => {
      if (!saving && this.initialized) {
        this.dialogRef.close();
      } else if (!this.initialized) {
        this.initialized = true;
      }
    });

    if (!data.templateId) {
      this.template = {
        subject: '',
        body: '',
      };
    }
  }

  private loadTemplateById(id?: number) {
    this.id = id;
    if (id) {
      this.emailTemplateManagementService.emailTemplateAsObservable
        .pipe(
          takeUntil(this.onDestroy),
          catchError(err => {
            console.log(err);
            return of(null);
          })
        )
        .subscribe(res => {
          if (isDevMode()) {
            console.log('Email template: ', res);
          }
          if (!res) return;

          this.template = {
            emailTemplateId: res.emailTemplateId,
            subject: res.subject,
            body: res.body,
          };
        });
      this.emailTemplateManagementService.getEmailTemplate(id);
    }
  }

  ngOnDestroy(): void {
    this.onDestroy.next(true);
    this.onDestroy.complete();
    this.editor.destroy();
  }

  cancel() {
    if (!this.cancelConfirmDialog) {
      return this.closeDialog();
    }
    this.matDialog
      .open(this.cancelConfirmDialog)
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          setTimeout(() => {
            this.matSnackBar.open(
              $localize`Dialog was closed and all changes were discarded`,
              $localize`OK`,
              { duration: 3000 }
            );
            this.dialogRef.close();
          }, 200);
        }
      });
  }

  private closeDialog() {
    this.matSnackBar.open(
      $localize`Dialog was closed and all changes were discarded`,
      $localize`OK`,
      { duration: 3000 }
    );
    this.dialogRef.close();
  }

  save() {
    if (!this.template?.subject || !this.template?.body) {
      this.matSnackBar.open(
        $localize`Please fill in all required fields`,
        $localize`OK`,
        { duration: 3000 }
      );
      return;
    }
    if (this.id) {
      this.template.emailTemplateId = this.id;
      this.template.updateUser = this.authState.getNameId();
      this.emailTemplateManagementService.editEmailTemplate(this.template);
    } else {
      this.template.createUser = this.authState.getNameId();
      this.emailTemplateManagementService.createEmailTemplate(this.template);
    }
  }
}
