import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'asrdb-building-detail',
  templateUrl: './building-detail.component.html',
  styleUrls: ['./building-detail.component.css'],
  standalone: true,
  imports: [MatCardModule],
})
export class BuildingDetailComponent {
  @Input() title!: string;
  @Input() value!: string;
}
