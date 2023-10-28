import { Component } from '@angular/core';
import { NewRolePermission, RolePermissions } from 'src/app/model/RolePermissions.model';

@Component({
  selector: 'asrdb-role-create-dialog',
  templateUrl: './role-create-dialog.component.html',
  styleUrls: ['./role-create-dialog.component.css']
})
export class RoleCreateDialogComponent {
  newRole: NewRolePermission = {
    role: "ADMIN",
    entityType: "BUILDING",
    variableName: "",
    permission: "NONE"
  };
}
