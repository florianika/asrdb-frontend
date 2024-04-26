import {ChangeDetectionStrategy, ChangeDetectorRef, Component, isDevMode, OnDestroy} from '@angular/core';
import {AuthStateService} from 'src/app/common/services/auth-state.service';
import {Chip} from "../../common/standalone-components/chip/chip.component";
import {BuildingFilter} from "../register/model/building";
import {FILTER_REGISTER, RegisterFilterService} from "../register/register-table-view/register-filter.service";
import {CommonRegisterHelperService} from "../common/service/common-helper.service";
import {CommonBuildingService} from "../common/service/common-building.service";
import {catchError, of, Subject, takeUntil} from "rxjs";
import {RegisterFilterComponent} from "../common/components/register-filter/register-filter.component";
import {MatDialog} from "@angular/material/dialog";
import {QueryFilter} from "../register/model/query-filter";
import {FilterHelper} from "../common/helper/filter-helper";

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
    private filterHelper: FilterHelper,
    private changeDetectionRef: ChangeDetectorRef,
  ) {
    this.commonBuildingService.getAttributesMetadata()
      .pipe(takeUntil(this.destroy))
      .subscribe(fields => {
        this.fields = fields;
        filterHelper.init(fields);
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
      .reduce(this.filterHelper.getFilterChipStructure, [] as Chip[]);
  }

  openFilter() {
    this.matDialog
      .open(RegisterFilterComponent, {
        data: JSON.parse(JSON.stringify(this.registerFilterService.getFilter()))
      }).afterClosed().subscribe((newFilterConfig: BuildingFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  remove($event: Chip) {
    const filterCopy = this.filterHelper.removeFilterValue($event, this.registerFilterService.getFilter());
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
