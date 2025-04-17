import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonBuildingService } from '../../../common/service/common-building.service';
import {distinctUntilChanged, Subject, takeUntil} from 'rxjs';
import {FormObject, getFormObjectOptions, getFormObjectType, getValue} from '../../model/form-object';
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
import {getColor, MY_FORMATS} from "../../model/common-utils";
import {EntityCreationMapService} from "../entity-management-map.service";
import {RegisterFilterService} from "../../register-table-view/register-filter.service";
import {BUILDING_HIDDEN_FIELDS} from "../../../../common/data/hidden-fields";
import {Log} from "../../register-log-view/model/log";

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
  protected readonly getColor = getColor;

  @Input() formGroup!: FormGroup;
  @Input() existingBuildingDetails?: Building;

  private onDestroy = new Subject();

  formStructure: FormObject[] = [];
  inputFilters: Record<string, string> = {};

  constructor(
    private buildingService: CommonBuildingService,
    private registerLogService: RegisterLogService,
    private mapService: EntityCreationMapService,
    private filterService: RegisterFilterService
  ) {
  }

  ngOnInit(): void {
    this.buildingService.getAttributesMetadata()
      .pipe(takeUntil(this.onDestroy)).subscribe((fields: never[]) => {
      fields = fields.filter(field => field[EDITABLE_PROP] && !BUILDING_HIDDEN_FIELDS.includes(field[NAME_PROP]));
      if (!this.formGroup) {
        this.formGroup = new FormGroup({});
      }
      fields.forEach(field => {
        this.createFormControlForField(field);
        this.createFormObject(field);
      });

      this.formGroup.controls['BldMunicipality'].valueChanges
        .pipe(takeUntil(this.onDestroy), distinctUntilChanged())
        .subscribe(data => {
          this.mapService.setMunicipality(data);
        })
    });
  }

  filterInputOptions($event: any, name: string) {
    const value = $event.target.value;
    this.inputFilters[name] = value;
    this.formStructure.forEach((field: FormObject) => {
      if (field.name === name && field.type === 'select' && field.originalOptions) {
        field.selectOptions = field.originalOptions
          .filter((option: any) => option.text.toLowerCase().includes(value.toLowerCase()));
      }
    });
  }

  clearInputFilter($event: any, name: string) {
    $event.stopPropagation();
    $event.preventDefault();
    this.inputFilters[name] = '';
    this.formStructure.forEach((field: FormObject) => {
      if (field.name === name && field.type === 'select' && field.originalOptions) {
        field.selectOptions = field.originalOptions;
      }
    });
  }

  private createFormObject(field: never) {
    const fieldType = field[DOMAIN_PROP] ? 'select' : getFormObjectType(field[TYPE_PROP], field[LENGTH_PROP] ?? 0);
    const fieldOptions = getFormObjectOptions(fieldType, field[DOMAIN_PROP]);
    this.formStructure.push({
      name: field[NAME_PROP],
      alias: field[ALIAS_PROP],
      type: fieldType,
      selectOptions: fieldOptions,
      originalOptions: fieldOptions,
      maxLength: field[LENGTH_PROP],
      hidden: ['BldLatitude', 'BldLongitude'].includes(field[NAME_PROP])
    });
  }

  private createFormControlForField(field: never) {
    const fieldName = field[NAME_PROP];
    const value = getValue(field, fieldName, this.existingBuildingDetails);
    const defaultValue = field[DEFAULT_VALUE_PROP] ?? '';
    const control = new FormControl(value || value === 0 ? value : defaultValue);
    if (!field[NULLABLE_PROP]) {
      control.addValidators(Validators.required);
    }
    if (field[LENGTH_PROP]) {
      control.addValidators(Validators.maxLength(field[LENGTH_PROP]));
    }
    if (field[NAME_PROP] === 'BldMunicipality') {
      if (this.filterService.municipality) {
        control.setValue(this.filterService.municipality);
      }
      this.mapService.setMunicipality(this.filterService.municipality);
    }
    this.formGroup.addControl(fieldName, control);
  }

  ngOnDestroy(): void {
    this.onDestroy.next(true);
    this.onDestroy.complete();
  }

  getLogForField(variable: string): Log | undefined {
    return this.registerLogService.getLogForVariable('BUILDING', variable, this.existingBuildingDetails?.GlobalID);
  }

  hasLog(variable: string): boolean {
    return !!this.getLogForField(variable);
  }

  getError(control: AbstractControl) {
    if (control.errors?.['maxlength']) {
      return 'Value should not be longer than ' + control.errors?.['maxlength'].requiredLength;
    }
    return '';
  }
}
