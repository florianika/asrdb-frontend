import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {AuthStateService} from 'src/app/common/services/auth-state.service';
import {Chip} from "../../common/standalone-components/chip/chip.component";
import {BuildingFilter} from "../register/model/building";
import {RegisterFilterService} from "../register/register-table-view/register-filter.service";
import {CommonRegisterHelperService} from "../register/service/common-helper.service";
import {CommonBuildingService} from "../register/service/common-building.service";
import {Subject, takeUntil} from "rxjs";
import {RegisterFilterComponent} from "../register/register-table-view/register-filter/register-filter.component";
import {MatDialog} from "@angular/material/dialog";

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
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({ column: key, value: this.getValueFromStatus(key, value) }));
  }

  openFilter() {
    this.matDialog
      .open(RegisterFilterComponent, {
        data: JSON.parse(JSON.stringify(this.registerFilterService.getFilter()))
      }).afterClosed().subscribe((newFilterConfig: BuildingFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  remove($event: Chip) {
    const filterCopy = JSON.parse(JSON.stringify(this.registerFilterService.getFilter()));
    (filterCopy as any).filter[$event.column] = '';
    this.registerFilterService.updateFilter(filterCopy);
  }

  getValueFromStatus(column: string, code: string) {
    return this.commonBuildingRegisterHelper.getValueFromStatus(this.fields, column, code);
  }

  private handlePopupClose(newFilterConfig: BuildingFilter | null) {
    if (newFilterConfig) {
      this.registerFilterService.updateFilter(newFilterConfig);
    }
  }
}
