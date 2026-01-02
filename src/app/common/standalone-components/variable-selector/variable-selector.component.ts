import {
  Component,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatFormFieldAppearance,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { EntityType } from 'src/app/model/RolePermissions.model';
import { CommonModule } from '@angular/common';
import { CommonBuildingService } from '../../../dashboard/common/service/common-building.service';
import { CommonEntranceService } from '../../../dashboard/common/service/common-entrance.service';
import { CommonDwellingService } from '../../../dashboard/common/service/common-dwellings.service';
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  BUILDING_ENTITY,
  DWELLING_ENTITY,
  ENTRANCE_ENTITY,
} from '../../constants/common-constants';
import { CommonEntityStructureService } from '../../../dashboard/common/service/common-entity-structure.service';
import { getLocaleProperty } from '../../../dashboard/common/helper/locale-property-helper';

type SelectOption = { text: string; value: string };

@Component({
  standalone: true,
  selector: 'asrdb-variable-selector',
  templateUrl: './variable-selector.component.html',
  styleUrls: ['./variable-selector.component.css'],
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    CommonModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
  ],
  providers: [
    CommonBuildingService,
    CommonEntranceService,
    CommonDwellingService,
  ],
})
export class VariableSelectorComponent implements OnInit, OnDestroy {
  @Input() required = false;
  @Input() disabled = false;
  @Input() variable = '';
  @Input() appearance: MatFormFieldAppearance = 'fill';
  @Input() entityType: EntityType | '' = BUILDING_ENTITY;
  @Input() clearable = false;
  @Output() variableChange = new EventEmitter<string>();

  public filterValue = '';

  private destroy$ = new Subject();
  private _variables = new Map<EntityType, SelectOption[]>([
    [BUILDING_ENTITY, []],
    [ENTRANCE_ENTITY, []],
    [DWELLING_ENTITY, []],
  ]);

  public get variables(): SelectOption[] {
    return this._variables
      .get(this.entityType ? this.entityType : BUILDING_ENTITY)!
      .filter((variable: any) => {
        return (
          this.filterValue === '' ||
          variable.value.toLowerCase().includes(this.filterValue.toLowerCase())
        );
      });
  }

  constructor(
    private commonEntityStructureService: CommonEntityStructureService,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit() {
    this.commonEntityStructureService.structureLoaded
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        if (!response.loading && response.structure && response.type) {
          const variables = response.structure
            .filter(el => el.selectable)
            .map(el => ({
              text: getLocaleProperty(el.label, this.locale as 'en' | 'sq'),
              value: el.name,
            }));
          this._variables.set(response.type as EntityType, variables);
        }
      });
    this.commonEntityStructureService.getAllEntityStructures();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  changeVariable(selectedVariable: MatSelectChange) {
    this.variableChange.emit(selectedVariable.value);
  }

  clearValue($event: any) {
    $event.stopPropagation();
    $event.preventDefault();
    this.variableChange.emit('');
  }

  clearFilter($event: any) {
    $event.stopPropagation();
    $event.preventDefault();
    this.filterValue = '';
  }
}
