import { Component, OnInit, ViewChild } from '@angular/core';
import { QualityManagementService } from '../quality-management.service';
import { Observable, map, switchMap } from 'rxjs';
import { EntityType, QualityManagementConfig, QualityRule } from '../quality-management-config';
import { ActivatedRoute, Router } from '@angular/router';
import { Chip } from 'src/app/common/standalone-components/chip/chip.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'asrdb-quality-management-table',
  templateUrl: './quality-management-table.component.html',
  styleUrls: ['./quality-management-table.component.css']
})
export class QualityManagementTableComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public qualityRulesObservable: Observable<MatTableDataSource<any>>;
  public isLoadingResults: Observable<boolean>;
  public displayedColumns = [
    'id',
    'localId',
    'nameAl',
    'nameEn',
    'variable',
    'version',
    // 'qualityAction',
    'ruleStaus',
    // 'ruleRequirement',
    // 'expression',
    'actions',
  ];

  private qualityType: string | null;

  // TODO: Change this
  filterConfig: any = {
    filter: {
      BldMunicipality: '',
      BldStatus: '',
      BldType: '',
      GlobalID: ''
    },
    options: {
      BldMunicipality: [] as any[],
      BldStatus: [] as any[],
      BldType: [] as any[],
    }
  };

  constructor(
    private qualityManagementService: QualityManagementService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    this.qualityRulesObservable = this.qualityManagementService.qualityRulesAsObservable.pipe(map((value) => {
      const datasource = new MatTableDataSource(value);
      datasource.paginator = this.paginator;
      return datasource;
    }));
    this.isLoadingResults = this.qualityManagementService.loadingResultsAsObservable;

    this.qualityType = this.activatedRoute.snapshot.paramMap.get('entity');
  }

  ngOnInit(): void {
    this.qualityManagementService.getData(this.qualityType);
  }

  openFilter() {
    // this.matDialog
    //   .open(BuildingListViewFilterComponent, {
    //     data: JSON.parse(JSON.stringify(this.filterConfig))
    //   }).afterClosed().subscribe((newFilterConfig: BuildingFilter | null) => this.handlePopupClose(newFilterConfig));
  }

  reload() {
    this.qualityManagementService.getData(this.qualityType);
  }

  remove($event: Chip) {
    (this.filterConfig.filter as any)[$event.column] = "";
    this.reload();
  }

  viewDetails(id: string) {
    this.router.navigateByUrl('/dashboard/quality-management/details/' + id);
  }

  edit(id: string) {
    this.router.navigateByUrl('/dashboard/buildings-register/edit/' + id);
  }
}
