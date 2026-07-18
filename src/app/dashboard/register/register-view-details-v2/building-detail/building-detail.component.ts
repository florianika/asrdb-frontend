import { Component, Input, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { logTypeColorMap } from '../../model/common-utils';
import { BuildingDetailFormatPipe } from './building-detail-format.pipe';

@Component({
  selector: 'asrdb-building-detail',
  templateUrl: './building-detail.component.html',
  styleUrls: ['./building-detail.component.css'],
  imports: [
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    BuildingDetailFormatPipe,
  ],
})
export class BuildingDetailComponent implements OnInit {
  @Input() title!: string;
  @Input() value!: string;
  @Input() log!: string;
  @Input() logType!: string;

  color = 'gray';

  ngOnInit() {
    if (logTypeColorMap.has(this.logType)) {
      this.color = logTypeColorMap.get(this.logType) as string;
    }
  }
}
