import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { QualityManagementService } from '../quality-management.service';
import { Observable, Subject, map, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Chip } from 'src/app/common/standalone-components/chip/chip.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import {
  FILTER_CONFIG_PREFIX,
  QualityManagementTableFilterComponent
} from './quality-management-table-fitler/quality-management-table-filter.component';
import { QualityRuleFilter } from './model/quality-rule-filter';
import {MatSort} from "@angular/material/sort";
import { mkConfig, generateCsv, download, asBlob, CsvOutput } from "export-to-csv";


@Component({
  selector: 'asrdb-quality-management-table',
  templateUrl: './quality-management-table.component.html',
  styleUrls: ['./quality-management-table.component.css']
})
export class QualityManagementTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public qualityRulesObservable!: Observable<MatTableDataSource<any>>;
  public isLoadingResults!: Observable<boolean>;
  public displayedColumns = [
    'id',
    'localId',
    'variable',
    'ruleRequirement',
    'version',
    'ruleStatus',
    'qualityAction',
    'actions',
  ];
  private datasource = new MatTableDataSource();

  private qualityType!: string | null;
  private subscription = new Subject();

  filterConfig: QualityRuleFilter = {
    localId: '',
    variable: '',
    ruleStatus: '',
    qualityAction: '',
  };
  private defaultFilterConfig: QualityRuleFilter = {
    localId: '',
    variable: '',
    ruleStatus: '',
    qualityAction: '',
  };
  private config = { useKeysAsHeaders: true };
  private csvConfig = mkConfig(this.config as any);

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

  ngAfterViewInit() {

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
      .open(QualityManagementTableFilterComponent, {
        data: JSON.parse(JSON.stringify({ filter: this.filterConfig, qualityType: this.qualityType })),
        width: '700px',
      })
      .afterClosed()
      .subscribe((newFilterConfig: QualityRuleFilter | null) => this.handlePopupClose(newFilterConfig));
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

  downloadCSV() {
    const data = this.datasource.data
      .filter((item: any) => {
        return (!this.filterConfig.localId || item.localId.toLowerCase().includes(this.filterConfig.localId.toLowerCase()))
          && (!this.filterConfig.variable || item.variable.toLowerCase().includes(this.filterConfig.variable.toLowerCase()))
          && (!this.filterConfig.ruleStatus || item.ruleStatus.toLowerCase().includes(this.filterConfig.ruleStatus.toLowerCase()))
          && (!this.filterConfig.qualityAction || item.qualityAction.toLowerCase().includes(this.filterConfig.qualityAction.toLowerCase()));
      })
      .map((item: any) => {
      return {
        localId: item.localId,
        variable: item.variable,
        ruleRequirement: item.ruleRequirement,
        version: item.version,
        ruleStatus: item.ruleStatus,
        qualityAction: item.qualityAction
      }
    });
    const csv: CsvOutput = generateCsv(this.csvConfig as any)(data);
    const blob = asBlob(this.csvConfig)(csv);
    // Get the button in your HTML
    const csvBtn = document.createElement('a');
    csvBtn.setAttribute('href', URL.createObjectURL(blob));
    csvBtn.setAttribute('download', 'export.csv');
    csvBtn.style.display = 'none';
    // Append the button to the body
    document.body.appendChild(csvBtn);
    // Create a click event
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    // Dispatch the click event
    csvBtn.dispatchEvent(clickEvent);
    // Remove the button from the document
    document.body.removeChild(csvBtn);
  }

  toggleEdit(id: string) {
    if (this.qualityType) {
      this.qualityManagementService.toogleStatus(id, this.qualityType);
    }
  }

  private loadFilter() {
    const filterConfig = localStorage.getItem(FILTER_CONFIG_PREFIX + this.qualityType);
    if (filterConfig) {
      try {
        this.handlePopupClose(JSON.parse(filterConfig));
      } catch (e) {
        this.handlePopupClose(this.defaultFilterConfig);
        localStorage.setItem(FILTER_CONFIG_PREFIX + this.qualityType, JSON.stringify(this.defaultFilterConfig));
        console.error(e);
      }
    } else {
      this.handlePopupClose(this.defaultFilterConfig);
      localStorage.setItem(FILTER_CONFIG_PREFIX + this.qualityType, JSON.stringify(this.defaultFilterConfig));
    }
  }

  private init() {
    this.filterConfig = JSON.parse(JSON.stringify(this.filterConfig));
    this.qualityRulesObservable = this.qualityManagementService.qualityRulesAsObservable.pipe(map((value: any) => {
      this.datasource.data = value;
      this.datasource.paginator = this.paginator;
      this.datasource.sort = this.sort;
      this.loadFilter();
      return this.datasource;
    }));
    this.isLoadingResults = this.qualityManagementService.loadingResultsAsObservable;
    this.qualityType = this.activatedRoute.snapshot.paramMap.get('entity');
    this.datasource.filterPredicate = (data: any, filter) => {
      const filterObject: QualityRuleFilter = JSON.parse(filter);
      let shouldShow = true;
      for (const [key, value] of Object.entries(filterObject)) {
        if (value) {
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
