import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonBuildingService } from '../../service/common-building.service';
import { Subject } from 'rxjs';
import { FormObject, getFormObjectOptions, getFormObjectType } from '../../model/form-object';
import { Building } from '../../model/building';
import { EDITABLE_PROP, ALIAS_PROP, DOMAIN_PROP, TYPE_PROP, LENGTH_PROP, NAME_PROP, NULLABLE_PROP, DEFAULT_VALUE_PROP } from '../../constant/common-constants';
import {MatDatepickerModule} from "@angular/material/datepicker";
import {DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule} from "@angular/material/core";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import {RegisterLogService} from "../../register-log-view/register-log-table/register-log.service";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MY_FORMATS} from "../../model/common-utils";

@Component({
  selector: 'asrdb-building-details-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  providers: [
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
  templateUrl: './building-details-form.component.html',
  styleUrls: ['./building-details-form.component.css']
})
export class BuildingDetailsFormComponent implements OnInit, OnDestroy {

  @Input() formGroup!: FormGroup;
  @Input() existingBuildingDetails?: Building;

  private onDestroy = new Subject();

  formStructure: FormObject[] = [];

  private readonly HIDDEN_FIELDS = [
    'last_edited_user',
    'last_edited_date',
    'created_user',
    'created_date',
    'BldLatitude',
    'BldLongitude',
    'external_creator',
    'external_editor',
    'external_creation_date',
    'external_edited_date',
    'BldQuality'
  ];

  constructor(private buildingService: CommonBuildingService, private registerLogService: RegisterLogService) {
  }

  ngOnInit(): void {
    this.buildingService.getAttributesMetadata().subscribe((fields: never[]) => {
      fields = fields.filter(field => field[EDITABLE_PROP] && !this.HIDDEN_FIELDS.includes(field[NAME_PROP]));
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
    const fieldType = field[DOMAIN_PROP] ? 'select' : getFormObjectType(field[TYPE_PROP], field[LENGTH_PROP] ?? 0);
    const fieldOptions = getFormObjectOptions(fieldType, field[DOMAIN_PROP]);
    this.formStructure.push({
      name: field[NAME_PROP],
      alias: field[ALIAS_PROP],
      type: fieldType,
      selectOptions: fieldOptions
    });
  }

  private createFormControlForField(field: never) {
    const fieldName = field[NAME_PROP];
    const value = (this.existingBuildingDetails as any)?.[fieldName];
    const defaultValue = field[DEFAULT_VALUE_PROP] ?? '';
    const control = new FormControl(value ? value : defaultValue);
    if (!field[NULLABLE_PROP]) {
      control.addValidators(Validators.required);
    }
    if (field[LENGTH_PROP]) {
      control.addValidators(Validators.maxLength(field[LENGTH_PROP]));
    }
    this.formGroup.addControl(fieldName, control);
  }

  ngOnDestroy(): void {
    this.onDestroy.next(true);
    this.onDestroy.complete();
  }

  getLogForField(variable: string): string {
    return this.registerLogService.getLogForVariable('BUILDING', variable)?.QualityMessageEn
      ?? '';
  }
}
