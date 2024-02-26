import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonBuildingService } from '../../service/common-building.service';
import { Subject } from 'rxjs';
import { CommonRegisterHelperService } from '../../service/common-helper.service';
import { FormObject, getFormObjectOptions, getFormObjectType } from '../../model/form-object';
import { Building } from '../../model/building';

@Component({
  selector: 'asrdb-building-details-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './building-details-form.component.html',
  styleUrls: ['./building-details-form.component.css']
})
export class BuildingDetailsFormComponent implements OnInit, OnDestroy {

  @Input() formGroup!: FormGroup;
  @Input() existingBuildingDetails?: Building;

  private onDestroy = new Subject();

  formStructure: FormObject[] = [];

  private readonly EDITABLE_PROP = 'editable';
  private readonly ALIAS_PROP = 'alias';
  private readonly DOMAIN_PROP = 'domain';
  private readonly TYPE_PROP = 'type';
  private readonly NAME_PROP = 'name';
  private readonly LENGTH_PROP = 'length';
  private readonly DEFAULT_VALUE_PROP = 'defaultValue';
  private readonly NULLABLE_PROP = 'nullable';

  private readonly HIDDEN_FIELDS = ['last_edited_user', 'last_edited_date', 'created_user', 'created_date', 'BldLatitude', 'BldLongitude'];

  constructor(private buildingService: CommonBuildingService) {
  }

  ngOnInit(): void {
    this.buildingService.getAttributesMetadata().subscribe((fields: never[]) => {
      fields = fields.filter(field => field[this.EDITABLE_PROP] && !this.HIDDEN_FIELDS.includes(field[this.ALIAS_PROP]));
      if (!this.formGroup) {
        this.formGroup = new FormGroup({});
      }
      fields.forEach(field => {
        this.createFormControlForField(field);
        this.createFormObject(field);
      });
    });
  }

  private createFormObject(field: never) {
    const fieldType = field[this.DOMAIN_PROP] ? 'select' : getFormObjectType(field[this.TYPE_PROP], field[this.LENGTH_PROP] ?? 0);
    const fieldOptions = getFormObjectOptions(fieldType, field[this.DOMAIN_PROP]);
    this.formStructure.push({
      name: field[this.NAME_PROP],
      alias: field[this.ALIAS_PROP],
      type: field[this.DOMAIN_PROP] ? 'select' : getFormObjectType(field[this.TYPE_PROP], field[this.LENGTH_PROP] ?? 0),
      selectOptions: fieldOptions
    });
  }

  private createFormControlForField(field: never) {
    const fieldName = field[this.NAME_PROP];
    const value = (this.existingBuildingDetails as any)?.[fieldName];
    const defaultValue = field[this.DEFAULT_VALUE_PROP] ?? '';
    const control = new FormControl(value ? value : defaultValue);
    if (!field[this.NULLABLE_PROP]) {
      control.addValidators(Validators.required);
    }
    if (field[this.LENGTH_PROP]) {
      control.addValidators(Validators.maxLength(field[this.LENGTH_PROP]));
    }
    this.formGroup.addControl(fieldName, control);
  }

  ngOnDestroy(): void {
    this.onDestroy.next(true);
    this.onDestroy.complete();
  }
}
