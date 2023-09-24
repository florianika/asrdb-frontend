import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from 'src/app/model/User.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private users = new BehaviorSubject<User[]>([]);
  private user = new BehaviorSubject<User | null>(null);
  private loading = new BehaviorSubject(false);

  constructor(private httpClient: HttpClient) { }

  get usersAsObservable() {
    return this.users.asObservable();
  }

  get loadingAsObservable() {
    return this.loading.asObservable();
  }

  getUsers() {
    this.loading.next(true);
    this.httpClient.get<{usersDTO: User[]}>(environment.base_url + '/admin/users').subscribe({
      next: (result) => {
        setTimeout(() => {
          this.loading.next(false);
          this.users.next(result.usersDTO);
        }, 5000)
      },
      error: (error) => {
        this.loading.next(false);
        console.error(error);
      }
    });
  }

  getUser(userId: string) {
    this.loading.next(true);
    this.httpClient.get<User>(environment.base_url + `/admin/users/${userId}`).subscribe({
      next: (result) => {
        this.loading.next(false);
        this.user.next(result);
      },
      error: (error) => {
        this.loading.next(false);
        console.error(error);
      }
    });
  }

  editUser() {
    this.loading.next(true);
  }

  terminateUser(userId: string) {
    this.loading.next(true);
    this.httpClient.patch(environment.base_url + `/admin/users/${userId}/terminate`, {}).subscribe({
      next: (result) => {
        this.loading.next(false);
      },
      error: (error) => {
        this.loading.next(false);
        console.error(error);
      }
    });
  }

  activateUser(userId: string) {
    this.loading.next(true);
    this.httpClient.patch(environment.base_url + `/admin/users/${userId}/activate`, {}).subscribe({
      next: (result) => {
        this.loading.next(false);
      },
      error: (error) => {
        this.loading.next(false);
        console.error(error);
      }
    });
  }
}
