import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RolePermissions } from 'src/app/model/RolePermissions.model';

@Component({
  selector: 'asrdb-role-delete-dialog',
  templateUrl: './role-delete-dialog.component.html',
  styleUrls: ['./role-delete-dialog.component.css']
})
export class RoleDeleteDialogComponent {
  role: RolePermissions;
  constructor(private dialogRef: MatDialogRef<RoleDeleteDialogComponent>, @Inject(MAT_DIALOG_DATA) private data: {role: RolePermissions}) {
    this.role = data.role;
  }

  deleteRole() {
    this.dialogRef.close(this.role.id);
  }
}
