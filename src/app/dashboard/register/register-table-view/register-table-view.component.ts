import { Component } from '@angular/core';

import { RegisterMapComponent } from '../../common/components/register-map/register-map.component';
import { RegisterTableComponent } from './register-table/register-table.component';

@Component({
  selector: 'asrdb-register-table-view',
  imports: [RegisterMapComponent, RegisterTableComponent],
  templateUrl: './register-table-view.component.html',
  styleUrls: ['./register-table-view.component.css'],
})
export class RegisterTableViewComponent {}
