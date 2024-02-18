import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { FormObject, getFormObjectType, getFormObjectOptions } from '../../model/form-object';
import { CommonEntranceService } from '../../service/common-entrance.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Entrance } from '../../model/entrance';

@Component({
  selector: 'asrdb-entrance-details-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './entrance-details-form.component.html',
  styleUrls: ['./entrance-details-form.component.css']
})
export class EntranceDetailsFormComponent implements OnInit, OnDestroy {

  @Input() formGroup!: FormGroup;
  @Input() existingEntrancesDetails?: Entrance[];
  private onDestroy = new Subject();

  formStructure: FormObject[] = [];

  constructor(private entranceService: CommonEntranceService) {
  }

  ngOnInit(): void {
    this.entranceService.getAttributesMetadata().subscribe((fields: never[]) => {
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
