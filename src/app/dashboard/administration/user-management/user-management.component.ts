import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { UserManagementService } from './user-management.service';
import { User } from 'src/app/model/User.model';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, map, Observable, take, takeUntil } from 'rxjs';
import { MUNICIPALITIES } from '../../../common/data/municipalities';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SignupComponent } from '../../../auth/signup/signup.component';
import { SignupService } from '../../../auth/signup/signup.service';
import { UserViewDialogComponent } from './user-view-dialog/user-view-dialog.component';
import { UserEditDialogComponent } from './user-edit-dialog/user-edit-dialog.component';
import { Role } from '../../../model/RolePermissions.model';

type UserEditDialogResult = {
  role?: Role;
  municipality?: number;
};

@Component({
    selector: 'asrdb-user-management',
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.css'],
    standalone: false
})
export class UserManagementComponent
  implements OnInit, AfterViewInit, OnDestroy
{
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
  private destroy$ = new Subject<void>();

  resultsLength = 0;
  isLoadingResults = this.userManagementService.loadingAsObservable;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userManagementService: UserManagementService,
    private signupService: SignupService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.userManagementService.getUsers();
    this.signupService.signingUpAsObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe(isSigningUp => {
        if (!isSigningUp && this.dialogRef) {
          this.dialogRef.close();
          this.refreshTable();
        }
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dialogRef?.close();
  }

  viewUser(user: User) {
    this.matDialog.open(UserViewDialogComponent, {
      data: { userId: user.id },
      disableClose: true,
    });
  }

  editUser(user: User) {
    this.matDialog
      .open<UserEditDialogComponent, User, UserEditDialogResult>(
        UserEditDialogComponent,
        {
          data: user,
          disableClose: true,
        }
      )
      .afterClosed()
      .pipe(take(1))
      .subscribe(data => {
        if (!data) {
          return;
        }
        if (data.role && data.role !== user.accountRole) {
          this.userManagementService.editUserRole(user.id, data.role);
        }
        if (
          data.municipality &&
          data.municipality.toString() !== user.municipality
        ) {
          this.userManagementService.editUserMunicipality(
            user.id,
            data.municipality.toString()
          );
        }
      });
  }

  toggleAccountStatus(user: User) {
    if (user.accountStatus === 'ACTIVE') {
      this.userManagementService.terminateUser(user.id);
    } else {
      this.userManagementService.activateUser(user.id);
    }
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
      data: { isAdminCreation: true },
      disableClose: true,
    });
  }
}
