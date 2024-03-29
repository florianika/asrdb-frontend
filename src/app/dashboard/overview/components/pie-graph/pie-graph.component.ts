import {ChangeDetectorRef, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonBuildingService} from "../../../register/service/common-building.service";
import {RegisterFilterService} from "../../../register/register-table-view/register-filter.service";
import {Subject, takeUntil} from "rxjs";
import {QueryFilter} from "../../../register/model/query-filter";
import {BuildingFilter} from "../../../register/model/building";

@Component({
  selector: 'asrdb-building-quality-graph',
  templateUrl: './pie-graph.component.html',
  styleUrls: ['./pie-graph.component.css']
})
export class PieGraphComponent implements OnInit, OnDestroy {

  @Input() fields = [];
  @Input() title = '';
  @Input() variable = '';


  private existingFilter?: BuildingFilter;
  private destroy = new Subject();
  private uniqueValueInfos = [];
  public graph?: any;

  constructor(
    private commonBuildingService: CommonBuildingService,
    private filterService: RegisterFilterService,
    private changeDetectionRef: ChangeDetectorRef
  ) {
    this.filterService.filterObservable
      .pipe(takeUntil(this.destroy))
      .subscribe((filter) => {
        if (JSON.stringify(filter) === JSON.stringify(this.existingFilter)) {
          return;
        }
        this.existingFilter = filter;
        this.reload();
      });
  }

  ngOnInit() {
    const field = this.fields?.find(field => field['name'] === this.variable);
    if (!field) {
      return;
    }
    this.uniqueValueInfos = field['domain']?.['codedValues'];
  }

  ngOnDestroy() {
    this.destroy.next(true);
    this.destroy.unsubscribe();
  }

  private reload() {
    const whereCase = this.filterService.prepareWhereCase();
    const filter = {
      where: whereCase,
      returnGeometry: false,
      groupByFieldsForStatistics: [this.variable],
      orderByFields: [this.variable],
      outStatistics: [{
        statisticType: 'count',
        onStatisticField: this.variable,
        outStatisticFieldName: 'value'
      }]
    } as Partial<QueryFilter>;
    this.commonBuildingService.getBuildingStats(filter)
      .pipe(takeUntil(this.destroy))
      .subscribe((statsResults: __esri.FeatureSet) => {
        const data = statsResults.features.map((feature) => feature.attributes.value);
        const labels = statsResults.features.map((feature) => feature.attributes[this.variable]).map((label) => {
          const newLabel = this.uniqueValueInfos.find(o => o['code'] === label);
          return newLabel?.['name'] ?? label;
        });
        this.graph = {
          data: [{
            type: 'pie',
            // values: data,
            labels: labels,
          }],
          layout: {
            autosize: true,
            title: this.title,
            textinfo: 'label+percent',
            textposition: 'outside',
            automargin: true,
            legend: {orientation: 'h', side: 'top'}
          },
        }
        this.changeDetectionRef.detectChanges();
      });
  }
}
