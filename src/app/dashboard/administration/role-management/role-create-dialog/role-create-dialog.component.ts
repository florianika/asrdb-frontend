import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewRolePermission } from 'src/app/model/RolePermissions.model';

@Component({
  selector: 'asrdb-role-create-dialog',
  templateUrl: './role-create-dialog.component.html',
  styleUrls: ['./role-create-dialog.component.css']
})
export class RoleCreateDialogComponent {
  newRole: NewRolePermission = {
    role: 'ADMIN',
    entityType: 'BUILDING',
    variableName: '',
    permission: 'NONE'
  };

  constructor(private dialogRef: MatDialogRef<RoleCreateDialogComponent>, private snackBar: MatSnackBar) { }

  createRole() {
    if (!this.isValid()) {
      this.snackBar.open('Please fill all the required fields', 'Ok', {
        duration: 3000
      });
      return;
    }
    this.dialogRef.close(this.newRole);
  }

  private isValid() {
    return this.newRole.variableName !== '';
  }
}
