import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { BuildingFilter } from '../../model/building';
import {Router} from "@angular/router";
import {FILTER_DASHBOARD, FILTER_REGISTER} from "../register-filter.service";

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
  private filterKey?: string;
  filterConfig: BuildingFilter;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BuildingFilter,
    private router: Router
  ) {
    this.filterConfig = data;
    const url = router.url;
    if (url.includes('overview')) {
      this.filterKey = FILTER_DASHBOARD;
    } else if (url.includes(('register'))) {
      this.filterKey = FILTER_REGISTER;
    }
  }

  changeValue(event: MatSelectChange, filterProp: string) {
    (this.filterConfig.filter as any)[filterProp] = event.value;
  }

  saveFilter() {
    if (this.filterKey) {
      sessionStorage.setItem(this.filterKey, JSON.stringify(this.filterConfig))
    }
  }
}
