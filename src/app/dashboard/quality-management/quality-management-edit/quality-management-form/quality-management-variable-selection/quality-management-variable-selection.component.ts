import {Component, Input, OnDestroy} from '@angular/core';
import { EntityType } from '../../../quality-management-config';
import { FormGroup } from '@angular/forms';
import {catchError, forkJoin, of, Subject, takeUntil} from "rxjs";
import {CommonBuildingService} from "../../../../register/service/common-building.service";
import {CommonEntranceService} from "../../../../register/service/common-entrance.service";
import {CommonDwellingService} from "../../../../register/service/common-dwellings.service";

type SelectOption = { text: string, value: string };

@Component({
  selector: 'asrdb-quality-management-variable-selection',
  templateUrl: './quality-management-variable-selection.component.html',
  styleUrls: ['./quality-management-variable-selection.component.css']
})
export class QualityManagementVariableSelectionComponent implements OnDestroy{
  @Input() entity!: EntityType;
  @Input() label!: string;
  @Input() variable!: string;
  @Input() formGroup!: FormGroup;

  private destroy$ = new Subject();

  private _variables = new Map<EntityType, SelectOption[]>([
    ['BUILDING', []],
    ['ENTRANCE', []],
    ['DWELLING', []],
  ])

  public get variables() : SelectOption[] {
    return this._variables.get(this.entity)!;
  }

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
        return of([]);
      }))
      .subscribe({
        next: ([buildingFields, entranceFields, dwellingFields]) => {
          console.log(buildingFields);
          console.log(entranceFields);
          console.log(dwellingFields);

          this._variables.set('BUILDING', this.mapVariables(buildingFields));
          this._variables.set('ENTRANCE', this.mapVariables(entranceFields));
          this._variables.set('DWELLING', this.mapVariables(dwellingFields));
        }
      })
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  private mapVariables(fields: any[]): SelectOption[] {
    return fields.filter(field => field.editable).map(field => ({
      text: field.alias ? field.alias : field.name,
      value: field.name
    }));
  }
}
