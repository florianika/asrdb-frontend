import {
  Component,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { EntityType } from '../../../quality-management-config';
import { FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  BUILDING_ENTITY,
  DWELLING_ENTITY,
  ENTRANCE_ENTITY,
} from '../../../../../common/constants/common-constants';
import { CommonEntityStructureService } from '../../../../common/service/common-entity-structure.service';
import { getLocaleProperty } from '../../../../common/helper/locale-property-helper';

type SelectOption = { text: string; value: string };

@Component({
  selector: 'asrdb-quality-management-variable-selection',
  templateUrl: './quality-management-variable-selection.component.html',
  styleUrls: ['./quality-management-variable-selection.component.css'],
  standalone: false,
})
export class QualityManagementVariableSelectionComponent
  implements OnInit, OnDestroy
{
  @Input() entity!: EntityType;
  @Input() label!: string;
  @Input() variable!: string;
  @Input() formGroup!: FormGroup;

  private destroy$ = new Subject();

  private _variables = new Map<EntityType, SelectOption[]>([
    [BUILDING_ENTITY, []],
    [ENTRANCE_ENTITY, []],
    [DWELLING_ENTITY, []],
  ]);

  public filterValue = '';
  public filteredVariables: SelectOption[] = [];

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
          this.filterVariables();
        }
      });
    this.commonEntityStructureService.getAllEntityStructures();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
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
        return variable.value
          .toLowerCase()
          .includes(this.filterValue.toLowerCase());
      });
    } else {
      this.filteredVariables = [];
    }
  }
}
