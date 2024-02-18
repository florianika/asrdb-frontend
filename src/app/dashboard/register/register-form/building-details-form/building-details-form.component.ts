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
  private onDestroy = new Subject();

  formStructure: FormObject[] = [];

  constructor(private buildingService: CommonBuildingService) {
  }

  ngOnInit(): void {
    this.buildingService.getAttributesMetadata().subscribe((fields: never[]) => {
      fields = fields.filter(field => field['editable'] && !['last_edited_user', 'last_edited_date'].includes(field['alias']));
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
    const fieldType = field['domain'] ? 'select' : getFormObjectType(field['type'], field['length'] ?? 0);
    const fieldOptions = getFormObjectOptions(fieldType, field['domain']);
    this.formStructure.push({
      name: field['name'],
      alias: field['alias'],
      type: field['domain'] ? 'select' : getFormObjectType(field['type'], field['length'] ?? 0),
      selectOptions: fieldOptions
    });
  }

  private createFormControlForField(field: never) {
    const control = new FormControl(field['defaultValue'] ?? '');
    if (!field['nullable']) {
      control.addValidators(Validators.required);
    }
    if (field['length']) {
      control.addValidators(Validators.maxLength(field['length']));
    }
    this.formGroup.addControl(field['name'], control);
  }

  ngOnDestroy(): void {
    this.onDestroy.next(true);
    this.onDestroy.complete();
  }
}
