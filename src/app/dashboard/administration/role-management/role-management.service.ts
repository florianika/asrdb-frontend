import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatDialog} from "@angular/material/dialog";
import {NewRolePermission, RolePermissionGetResponse, RolePermissions} from "../../../model/RolePermissions.model";
import {environment} from "../../../../environments/environment";
import { RoleCreateDialogComponent } from './role-create-dialog/role-create-dialog.component';
import { RoleDeleteDialogComponent } from './role-delete-dialog/role-delete-dialog.component';

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

  openCreateRoleDialog() {
    this.dialog.open(RoleCreateDialogComponent).afterClosed().subscribe((newRole: NewRolePermission) => {
      if (!!newRole) {
        this.createRole(newRole);
      }
    });
  }

  openDeleteRoleDialog(role: RolePermissions) {
    this.dialog.open(RoleDeleteDialogComponent, { data: { role } })
      .afterClosed()
      .subscribe((id: number) => {
        if (!!id) {
          this.deleteRole(id);
        }
      });
  }

  private createRole(newRole: NewRolePermission) {
    this.loading.next(true);
    this.httpClient.post<any>(environment.base_url + 'admin/permissions', JSON.stringify(newRole), {
      headers: {
        "Content-Type": "application/json"
      }
    }).subscribe({
      next: () => {
        this.loading.next(false);
        this.getRolePermissions();
      },
      error: (err) => {
        this.loading.next(false);
        this.showMessage("Could not create the role permissions. Please try again or contact the administrator.");
      }
    })
  }

  private deleteRole(id: number) {
    this.loading.next(true);
    this.httpClient.delete<any>(environment.base_url + 'admin/permissions/' + id).subscribe({
      next: () => {
        this.loading.next(false);
        this.getRolePermissions();
      },
      error: (err) => {
        this.loading.next(false);
        this.showMessage("Could not delete the role permissions. Please try again or contact the administrator.");
      }
    });
  }

  private showMessage(message: string) {
    this.snackbarService.open(message, "Ok", {
      duration: 3000
    });
  }
}
