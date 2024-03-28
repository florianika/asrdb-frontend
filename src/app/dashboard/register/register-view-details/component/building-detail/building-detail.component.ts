import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {CommonModule} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";

@Component({
  selector: 'asrdb-building-detail',
  templateUrl: './building-detail.component.html',
  styleUrls: ['./building-detail.component.css'],
  standalone: true,
  imports: [MatCardModule, CommonModule, MatIconModule, MatTooltipModule],
})
export class BuildingDetailComponent {
  @Input() title!: string;
  @Input() value!: string;
  @Input() log!: string;
}
