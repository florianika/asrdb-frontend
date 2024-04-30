import {Component, Input, OnInit} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {CommonModule} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {MatTooltipModule} from "@angular/material/tooltip";
import {logTypeColorMap} from "../../../model/common-utils";

@Component({
  selector: 'asrdb-building-detail',
  templateUrl: './building-detail.component.html',
  styleUrls: ['./building-detail.component.css'],
  standalone: true,
  imports: [MatCardModule, CommonModule, MatIconModule, MatTooltipModule],
})
export class BuildingDetailComponent implements OnInit {
  @Input() title!: string;
  @Input() value!: string;
  @Input() log!: string;
  @Input() logType!: string;

  color = 'gray'

  ngOnInit() {
    if (logTypeColorMap.has(this.logType)) {
      this.color = logTypeColorMap.get(this.logType) as string;
    }
  }
}
