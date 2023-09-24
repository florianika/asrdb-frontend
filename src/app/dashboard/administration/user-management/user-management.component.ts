import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UserManagementService } from './user-management.service';
import { User } from 'src/app/model/User.model';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'asrdb-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'email', 'name', 'lastName', 'accountStatus', 'accountRole', 'actions'];
  dataSourceObservable: Observable<MatTableDataSource<User>> = this.userManagementService.usersAsObservable.pipe(
    map(users => {
      const dataSource = this.dataSource;
      dataSource.data = users
      return dataSource;
    })
  );

  private dataSource = new MatTableDataSource<User>();

  resultsLength = 0;
  isLoadingResults = this.userManagementService.loadingAsObservable;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private userManagementService: UserManagementService) {
  }

  ngOnInit(): void {
    this.userManagementService.getUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  viewUser(user: User) {
    this.userManagementService.openViewUserDialog(user);
  }

  editUser(user: User) {
    this.userManagementService.openEditUserDialog(user);
  }

  toggleAccountStatus(user: User) {
    user.accountStatus === "ACTIVE"
    ? this.userManagementService.terminateUser(user.id)
    : this.userManagementService.activateUser(user.id);
  }
}
