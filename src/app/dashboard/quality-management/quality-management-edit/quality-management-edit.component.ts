import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { QualityManagementService } from '../quality-management.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType } from '../quality-management-config';
import { BUILDING_ENTITY } from '../../../common/constants/common-constants';

@Component({
    selector: 'asrdb-quality-management-edit',
    templateUrl: './quality-management-edit.component.html',
    styleUrls: ['./quality-management-edit.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class QualityManagementEditComponent implements OnInit, OnDestroy {
  public qualityRule = this.qualityManagementService.qualityRule;
  public isLoadingResults = this.qualityManagementService.loadingResults;
  public qualityType: EntityType;
  public id: string | null;

  constructor(
    private qualityManagementService: QualityManagementService,
    private activatedRoute: ActivatedRoute
  ) {
    this.qualityType =
      (this.activatedRoute.snapshot.paramMap.get('entity') as EntityType) ??
      BUILDING_ENTITY;
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    if (this.id) {
      this.qualityManagementService.getRule(this.qualityType, this.id);
    }
  }

  ngOnDestroy(): void {
    this.qualityManagementService.cancelEdit();
  }
}
