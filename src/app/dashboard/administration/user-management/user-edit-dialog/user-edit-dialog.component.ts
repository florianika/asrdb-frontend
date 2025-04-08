import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Role } from 'src/app/model/RolePermissions.model';
import { User } from 'src/app/model/User.model';
import {MUNICIPALITIES} from "../../../../common/data/municipalities";

@Component({
  selector: 'asrdb-user-edit-dialog',
  templateUrl: './user-edit-dialog.component.html',
  styleUrls: ['./user-edit-dialog.component.css']
})
export class UserEditDialogComponent {
  role: Role = 'ADMIN';
  newRole: Role = 'ADMIN';

  newMunicipality;

  municipalities = MUNICIPALITIES.sort((a, b) => a.name.localeCompare(b.name));

  constructor(@Inject(MAT_DIALOG_DATA) public data: User) {
    this.role = data.accountRole;
    this.newRole = data.accountRole;
    this.newMunicipality = data.municipality;
  }

  updateRole(role: Role) {
    this.newRole = role;
  }
}
