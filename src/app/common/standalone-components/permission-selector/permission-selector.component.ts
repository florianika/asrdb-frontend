import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Permission, Role } from 'src/app/model/RolePermissions.model';

@Component({
  standalone: true,
  selector: 'asrdb-permission-selector',
  templateUrl: './permission-selector.component.html',
  styleUrls: ['./permission-selector.component.css'],
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ]
})
export class PermissionSelectorComponent {
  @Input() required = false;
  @Input() disabled = false;
  @Input() permission: Permission = "NONE";
  @Output() permissionChange = new EventEmitter<Permission>();

  changeRole(selectedPermission: MatSelectChange) {
    this.permissionChange.emit(selectedPermission.value);
  }
}
