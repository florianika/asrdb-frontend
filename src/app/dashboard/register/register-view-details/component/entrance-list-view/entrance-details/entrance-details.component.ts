import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, isDevMode } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, catchError, of as observableOf } from 'rxjs';
import { BuildingDetailComponent } from '../../building-detail/building-detail.component';
import { QueryFilter } from 'src/app/dashboard/register/model/query-filter';
import { CommonEntranceService } from 'src/app/dashboard/register/service/common-entrance.service';
import { CommonRegisterHelperService } from 'src/app/dashboard/register/service/common-helper.service';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'asrdb-entrance-details',
  templateUrl: './entrance-details.component.html',
  styleUrls: ['./entrance-details.component.css'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    BuildingDetailComponent
  ],
  standalone: true
})
export class EntranceDetailsComponent implements OnInit {
  isLoadingResults = true;
  entrance: any;

  sections = [
    {
      title: 'General details',
      entries: [
        {
          title: '',
          propName: 'EntTown',
          value: ''
        },
        {
          title: '',
          propName: 'EntBuildingID',
          value: ''
        },
        {
          title: '',
          propName: 'EntBuildingNumber',
          value: ''
        },
        {
          title: '',
          propName: 'EntEntranceNumber',
          value: ''
        },
        {
          title: '',
          propName: 'EntZipCode',
          value: ''
        },
        {
          title: '',
          propName: 'EntAddressID',
          value: ''
        },
        {
          title: '',
          propName: 'EntStreetCode',
          value: ''
        },
        {
          title: '',
          propName: 'EntPointStatus',
          value: ''
        },
        {
          title: '',
          propName: 'EntDwellingRecs',
          value: ''
        },
        {
          title: '',
          propName: 'EntDwellingExpec',
          value: ''
        },
        {
          title: '',
          propName: 'EntLatitude',
          value: ''
        },
        {
          title: '',
          propName: 'EntLongitude',
          value: ''
        },
      ]
    }
  ];

  private subscriber = new Subject();
  private fields: any[] = [];
  private id: string | null = '';

  constructor(
    private commonEntranceService: CommonEntranceService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private matSnack: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: string) {
      this.id = this.data;
    }

  ngOnInit(): void {
    this.loadEntrance().pipe(takeUntil(this.subscriber)).subscribe((res) => this.handleResponse(res));
  }

  getTitle(column: string) {
    return this.commonBuildingRegisterHelper.getTitle(this.fields, column);
  }

  getValueFromStatus(column: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, this.entrance[column]) ?? 'Unknown';
  }

  private prepareWhereCase() {
    return `GlobalID='${this.id}'`;
  }

  private async handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Entrance', res);
    }
    if (!res) {
      return;
    }
    if (res.data.fields.length) {
      this.fields = res.data.fields;
    }
    this.entrance = res.data.features.map((feature: any) => feature.attributes)[0];
    this.fillSections();
    this.isLoadingResults = false;
  }

  private fillSections() {
    this.sections.forEach(section => {
      section.entries.forEach(entry => {
        entry.title = this.getTitle(entry.propName);
        entry.value = this.getValueFromStatus(entry.propName);
      });
    });
  }

  private loadEntrance() {
    this.isLoadingResults = true;
    const filter = {
      where: this.prepareWhereCase()
    } as Partial<QueryFilter>;
    return this.commonEntranceService.getEntranceData(filter).pipe(catchError((err) => {
      console.log(err);
      this.matSnack.open('Could not load entrance. Please try again.', 'Ok', {
        duration: 3000
      });
      return observableOf(null);
    }));
  }
}
