import { Component, OnInit } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RegisterLogTableComponent } from './register-log-table/register-log-table.component';

@Component({
  selector: 'asrdb-register-log-view',
  imports: [RegisterLogTableComponent],
  templateUrl: './register-log-view.component.html',
  styleUrls: ['./register-log-view.component.css'],
})
export class RegisterLogViewComponent implements OnInit {
  private readonly BUILDINGS = 'buildings';
  public buildings: string[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private matSnackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const queryParamMap = this.activatedRoute.snapshot.queryParamMap;

    if (queryParamMap.has(this.BUILDINGS)) {
      const buildings =
        this.activatedRoute.snapshot.queryParamMap.get(this.BUILDINGS) ?? '';
      this.buildings = buildings.split(',');
    } else {
      this.matSnackBar.open(
        $localize`No building ids found. Please reload the page`,
        $localize`Ok`,
        {
          duration: 3000,
        }
      );
    }
  }
}
