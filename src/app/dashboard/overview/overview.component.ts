import {ChangeDetectionStrategy, ChangeDetectorRef, Component, isDevMode, OnDestroy} from '@angular/core';
import {AuthStateService} from 'src/app/common/services/auth-state.service';
import {Chip} from "../../common/standalone-components/chip/chip.component";
import {BuildingFilter} from "../register/model/building";
import {FILTER_REGISTER, RegisterFilterService} from "../register/register-table-view/register-filter.service";
import {CommonRegisterHelperService} from "../register/service/common-helper.service";
import {CommonBuildingService} from "../register/service/common-building.service";
import {catchError, of, Subject, takeUntil} from "rxjs";
import {RegisterFilterComponent} from "../register/register-table-view/register-filter/register-filter.component";
import {MatDialog} from "@angular/material/dialog";
import {QueryFilter} from "../register/model/query-filter";

@Component({
  selector: 'asrdb-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewComponent implements OnDestroy {

  private destroy = new Subject();
  public fields = [];
  public filterObservable = this.registerFilterService.filterObservable;

  constructor(
    private authState: AuthStateService,
    private registerFilterService: RegisterFilterService,
    private commonBuildingService: CommonBuildingService,
    private commonBuildingRegisterHelper: CommonRegisterHelperService,
    private matDialog: MatDialog,
    private changeDetectionRef: ChangeDetectorRef,
  ) {
    this.commonBuildingService.getAttributesMetadata()
      .pipe(takeUntil(this.destroy))
      .subscribe(fields => {
        this.fields = fields;
        registerFilterService.prepareFilter(fields);
        this.changeDetectionRef.detectChanges();
      });

    this.registerFilterService.filterObservable.subscribe((filter) => {
      this.reload();
    });
  }

  ngOnDestroy() {
    this.destroy.next(true);
    this.destroy.unsubscribe();
  }

  get user() {
    return this.authState.getFullName();
  }

  getFilterChips(filters: BuildingFilter): Chip[] {
    return Object
      .entries(filters.filter)
      .filter(([, value]) => {
        return Array.isArray(value) ? value.length : !!value;
      })
      .reduce((currentValue, [key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(subValues => {
              currentValue.push({
                column: key,
                value: this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, key, subValues)
              })
            });
            return currentValue;
          } else if (key === 'GlobalID') {
            const globalIds = value.split(',');
            globalIds.forEach(v => {
              currentValue.push({
                column: key,
                value: v
              })
            });
            return currentValue;
          } else {
            currentValue.push({
              column: key,
              value: this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, key, value)
            });
            return currentValue;
          }
        },
        [] as Chip[]
      );
  }

  openFilter() {
    this.matDialog
      .open(RegisterFilterComponent, {
        data: JSON.parse(JSON.stringify(this.registerFilterService.getFilter()))
      }).afterClosed().subscribe((newFilterConfig: BuildingFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  remove($event: Chip) {
    const filterCopy = JSON.parse(JSON.stringify(this.registerFilterService.getFilter()));
    if ($event.column === 'GlobalID') {
      const values = (filterCopy as any).filter[$event.column].split(',')
        .filter((value: string) => value !== $event.value);
      (filterCopy as any).filter[$event.column] = values.join(',');
    } else if (Array.isArray((filterCopy as any).filter[$event.column])) {
      (filterCopy as any).filter[$event.column] = (filterCopy as any).filter[$event.column]
        .filter((value: string) => this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, $event.column, value) !== $event.value);
    } else {
      (filterCopy as any).filter[$event.column] = '';
    }
    this.registerFilterService.updateFilter(filterCopy, FILTER_REGISTER);
  }

  getValueFromStatus(column: string, code: string | string[]) {
    if (Array.isArray(code)) {
      return code.map(c => this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, c));
    }
    if (column === 'BldMunicipality') {
      return this.getMunicipality(column, code);
    }
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, code);
  }

  getMunicipality(column: string, code: string) {
    return this.commonBuildingRegisterHelper.getMunicipality(this.fields, column, code);
  }

  private reload() {
    this.loadBuildings().pipe(takeUntil(this.destroy)).subscribe((res) => this.handleResponse(res));
  }

  private loadBuildings() {
    const filter = {
      where: this.registerFilterService.prepareWhereCase()
    } as Partial<QueryFilter>;
    return this.commonBuildingService.getBuildingData(filter).pipe(catchError((err) => {
      console.log(err);
      return of(null);
    }));
  }

  private handleResponse(res: any) {
    if (isDevMode()) {
      console.log('Data', res);
    }
    if (!res) {
      // this.matSnack.open('Could not load result. Please try again', 'Ok', {duration: 3000});
      return;
    }
    this.registerFilterService.updateGlobalIds(res.globalIds);
    this.changeDetectionRef.markForCheck();
  }

  private handlePopupClose(newFilterConfig: BuildingFilter | null) {
    if (newFilterConfig) {
      this.registerFilterService.updateFilter(newFilterConfig, FILTER_REGISTER);
    }
  }
}
