import {Injectable} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {BehaviorSubject, catchError, of, zip} from "rxjs";
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
    const updateUserDetailsRequest = this.getUserDetailsRequest(updateUser);
    requests.push(createUserDetailsRequest);
    requests.push(updateUserDetailsRequest);
    zip(...requests).subscribe({
      next: (response: ({userDTO: User} | null)[]) => {
        const createUserDetail = response[0]?.userDTO;
        const createUserText = (createUserDetail?.name ?? "") + ' ' + (createUserDetail?.lastName ?? "");
        this.createUser.next(createUserText.trim());

        const updateUserDetail = response[1]?.userDTO;
        const updateUserText = (updateUserDetail?.name ?? "") + ' ' + (updateUserDetail?.lastName ?? "");
        this.updateUser.next(updateUserText.trim());
      },
      error: (err) => {
        console.error(err);
      }
    })
  }

  private getUserDetailsRequest(user?: string) {
    if (!user) {
      return of(null);
    }
    return this.http
      .get<{userDTO: User}>(environment.base_url + this.USER_DETAILS_API + user)
      .pipe(catchError(error => of(null)));
  }
}
