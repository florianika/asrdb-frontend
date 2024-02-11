import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterMapComponent } from './register-map/register-map.component';
import { RegisterTableComponent } from './register-table/register-table.component';

@Component({
  selector: 'asrdb-register-table-view',
  standalone: true,
  imports: [
    CommonModule,
    RegisterMapComponent,
    RegisterTableComponent
  ],
  templateUrl: './register-table-view.component.html',
  styleUrls: ['./register-table-view.component.css']
})
export class RegisterTableViewComponent {
}
