import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { QualityManagementService } from '../quality-management.service';
import { Observable, Subject, map, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Chip } from 'src/app/common/standalone-components/chip/chip.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { QualityManagementTableFitlerComponent } from './quality-management-table-fitler/quality-management-table-fitler.component';
import { QualityRuleFilter } from './model/quality-rule-filter';
import { EntityType } from '../quality-management-config';

@Component({
  selector: 'asrdb-quality-management-table',
  templateUrl: './quality-management-table.component.html',
  styleUrls: ['./quality-management-table.component.css']
})
export class QualityManagementTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public qualityRulesObservable!: Observable<MatTableDataSource<any>>;
  public isLoadingResults!: Observable<boolean>;
  public displayedColumns = [
    'id',
    'localId',
    'nameAl',
    'nameEn',
    'variable',
    'version',
    'ruleStatus',
    'actions',
  ];
  private datasource = new MatTableDataSource();

  private qualityType!: string | null;
  private subscription = new Subject();

  filterConfig: QualityRuleFilter = {
    localId: '',
    nameAl: '',
    nameEn: '',
    variable: '',
    ruleStatus: '',
  };

  get filterChips(): Chip[] {
    return Object
      .entries(this.filterConfig)
      .filter(([, value]) => !!value)
      .map(([key, value]) => ({ column: key, value: value }));
  }

  constructor(
    private qualityManagementService: QualityManagementService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private matDialog: MatDialog) {
    this.init();
    this.activatedRoute.paramMap.pipe(takeUntil(this.subscription)).subscribe(() => {
      this.init();
      this.reload();
    });
  }

  ngOnInit(): void {
    this.qualityManagementService.getRules(this.qualityType);
  }

  ngOnDestroy(): void {
    this.subscription.next(true);
    this.subscription.complete();
  }

  get entityTitle() {
    if (!this.qualityType) {
      return 'Building';
    }
    return this.qualityType.charAt(0) + this.qualityType.substring(1).toLowerCase();
  }

  openFilter() {
    this.matDialog
      .open(QualityManagementTableFitlerComponent, {
        data: JSON.parse(JSON.stringify({filter: this.filterConfig, qualityType: this.qualityType}))
      }).afterClosed().subscribe((newFilterConfig: QualityRuleFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  reload() {
    this.qualityManagementService.getRules(this.qualityType);
  }

  remove($event: Chip) {
    (this.filterConfig as any)[$event.column] = '';
    this.datasource.filter = JSON.stringify(this.filterConfig);
  }

  viewDetails(id: string) {
    this.router.navigateByUrl('/dashboard/quality-management/' + this.qualityType + '/details/' + id);
  }

  edit(id: string) {
    this.router.navigateByUrl('/dashboard/quality-management/' + this.qualityType + '/edit/' + id);
  }

  add() {
    this.router.navigateByUrl('/dashboard/quality-management/' + this.qualityType + '/edit');
  }

  toggleEdit(id: string) {
    this.qualityManagementService.toogleStatus(id, this.qualityType!);
  }

  private init() {
    this.filterConfig = {
      localId: '',
      nameAl: '',
      nameEn: '',
      variable: '',
      ruleStatus: '',
    };
    this.qualityRulesObservable = this.qualityManagementService.qualityRulesAsObservable.pipe(map((value) => {
      this.datasource.data = value;
      this.datasource.paginator = this.paginator;
      return this.datasource;
    }));
    this.isLoadingResults = this.qualityManagementService.loadingResultsAsObservable;
    this.qualityType = this.activatedRoute.snapshot.paramMap.get('entity');
    this.datasource.filterPredicate = (data: any, filter) => {
      const filterObject: QualityRuleFilter = JSON.parse(filter);
      let shouldShow = true;
      for (const [key, value] of Object.entries(filterObject)) {
        if (!!value) {
          shouldShow = shouldShow && data[key] === value;
        }
      }
      return shouldShow;
    };
  }

  private handlePopupClose(newFilter: QualityRuleFilter | null) {
    if (newFilter) {
      this.datasource.filter = JSON.stringify(newFilter);
      this.filterConfig = newFilter;
    }
  }
}
