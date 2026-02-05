import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { BuildingFilter } from '../../../register/model/building';
import { MatIconModule } from '@angular/material/icon';
import {AuthStateService} from "../../../../common/services/auth-state.service";

@Component({
  selector: 'asrdb-building-list-view-filter',
  templateUrl: './register-filter.component.html',
  styleUrls: ['./register-filter.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class RegisterFilterComponent {
  filterConfig: BuildingFilter;
  filterValue = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: BuildingFilter, private authState: AuthStateService) {
    this.filterConfig = data;
  }

  get isNormalUser() {
    return !this.authState.isAdmin() && !this.authState.isSupervisor();
  }

  get municipalities() {
    return this.filterConfig.options.BldMunicipality.filter(
      el =>
        !this.filterValue ||
        el.name
          .toString()
          .toLowerCase()
          .includes(this.filterValue.toLowerCase())
    );
  }

  changeValue(event: MatSelectChange, filterProp: string) {
    (this.filterConfig.filter as any)[filterProp] = event.value;
  }

  changeCheckbox(event: any, filterProp: string) {
    (this.filterConfig.filter as any)[filterProp] = event.checked ? '1' : '';
  }

  cleanValue(event: any, filterProp: string) {
    event.stopPropagation();
    event.preventDefault();
    (this.filterConfig.filter as any)[filterProp] = '';
  }
}
