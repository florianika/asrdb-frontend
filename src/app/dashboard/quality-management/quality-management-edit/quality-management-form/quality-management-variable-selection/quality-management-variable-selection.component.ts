import { Component, Input } from '@angular/core';
import { EntityType } from '../../../quality-management-config';
import { BUILDING_VARIABLES } from '../../../../../common/data/building-variables';
import { ENTRANCE_VARIABLES } from '../../../../../common/data/entrance-variables';
import { DWELLING_VARIABLES } from '../../../../../common/data/dwelling-variables';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'asrdb-quality-management-variable-selection',
  templateUrl: './quality-management-variable-selection.component.html',
  styleUrls: ['./quality-management-variable-selection.component.css']
})
export class QualityManagementVariableSelectionComponent {
  @Input() entity!: EntityType;
  @Input() label!: string;
  @Input() variable!: string;
  @Input() formGroup!: FormGroup;

  private _variables = new Map<EntityType, string[]>([
    ['BUILDING', BUILDING_VARIABLES],
    ['ENTRANCE', ENTRANCE_VARIABLES],
    ['DWELLING', DWELLING_VARIABLES],
  ])

  public get variables() : string[] {
    return this._variables.get(this.entity)!;
  }

}
