import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Permission, RolePermissions } from 'src/app/model/RolePermissions.model';

@Component({
  selector: 'asrdb-role-edit-dialog',
  templateUrl: './role-edit-dialog.component.html',
  styleUrls: ['./role-edit-dialog.component.css']
})
export class RoleEditDialogComponent {
  permission: Permission;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {permission: Permission}) {
    this.permission = data.permission;
  }
}
