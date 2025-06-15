import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {combineLatestWith, Observable} from 'rxjs';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {EmailTemplateManagementService} from '../email-template-management.service';
import {EmailTemplate} from '../../../../model/EmailTemplate.model';
import {UserManagementService} from "../../user-management/user-management.service";

@Component({
  selector: 'asrdb-email-template-management-table',
  templateUrl: './email-template-management-table.component.html',
  styleUrls: ['./email-template-management-table.component.css'],
})
export class EmailTemplateManagementTableComponent
  implements OnInit, AfterViewInit
{
  displayedColumns: string[] = [
    'emailTemplateId',
    'subject',
    'createdUser',
    'createdTimestamp',
    'actions',
  ];
  dataSourceObservable: Observable<MatTableDataSource<EmailTemplate>> | null = null;

  private dataSource: MatTableDataSource<EmailTemplate> =
    new MatTableDataSource<EmailTemplate>();

  resultsLength = 0;
  isLoadingResults = this.emailTemplateManagementService.loadingAsObservable;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private emailTemplateManagementService: EmailTemplateManagementService,
    private userManagementService: UserManagementService
  ) {
    this.emailTemplateManagementService.emailTemplatesAsObservable
      .pipe(combineLatestWith(this.userManagementService.usersAsObservable))
      .subscribe(([emails, users]) => {
        this.dataSource.data = emails?.map((email) => {
          const user = users.find(
            (user) => user.id === email.createdUser
          );
          return {
            ...email,
            createdUser: user ? user.name + ' ' + user.lastName : 'Unknown User',
          };
        });
        this.resultsLength = this.dataSource.data.length;
        this.dataSourceObservable = new Observable((observer) => {
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

  createEmailTemplate() {
    this.emailTemplateManagementService.openEditEmailTemplateDialog();
  }

  editEmailTemplate(emailTemplate: EmailTemplate) {
    this.emailTemplateManagementService.openEditEmailTemplateDialog(
      emailTemplate.emailTemplateId
    );
  }
}
