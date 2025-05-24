import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {map, Observable} from "rxjs";
import {MatTableDataSource} from "@angular/material/table";
import {User} from "../../../../model/User.model";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {UserManagementService} from "../../user-management/user-management.service";
import {MUNICIPALITIES} from "../../../../common/data/municipalities";
import {EmailTemplateManagementService} from "../email-template-management.service";
import {EmailTemplate} from "../../../../model/EmailTemplate.model";

@Component({
  selector: 'asrdb-email-template-management-table',
  templateUrl: './email-template-management-table.component.html',
  styleUrls: ['./email-template-management-table.component.css']
})
export class EmailTemplateManagementTableComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['emailTemplateId', 'subject', 'createdUser', 'createdTimestamp','actions'];
  dataSourceObservable: Observable<MatTableDataSource<EmailTemplate>> = this.emailTemplateManagementService.emailTemplatesAsObservable.pipe(
    map(users => {
      const dataSource = this.dataSource;
      dataSource.data = users;
      return dataSource;
    })
  );

  private dataSource: MatTableDataSource<EmailTemplate> = new MatTableDataSource<EmailTemplate>();

  resultsLength = 0;
  isLoadingResults = this.emailTemplateManagementService.loadingAsObservable;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private emailTemplateManagementService: EmailTemplateManagementService) {
  }

  ngOnInit(): void {
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
    this.emailTemplateManagementService.openEditEmailTemplateDialog(emailTemplate.emailTemplateId);
  }
}
