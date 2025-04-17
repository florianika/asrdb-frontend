import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { BuildingFilter } from '../../../register/model/building';
import {MatIconModule} from "@angular/material/icon";

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
  ]
})
export class RegisterFilterComponent {
  filterConfig: BuildingFilter;
  filterValue = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BuildingFilter,
  ) {
    this.filterConfig = data;
  }

  get municipalities() {
    return this.filterConfig.options.BldMunicipality
      .filter(el => !this.filterValue || el.name.toString().toLowerCase().includes(this.filterValue.toLowerCase()));
  }

  changeValue(event: MatSelectChange, filterProp: string) {
    (this.filterConfig.filter as any)[filterProp] = event.value;
  }

  cleanValue(event: any, filterProp: string) {
    event.stopPropagation();
    event.preventDefault();
    (this.filterConfig.filter as any)[filterProp] = '';
  }
}
