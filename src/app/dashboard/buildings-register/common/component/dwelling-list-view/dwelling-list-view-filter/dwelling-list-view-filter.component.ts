import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DwellingFilter } from '../../../model/dwelling';

@Component({
  selector: 'asrdb-dwelling-list-view-filter',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatSelectModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
  templateUrl: './dwelling-list-view-filter.component.html',
  styleUrls: ['./dwelling-list-view-filter.component.css']
})
export class DwellingListViewFilterComponent {

  filterConfig: DwellingFilter;
  showBuildingIdFilter: boolean;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {filter: DwellingFilter, showBuildingIdFilter: boolean}) {
    this.filterConfig = data.filter;
    this.showBuildingIdFilter = data.showBuildingIdFilter;
  }

  changeValue(event: MatSelectChange, filterProp: string) {
    (this.filterConfig.filter as any)[filterProp] = event.value;
  }
}
