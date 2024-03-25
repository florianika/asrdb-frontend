import { Component, OnDestroy, OnInit } from '@angular/core';
import { QualityManagementService } from '../quality-management.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType, QualityRule } from '../quality-management-config';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'asrdb-quality-management-edit',
  templateUrl: './quality-management-edit.component.html',
  styleUrls: ['./quality-management-edit.component.css']
})
export class QualityManagementEditComponent implements OnInit, OnDestroy {
  public qualityRuleObservable: Observable<QualityRule | null>;
  public isLoadingResults: Observable<boolean>;
  public qualityType: EntityType;
  public id: string | null;

  constructor(private qualityManagementService: QualityManagementService,
    private activatedRoute: ActivatedRoute) {
    this.qualityRuleObservable = this.qualityManagementService.qualityRuleAsObservable;
    this.isLoadingResults = this.qualityManagementService.loadingResultsAsObservable;
    this.qualityType = this.activatedRoute.snapshot.paramMap.get('entity') as EntityType ?? 'BUILDING';
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    if (this.id) {
      this.qualityManagementService.getRule(this.qualityType, this.id);
    }
  }

  ngOnDestroy(): void {
    this.qualityManagementService.cancleEdit();
  }
}
