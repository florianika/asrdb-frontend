import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subject, combineLatestWith, Observable, takeUntil } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { EmailTemplateManagementService } from '../email-template-management.service';
import { EmailTemplate } from '../../../../model/EmailTemplate.model';
import { UserManagementService } from '../../user-management/user-management.service';
import { MatDialog } from '@angular/material/dialog';
import { EmailTemplateManagementFormComponent } from '../email-template-management-form/email-template-management-form.component';

@Component({
    selector: 'asrdb-email-template-management-table',
    templateUrl: './email-template-management-table.component.html',
    styleUrls: ['./email-template-management-table.component.css'],
    standalone: false
})
export class EmailTemplateManagementTableComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  displayedColumns: string[] = [
    'emailTemplateId',
    'subject',
    'createdUser',
    'createdTimestamp',
    'actions',
  ];
  dataSourceObservable: Observable<MatTableDataSource<EmailTemplate>> | null =
    null;

  private dataSource: MatTableDataSource<EmailTemplate> =
    new MatTableDataSource<EmailTemplate>();
  private destroy$ = new Subject<void>();

  resultsLength = 0;
  isLoadingResults = this.emailTemplateManagementService.loadingAsObservable;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private emailTemplateManagementService: EmailTemplateManagementService,
    private userManagementService: UserManagementService,
    private dialog: MatDialog
  ) {
    this.emailTemplateManagementService.emailTemplatesAsObservable
      .pipe(
        combineLatestWith(this.userManagementService.usersAsObservable),
        takeUntil(this.destroy$)
      )
      .subscribe(([emails, users]) => {
        this.dataSource.data = emails?.map(email => {
          const user = users.find(user => user.id === email.createdUser);
          return {
            ...email,
            createdUser: user
              ? user.name + ' ' + user.lastName
              : 'Unknown User',
          };
        });
        this.resultsLength = this.dataSource.data.length;
        this.dataSourceObservable = new Observable(observer => {
          observer.next(this.dataSource);
          observer.complete();
        });
      });
  }

  ngOnInit(): void {
    this.userManagementService.getUsers();
    this.emailTemplateManagementService.getEmailTemplates();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createEmailTemplate() {
    this.openEmailTemplateDialog();
  }

  editEmailTemplate(emailTemplate: EmailTemplate) {
    this.openEmailTemplateDialog(emailTemplate.emailTemplateId);
  }

  private openEmailTemplateDialog(templateId?: number) {
    this.dialog.open(EmailTemplateManagementFormComponent, {
      data: { templateId },
      width: '900px',
      disableClose: true,
    });
  }
}
