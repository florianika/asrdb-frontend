import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Role } from 'src/app/model/RolePermissions.model';

@Component({
  standalone: true,
  selector: 'asrdb-role-selector',
  templateUrl: './role-selector.component.html',
  styleUrls: ['./role-selector.component.css'],
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ]
})
export class RoleSelectorComponent {
  @Input() required = false;
  @Input() role: Role = "ADMIN";
  @Output() roleChange = new EventEmitter<Role>();

  changeRole(selectedRole: MatSelectChange) {
    this.roleChange.emit(selectedRole.value);
  }
}
