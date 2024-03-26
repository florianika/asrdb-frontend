import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { FormObject, getFormObjectType, getFormObjectOptions } from '../../model/form-object';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { Entrance } from '../../model/entrance';
import { NAME_PROP, DOMAIN_PROP, TYPE_PROP, LENGTH_PROP, ALIAS_PROP, NULLABLE_PROP, DEFAULT_VALUE_PROP } from '../../constant/common-constants';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'asrdb-entrance-details-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule
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

  private readonly HIDDEN_FIELDS = [
    'last_edited_user',
    'last_edited_date',
    'fk_buildings',
    'created_user',
    'created_date',
    'EntLongitude',
    'EntLatitude',
    'external_creator',
    'external_editor',
    'external_creation_date',
    'external_edited_date',
    'EntQuality'
  ];

  constructor(private entranceService: CommonEntranceService, private activatedRoute: ActivatedRoute) {
    this.entranceId = this.activatedRoute.snapshot.queryParamMap.get('entranceId');
  }

  ngOnInit(): void {
    this.entranceService.getAttributesMetadata().subscribe((fields: never[]) => {
      this.fields = fields.filter(field => field['editable'] && !this.HIDDEN_FIELDS.includes(field[NAME_PROP]));
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

  private createFormObject(field: never) {
    const fieldType = field[DOMAIN_PROP] ? 'select' : getFormObjectType(field[TYPE_PROP], field[LENGTH_PROP] ?? 0);
    const fieldOptions = getFormObjectOptions(fieldType, field[DOMAIN_PROP]);
    this.formStructure.push({
      name: (this.entranceId ?? '') + '_' + field[NAME_PROP],
      alias: field[ALIAS_PROP],
      type: fieldType,
      selectOptions: fieldOptions
    });
  }

  private createFormControlForField(field: never) {
    const fieldName = field[NAME_PROP];
    const entrance = this.existingEntrancesDetails?.find(o => o.GlobalID === this.entranceId);
    const value = (entrance as any)?.[fieldName];
    const defaultValue = field[DEFAULT_VALUE_PROP] ?? '';

    const control = new FormControl(value ? value : defaultValue);
    if (!field[NULLABLE_PROP]) {
      control.addValidators(Validators.required);
    }
    if (field[LENGTH_PROP]) {
      control.addValidators(Validators.maxLength(field[LENGTH_PROP]));
    }
    this.formGroup.addControl((this.entranceId ?? '') + '_' + field[NAME_PROP], control);
  }
}
