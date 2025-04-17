import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl} from '@angular/forms';
import { Subject } from 'rxjs';
import {FormObject, getFormObjectType, getFormObjectOptions, getValue} from '../../model/form-object';
import { CommonEntranceService } from '../../../common/service/common-entrance.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { Entrance } from '../../model/entrance';
import { NAME_PROP, DOMAIN_PROP, TYPE_PROP, LENGTH_PROP, ALIAS_PROP, NULLABLE_PROP, DEFAULT_VALUE_PROP } from '../../constant/common-constants';
import {ActivatedRoute} from "@angular/router";
import {MatIconModule} from "@angular/material/icon";
import {RegisterLogService} from "../../register-log-view/register-log-table/register-log.service";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule} from "@angular/material/core";
import {MomentDateAdapter} from "@angular/material-moment-adapter";
import {getColor, MY_FORMATS} from "../../model/common-utils";
import {ENTRANCE_HIDDEN_FIELDS} from "../../../../common/data/hidden-fields";
import {Log} from "../../register-log-view/model/log";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'asrdb-entrance-details-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
  ],
  providers: [
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
  templateUrl: './entrance-details-form.component.html',
  styleUrls: ['./entrance-details-form.component.css']
})
export class EntranceDetailsFormComponent implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup;
  @Input() existingEntrancesDetails?: Entrance[] = [];
  private onDestroy = new Subject();
  private fields = [];
  private readonly entranceId: string | null;

  formStructure: FormObject[] = [];
  inputFilters: Record<string, string> = {};

  constructor(
    private entranceService: CommonEntranceService,
    private activatedRoute: ActivatedRoute,
    private registerLogService: RegisterLogService) {
    this.entranceId = this.activatedRoute.snapshot.queryParamMap.get('entranceId');
  }

  ngOnInit(): void {
    this.entranceService.getAttributesMetadata().subscribe((fields: never[]) => {
      this.fields = fields.filter(field => field['editable'] && !ENTRANCE_HIDDEN_FIELDS.includes(field[NAME_PROP]));
      if (!this.formGroup) {
        this.formGroup = new FormGroup({});
      }
      this.fields.forEach(field => {
        this.createFormControlForField(field);
        this.createFormObject(field);
      });
    });
  }

  ngOnDestroy(): void {
    this.onDestroy.next(true);
    this.onDestroy.complete();
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
      name: (this.entranceId ?? '') + '_' + field[NAME_PROP],
      alias: field[ALIAS_PROP],
      type: fieldType,
      selectOptions: fieldOptions,
      originalOptions: fieldOptions,
      maxLength: field[LENGTH_PROP]
    });
  }

  private createFormControlForField(field: never) {
    const fieldName = field[NAME_PROP];
    const entrance = this.existingEntrancesDetails?.find(o => o.GlobalID === this.entranceId);
    const value = getValue(field, fieldName, entrance);
    const defaultValue = field[DEFAULT_VALUE_PROP] ?? '';

    const control = new FormControl(value || value === 0 ? value : defaultValue);
    if (!field[NULLABLE_PROP]) {
      control.addValidators(Validators.required);
    }
    if (field[LENGTH_PROP]) {
      control.addValidators(Validators.maxLength(field[LENGTH_PROP]));
    }
    this.formGroup.addControl((this.entranceId ?? '') + '_' + field[NAME_PROP], control);
  }

  getLogForField(variable: string): Log | undefined {
    const variableName = variable.split('_')[1];
    return this.registerLogService.getLogForVariable('ENTRANCE', variableName, this.entranceId ?? undefined);
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

  protected readonly getColor = getColor;
}
