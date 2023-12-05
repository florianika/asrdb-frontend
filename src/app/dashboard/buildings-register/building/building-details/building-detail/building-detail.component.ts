import { Component, Input } from '@angular/core';

@Component({
  selector: 'asrdb-building-detail',
  templateUrl: './building-detail.component.html',
  styleUrls: ['./building-detail.component.css']
})
export class BuildingDetailComponent {
  @Input() title!: string;
  @Input() value!: string;
}
