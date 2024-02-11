import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { EntranceFilter } from 'src/app/dashboard/register/model/entrance';

@Component({
  selector: 'asrdb-entrance-list-view-filter',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatSelectModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
  templateUrl: './entrance-list-view-filter.component.html',
  styleUrls: ['./entrance-list-view-filter.component.css']
})
export class EntranceListViewFilterComponent {

  filterConfig: EntranceFilter;
  showBuildingIdFilter: boolean;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {filter: EntranceFilter, showBuildingIdFilter: boolean}) {
    this.filterConfig = data.filter;
    this.showBuildingIdFilter = data.showBuildingIdFilter;
  }

  changeValue(event: MatSelectChange, filterProp: string) {
    (this.filterConfig.filter as any)[filterProp] = event.value;
  }
}
