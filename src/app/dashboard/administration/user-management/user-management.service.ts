import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { User } from 'src/app/model/User.model';
import { environment } from 'src/environments/environment';
import { UserEditDialogComponent } from './user-edit-dialog/user-edit-dialog.component';
import { UserViewDialogComponent } from './user-view-dialog/user-view-dialog.component';
import { Role } from 'src/app/model/RolePermissions.model';

@Injectable()
export class UserManagementService {
  private users = new BehaviorSubject<User[]>([]);
  private user = new BehaviorSubject<User | null>(null);
  private loading = new BehaviorSubject(false);

  constructor(private httpClient: HttpClient, private snackbarService: MatSnackBar, private dialog: MatDialog) { }

  get usersAsObservable() {
    return this.users.asObservable();
  }

  get userAsObservable() {
    return this.user.asObservable();
  }

  get loadingAsObservable() {
    return this.loading.asObservable();
  }

  getUsers() {
    this.loading.next(true);
    this.httpClient.get<{usersDTO: User[]}>(environment.base_url + '/auth/users').subscribe({
      next: (result) => {
        this.loading.next(false);
        this.users.next(result.usersDTO);
      },
      error: (error) => {
        this.loading.next(false);
        console.error(error);
        this.showMessage('Could not load the users. Please reload the page to try again.');
      }
    });
  }

  getUser(userId: string) {
    // this.loading.next(true);
    this.httpClient.get<{userDTO: User}>(environment.base_url + `/auth/users/${userId}`).subscribe({
      next: (result) => {
        // this.loading.next(false);
        this.user.next(result.userDTO);
      },
      error: (error) => {
        // this.loading.next(false);
        console.error(error);
        this.showMessage('Coult not load the user. Please reload the page to try again.');
      }
    });
  }

  openViewUserDialog(user: User) {
    this.dialog.open(UserViewDialogComponent, {data: {userId: user.id}});
  }

  openEditUserDialog(user: User) {
    const editDialog = this.dialog.open(UserEditDialogComponent, {data: user});
    const editDialogSubscription = editDialog.afterClosed().subscribe((data) => {
      if (data.role && data.role !== user.accountRole) {
        this.editUserRole(user.id, data.role);
      }
      if (data.municipality && data.municipality !== user.municipality) {
        this.editUserMunicipality(user.id, data.municipality);
      }
      editDialogSubscription.unsubscribe();
    });
  }

  editUserRole(userId: string, role: Role) {
    this.loading.next(true);
    this.httpClient.patch(environment.base_url + `/auth/users/${userId}/set/${role}`, {}).subscribe({
      next: () => {
        this.getUsers();
      },
      error: (error) => {
        this.loading.next(false);
        console.error(error);
        this.showMessage('Coult not update user.');
      }
    });
  }

  editUserMunicipality(userId: string, municipality: string) {
    this.loading.next(true);
    this.httpClient.patch(environment.base_url + `/auth/users/${userId}/set/municipality/${municipality}`, {}).subscribe({
      next: () => {
        this.getUsers();
      },
      error: (error) => {
        this.loading.next(false);
        console.error(error);
        this.showMessage('Could not update users municipality.');
      }
    });
  }

  terminateUser(userId: string) {
    this.loading.next(true);
    this.httpClient.patch(environment.base_url + `/auth/users/${userId}/terminate`, {}).subscribe({
      next: () => {
        this.getUsers();
        this.showMessage('User was terminated.');
      },
      error: (error) => {
        this.loading.next(false);
        console.error(error);
        this.showMessage('Coult not terminate the user.');
      }
    });
  }

  activateUser(userId: string) {
    this.loading.next(true);
    this.httpClient.patch(environment.base_url + `/auth/users/${userId}/activate`, {}).subscribe({
      next: () => {
        this.getUsers();
        this.showMessage('User was activated.');
      },
      error: (error) => {
        this.loading.next(false);
        console.error(error);
        this.showMessage('Coult not activate the user.');
      }
    });
  }

  private showMessage(message: string) {
    this.snackbarService.open(message, 'Ok', {
      duration: 3000
    });
  }
}
