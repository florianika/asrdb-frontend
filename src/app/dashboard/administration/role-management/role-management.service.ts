import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatDialog} from "@angular/material/dialog";
import {RolePermissionGetResponse, RolePermissions} from "../../../model/RolePermissions.model";
import {environment} from "../../../../environments/environment";

@Injectable()
export class RoleManagementService {

  private rolePermissions = new BehaviorSubject<RolePermissions[]>([]);
  private loading = new BehaviorSubject(false);

  constructor(private httpClient: HttpClient, private snackbarService: MatSnackBar, private dialog: MatDialog) { }

  get rolesAsObservable() {
    return this.rolePermissions.asObservable();
  }

  get loadingAsObservable() {
    return this.loading.asObservable();
  }

  getRolePermissions() {
    this.loading.next(true);
    this.httpClient.get<RolePermissionGetResponse>(environment.base_url + 'admin/permissions').subscribe({
      next: (result) => {
        this.loading.next(false);
        this.rolePermissions.next(result.rolePermissionsDTO);
      },
      error: (error) => {
        this.loading.next(false);
        console.error(error);
        this.showMessage("Could not load the role permissions. Please reload the page to try again.");
      }
    });
  }

  private showMessage(message: string) {
    this.snackbarService.open(message, "Ok", {
      duration: 3000
    });
  }
}
