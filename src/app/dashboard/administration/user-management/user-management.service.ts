import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { User } from 'src/app/model/User.model';
import { environment } from 'src/environments/environment';
import { Role } from 'src/app/model/RolePermissions.model';

@Injectable()
export class UserManagementService {
  private users = new BehaviorSubject<User[]>([]);
  private user = new BehaviorSubject<User | null>(null);
  private loading = new BehaviorSubject(false);

  constructor(
    private httpClient: HttpClient,
    private snackbarService: MatSnackBar
  ) {}

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
    this.httpClient
      .get<{ usersDTO: User[] }>(environment.base_url + '/admin/users')
      .subscribe({
        next: result => {
          this.loading.next(false);
          this.users.next(result.usersDTO);
        },
        error: error => {
          this.loading.next(false);
          console.error(error);
          this.showMessage(
            $localize`Could not load the users. Please reload the page to try again.`
          );
        },
      });
  }

  getUser(userId: string) {
    this.httpClient
      .get<{ userDTO: User }>(environment.base_url + `/admin/users/${userId}`)
      .subscribe({
        next: result => {
          this.user.next(result.userDTO);
        },
        error: error => {
          console.error(error);
          this.showMessage(
            $localize`Could not load the user. Please reload the page to try again.`
          );
        },
      });
  }

  editUserRole(userId: string, role: Role) {
    this.loading.next(true);
    this.httpClient
      .patch(environment.base_url + `/admin/users/${userId}/set/role/${role}`, {})
      .subscribe({
        next: () => {
          this.getUsers();
        },
        error: error => {
          this.loading.next(false);
          console.error(error);
          this.showMessage(
            $localize`Could not update user role.`
          );
        },
      });
  }

  editUserMunicipality(userId: string, municipality: string) {
    this.loading.next(true);
    this.httpClient
      .patch(
        environment.base_url +
          `/admin/users/${userId}/set/municipality/${municipality}`,
        {}
      )
      .subscribe({
        next: () => {
          this.getUsers();
        },
        error: error => {
          this.loading.next(false);
          console.error(error);
          this.showMessage(
            $localize`Could not update user's municipality.`
          );
        },
      });
  }

  terminateUser(userId: string) {
    this.loading.next(true);
    this.httpClient
      .patch(environment.base_url + `/admin/users/${userId}/terminate`, {})
      .subscribe({
        next: () => {
          this.getUsers();
          this.showMessage($localize`User was terminated.`);
        },
        error: error => {
          this.loading.next(false);
          console.error(error);
          this.showMessage(
            $localize`Could not terminate the user.`
          );
        },
      });
  }

  activateUser(userId: string) {
    this.loading.next(true);
    this.httpClient
      .patch(environment.base_url + `/admin/users/${userId}/activate`, {})
      .subscribe({
        next: () => {
          this.getUsers();
          this.showMessage($localize`User was activated.`);
        },
        error: error => {
          this.loading.next(false);
          console.error(error);
          this.showMessage(
            $localize`Could not activate the user.`
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
