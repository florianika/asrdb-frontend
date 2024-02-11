import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { BuildingFilter } from '../../model/building';

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
    MatButtonModule
  ]
})
export class RegisterFilterComponent {
  filterConfig: BuildingFilter;

  constructor(@Inject(MAT_DIALOG_DATA) public data: BuildingFilter) {
    this.filterConfig = data;
  }

  changeValue(event: MatSelectChange, filterProp: string) {
    (this.filterConfig.filter as any)[filterProp] = event.value;
  }
}
