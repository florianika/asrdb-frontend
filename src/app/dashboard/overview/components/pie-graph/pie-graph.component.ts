import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonBuildingService } from '../../../common/service/common-building.service';
import { RegisterFilterService } from '../../../register/register-table-view/register-filter.service';
import { Subject, takeUntil } from 'rxjs';
import { QueryFilter } from '../../../register/model/query-filter';
import { BuildingFilter } from '../../../register/model/building';

@Component({
    selector: 'asrdb-building-quality-graph',
    templateUrl: './pie-graph.component.html',
    styleUrls: ['./pie-graph.component.css'],
    standalone: false
})
export class PieGraphComponent implements OnInit, OnDestroy {
  @Input() fields = [];
  @Input() title = '';
  @Input() variable = '';

  private existingFilter?: BuildingFilter;
  private destroy = new Subject();
  private uniqueValueInfos = [];
  private colorByCode = new Map<string, string>();
  private bldStatusColorByCode = new Map<string, string>();
  private readonly defaultPalette = [
    '#1d4ed8',
    '#059669',
    '#f59e0b',
    '#dc2626',
    '#7c3aed',
    '#0f766e',
    '#ea580c',
    '#4f46e5',
    '#65a30d',
    '#be185d',
    '#0891b2',
    '#9333ea',
  ];
  public graph?: any;

  constructor(
    private commonBuildingService: CommonBuildingService,
    private filterService: RegisterFilterService,
    private changeDetectionRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.bldStatusColorByCode = new Map(
      this.commonBuildingService.uniqueValueInfos
        .map(info => {
          const color = (info.symbol as any)?.outline?.color as
            | string
            | undefined;
          if (info.value === undefined || !color) {
            return null;
          }
          return [String(info.value), color] as [string, string];
        })
        .filter((entry): entry is [string, string] => entry !== null)
    );

    const field = this.fields?.find(field => field['name'] === this.variable);
    if (!field) {
      return;
    }
    this.uniqueValueInfos = field['domain']?.['codedValues'];
    this.colorByCode = this.getColorMapByVariable();

    this.filterService.filterObservable
      .pipe(takeUntil(this.destroy))
      .subscribe(filter => {
        if (JSON.stringify(filter) === JSON.stringify(this.existingFilter)) {
          return;
        }
        this.existingFilter = filter;
        this.reload();
      });
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
      outStatistics: [
        {
          statisticType: 'count',
          onStatisticField: this.variable,
          outStatisticFieldName: 'value',
        },
      ],
    } as Partial<QueryFilter>;
    this.commonBuildingService
      .getBuildingStats(filter)
      .pipe(takeUntil(this.destroy))
      .subscribe((statsResults: __esri.FeatureSet) => {
        const points = statsResults.features.map(feature => {
          const code = feature.attributes[this.variable];
          const mappedLabel = this.uniqueValueInfos.find(o => o['code'] === code);
          return {
            value: feature.attributes.value,
            code,
            label: mappedLabel?.['name'] ?? code,
          };
        });

        const data = points.map(point => point.value);
        const labels = points.map(point => point.label);
        const colors = points.map(
          point => this.colorByCode.get(String(point.code)) ?? '#9ca3af'
        );
        this.graph = {
          data: [
            {
              type: 'pie',
              values: data,
              labels: labels,
              marker: { colors },
            },
          ],
          layout: {
            autosize: true,
            title: this.title,
            textinfo: 'label+percent',
            textposition: 'outside',
            automargin: true,
            legend: { orientation: 'h', side: 'top' },
          },
        };
        this.changeDetectionRef.detectChanges();
      });
  }

  private getColorMapByVariable(): Map<string, string> {
    if (this.variable === 'BldStatus') {
      return this.bldStatusColorByCode;
    }

    const map = new Map<string, string>();
    this.uniqueValueInfos.forEach((info: any, index: number) => {
      if (info?.code === undefined || info?.code === null) {
        return;
      }
      const color = this.defaultPalette[index % this.defaultPalette.length];
      map.set(String(info.code), color);
    });
    return map;
  }
}
