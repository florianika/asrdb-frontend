import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { EntityType } from 'src/app/model/RolePermissions.model';
import { CommonModule } from '@angular/common';
import {CommonBuildingService} from "../../../dashboard/common/service/common-building.service";
import {CommonEntranceService} from "../../../dashboard/common/service/common-entrance.service";
import {CommonDwellingService} from "../../../dashboard/common/service/common-dwellings.service";
import {catchError, forkJoin, of, Subject, takeUntil} from "rxjs";
import {BUILDING_HIDDEN_FIELDS, DWELLING_HIDDEN_FIELDS, ENTRANCE_HIDDEN_FIELDS} from "../../data/hidden-fields";

type SelectOption = { text: string, value: string };

@Component({
  standalone: true,
  selector: 'asrdb-variable-selector',
  templateUrl: './variable-selector.component.html',
  styleUrls: ['./variable-selector.component.css'],
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    CommonModule
  ],
  providers: [
    CommonBuildingService,
    CommonEntranceService,
    CommonDwellingService
  ]
})
export class VariableSelectorComponent implements OnDestroy{
  @Input() required = false;
  @Input() disabled = false;
  @Input() variable = '';
  @Input() appearance: MatFormFieldAppearance = 'fill';
  @Input() entityType: EntityType | '' = 'BUILDING';
  @Output() variableChange = new EventEmitter<string>();
  private destroy$ = new Subject();

  private _variables = new Map<EntityType, SelectOption[]>([
    ['BUILDING', []],
    ['ENTRANCE', []],
    ['DWELLING', []],
  ])

  public get variables() : SelectOption[] {
    return this._variables.get(this.entityType ? this.entityType : 'BUILDING')!;
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

  changeRole(selectedPermission: MatSelectChange) {
    this.variableChange.emit(selectedPermission.value);
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
