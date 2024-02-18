import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
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
export class EntranceDetailsFormComponent implements OnInit, OnDestroy, OnChanges {

  @Input() formGroup!: FormGroup;
  @Input() ids!: string[];
  @Input() existingEntrancesDetails?: Entrance[];
  private onDestroy = new Subject();
  private fields = [];

  formStructure: FormObject[] = [];

  constructor(private entranceService: CommonEntranceService) {
  }

  ngOnInit(): void {
    this.entranceService.getAttributesMetadata().subscribe((fields: never[]) => {
      this.fields = fields.filter(field => field['editable'] && !['last_edited_user', 'last_edited_date', 'fk_buildings', 'created_user', 'created_date'].includes(field['name']));
      if (!this.formGroup) {
        this.formGroup = new FormGroup({});
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const idsChanges = changes['ids'];
    const currentValue = idsChanges.currentValue as string[];
    const previousValue = idsChanges.previousValue as string[];
    if (idsChanges) {
      const idsToAdd = currentValue.filter(id => !previousValue.includes(id));
      const idsToRemove = previousValue.filter(id => !currentValue.includes(id));

      idsToAdd.forEach(id => {
        this.fields.forEach(field => {
          this.createFormControlForField(field, id);
          this.createFormObject(field, id);
        });
      });

      idsToRemove.forEach(id => {
        this.removeFormControlFields(id);
        this.removeFormObjects(id);
      });
    }
  }

  ngOnDestroy(): void {
    this.onDestroy.next(true);
    this.onDestroy.complete();
  }

  private createFormObject(field: never, id: string) {
    const fieldType = field['domain'] ? 'select' : getFormObjectType(field['type'], field['length'] ?? 0);
    const fieldOptions = getFormObjectOptions(fieldType, field['domain']);
    this.formStructure.push({
      name: id + '_' + field['name'],
      alias: field['alias'],
      type: field['domain'] ? 'select' : getFormObjectType(field['type'], field['length'] ?? 0),
      selectOptions: fieldOptions
    });
  }

  private createFormControlForField(field: never, id: string) {
    const fieldName = field['name'];
    const value = (this.existingEntrancesDetails?.filter(o => o.GlobalID === id) as any)?.[fieldName];
    const defaultValue = field['defaultValue'] ?? '';

    const control = new FormControl(value ? value : defaultValue);
    if (!field['nullable']) {
      control.addValidators(Validators.required);
    }
    if (field['length']) {
      control.addValidators(Validators.maxLength(field['length']));
    }
    this.formGroup.addControl(id + '_' + field['name'], control);
  }

  private removeFormControlFields(id: string) {
    this.fields.forEach(field => {
      this.formGroup.removeControl(id + '_' + field['name']);
    });
  }

  private removeFormObjects(id: string) {
    this.formStructure = this.formStructure.filter(formObject => !formObject.name.includes(id));
  }
}
