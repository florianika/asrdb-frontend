import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {UserManagementService} from './user-management.service';
import {User} from 'src/app/model/User.model';
import {MatTableDataSource} from '@angular/material/table';
import {map, Observable} from 'rxjs';
import {MUNICIPALITIES} from '../../../common/data/municipalities';
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {SignupComponent} from "../../../auth/signup/signup.component";
import {SignupService} from "../../../auth/signup/signup.service";

@Component({
  selector: 'asrdb-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
})
export class UserManagementComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'id',
    'email',
    'name',
    'lastName',
    'municipality',
    'accountStatus',
    'accountRole',
    'actions',
  ];
  dataSourceObservable: Observable<MatTableDataSource<User>> =
    this.userManagementService.usersAsObservable.pipe(
      map(users => {
        const dataSource = this.dataSource;
        dataSource.data = users;
        return dataSource;
      })
    );

  private dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();
  private dialogRef?: MatDialogRef<SignupComponent, any>;

  resultsLength = 0;
  isLoadingResults = this.userManagementService.loadingAsObservable;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userManagementService: UserManagementService,
    private signupService: SignupService,
    private matDialog: MatDialog) {}

  ngOnInit(): void {
    this.userManagementService.getUsers();
    this.signupService.signingUpAsObservable.subscribe((isSigningUp) => {
      if (!isSigningUp && this.dialogRef) {
        this.dialogRef.close();
        this.refreshTable();
      }
    })
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
    user.accountStatus === 'ACTIVE'
      ? this.userManagementService.terminateUser(user.id)
      : this.userManagementService.activateUser(user.id);
  }

  mapMunicipality(municipalityCode: string) {
    if (!municipalityCode) {
      return '-';
    }
    const municipality = MUNICIPALITIES.find(
      (el: { name: string; code: number }) =>
        el.code.toString() === municipalityCode
    );
    if (municipality) {
      return municipality.name;
    } else {
      return '-';
    }
  }

  refreshTable() {
    this.userManagementService.getUsers();
  }

  addUser() {
    this.dialogRef = this.matDialog.open(SignupComponent, {
      width: '400px',
      data: { isAdminCreation: true }
    });
  }
}
