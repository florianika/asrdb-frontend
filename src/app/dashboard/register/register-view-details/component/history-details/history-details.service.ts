import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, zip} from "rxjs";
import {environment} from "../../../../../../environments/environment";
import {User} from "../../../../../model/User.model";

@Injectable()
export class HistoryDetailsService {
  private readonly USER_DETAILS_API = '/auth/users/'
  private createUser = new BehaviorSubject('');
  private updateUser = new BehaviorSubject('');

  get createUserObservable() {
    return this.createUser.asObservable();
  }

  get updateUserObservable() {
    return this.updateUser.asObservable();
  }

  constructor(private http: HttpClient) {
  }

  loadUserDetails(createUser: string, updateUser?: string) {
    const requests = [];
    const createUserDetailsRequest = this.getUserDetailsRequest(createUser);
    requests.push(createUserDetailsRequest);
    if (updateUser) {
      const updateUserDetailsRequest = this.getUserDetailsRequest(updateUser);
      requests.push(updateUserDetailsRequest);
    }
    zip(...requests).subscribe({
      next: (response: {userDTO: User}[]) => {
        const createUserDetail = response[0].userDTO;
        this.createUser.next(createUserDetail.name + ' ' + createUserDetail.lastName);
        if (updateUser && response[1]) {
          const updateUserDetail = response[1].userDTO;
          this.updateUser.next(updateUserDetail.name + ' ' + updateUserDetail.lastName);
        }
      },
      error: (err) => {
        console.error(err);
      }
    })
  }

  private getUserDetailsRequest(user: string) {
    return this.http
      .get<{userDTO: User}>(environment.base_url + this.USER_DETAILS_API + user);
  }
}
