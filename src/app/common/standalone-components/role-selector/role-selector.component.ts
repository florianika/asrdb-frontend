import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Role } from 'src/app/model/RolePermissions.model';
import {AuthStateService} from "../../services/auth-state.service";

@Component({
    selector: 'asrdb-role-selector',
    templateUrl: './role-selector.component.html',
    styleUrls: ['./role-selector.component.css'],
    imports: [MatSelectModule, MatFormFieldModule, FormsModule]
})
export class RoleSelectorComponent {
  @Input() required = false;
  @Input() disabled = false;
  @Input() role: Role = 'ADMIN';
  @Output() roleChange = new EventEmitter<Role>();

  private authSate = inject(AuthStateService);

  get isAdmin() {
    return this.authSate.isAdmin();
  }

  changeRole(selectedRole: MatSelectChange) {
    this.roleChange.emit(selectedRole.value);
  }
}
