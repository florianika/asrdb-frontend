import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { EntityType } from 'src/app/model/RolePermissions.model';
import { BUILDING_ENTITY } from '../../constants/common-constants';

@Component({
  standalone: true,
  selector: 'asrdb-entity-type-selector',
  templateUrl: './entity-type-selector.component.html',
  styleUrls: ['./entity-type-selector.component.css'],
  imports: [MatSelectModule, MatFormFieldModule, FormsModule],
})
export class EntityTypeSelectorComponent {
  @Input() required = false;
  @Input() disabled = false;
  @Input() entityType: EntityType | '' = BUILDING_ENTITY;
  @Output() entityTypeChange = new EventEmitter<EntityType>();

  changeRole(selectedPermission: MatSelectChange) {
    this.entityTypeChange.emit(selectedPermission.value);
  }
}
