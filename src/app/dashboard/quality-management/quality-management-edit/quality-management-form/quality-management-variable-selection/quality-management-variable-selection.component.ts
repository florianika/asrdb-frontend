import {Component, Input, isDevMode, OnDestroy} from '@angular/core';
import {EntityType} from '../../../quality-management-config';
import {FormGroup} from '@angular/forms';
import {catchError, forkJoin, of, Subject, takeUntil} from "rxjs";
import {CommonBuildingService} from "../../../../common/service/common-building.service";
import {CommonEntranceService} from "../../../../common/service/common-entrance.service";
import {CommonDwellingService} from "../../../../common/service/common-dwellings.service";
import {
  BUILDING_HIDDEN_FIELDS,
  DWELLING_HIDDEN_FIELDS,
  ENTRANCE_HIDDEN_FIELDS
} from "../../../../../common/data/hidden-fields";

type SelectOption = { text: string, value: string };

@Component({
  selector: 'asrdb-quality-management-variable-selection',
  templateUrl: './quality-management-variable-selection.component.html',
  styleUrls: ['./quality-management-variable-selection.component.css']
})
export class QualityManagementVariableSelectionComponent implements OnDestroy {
  @Input() entity!: EntityType;
  @Input() label!: string;
  @Input() variable!: string;
  @Input() formGroup!: FormGroup;

  private destroy$ = new Subject();

  private _variables = new Map<EntityType, SelectOption[]>([
    ['BUILDING', []],
    ['ENTRANCE', []],
    ['DWELLING', []],
  ]);

  public filterValue = '';
  public filteredVariables: SelectOption[] = [];

  constructor(
    private buildingService: CommonBuildingService,
    private entranceService: CommonEntranceService,
    private dwellingService: CommonDwellingService,
  ) {
    forkJoin([
        buildingService.getAttributesMetadata(),
        entranceService.getAttributesMetadata(),
        dwellingService.getAttributesMetadata()
      ]
    )
      .pipe(takeUntil(this.destroy$), catchError((error) => {
        console.log(error);
        return of([]);
      }))
      .subscribe({
        next: ([buildingFields, entranceFields, dwellingFields]) => {
          if (isDevMode()) {
            console.log(buildingFields);
            console.log(entranceFields);
            console.log(dwellingFields);
          }
          this._variables.set('BUILDING', this.mapVariables(buildingFields));
          this._variables.set('ENTRANCE', this.mapVariables(entranceFields));
          this._variables.set('DWELLING', this.mapVariables(dwellingFields));

          this.filterVariables();
        }
      })
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  updateFilter($event: any) {
    this.filterValue = $event.target.value;
    this.filterVariables();
  }

  clearFilter($event: any) {
    $event.stopPropagation();
    $event.preventDefault();
    this.filterValue = '';
    this.filterVariables();
  }

  private filterVariables() {
    const variables = this._variables.get(this.entity);
    if (variables && variables.length > 0) {
      this.filteredVariables = variables.filter((variable: SelectOption) => {
        return variable.value.toLowerCase().includes(this.filterValue.toLowerCase());
      });
    } else {
      this.filteredVariables = [];
    }
  }

  private mapVariables(fields: any[]): SelectOption[] {
    return fields
      .filter(field =>
        field.editable
        && !BUILDING_HIDDEN_FIELDS.includes(field.name)
        && !ENTRANCE_HIDDEN_FIELDS.includes(field.name)
        && !DWELLING_HIDDEN_FIELDS.includes(field.name)
      )
      .map(field => ({
        text: field.alias ? field.alias : field.name,
        value: field.name
      }));
  }
}
