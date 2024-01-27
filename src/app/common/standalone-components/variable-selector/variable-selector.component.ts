import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { BUILDING_VARIABLES } from '../../data/building-variables';
import { DWELLING_VARIABLES } from '../../data/dwelling-variables';
import { ENTRANCE_VARIABLES } from '../../data/entrance-variables';
import { EntityType } from 'src/app/model/RolePermissions.model';
import { CommonModule } from '@angular/common';

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
  ]
})
export class VariableSelectorComponent {
  @Input() required = false;
  @Input() disabled = false;
  @Input() variable = '';
  @Input() appearance: MatFormFieldAppearance = 'fill';
  @Input() entityType: EntityType = 'BUILDING';
  @Output() variableChange = new EventEmitter<string>();

  private _variables = new Map<EntityType, string[]>([
    ['BUILDING', BUILDING_VARIABLES],
    ['ENTRANCE', ENTRANCE_VARIABLES],
    ['DWELLING', DWELLING_VARIABLES],
  ])

  public get variables() : string[] {
    return this._variables.get(this.entityType)!;
  }

  changeRole(selectedPermission: MatSelectChange) {
    this.variableChange.emit(selectedPermission.value);
  }
}
