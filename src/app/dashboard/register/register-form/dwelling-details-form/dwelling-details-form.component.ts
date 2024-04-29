import { Component, Inject, OnDestroy, TemplateRef, ViewChild, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable, Subject, catchError, of, takeUntil } from 'rxjs';
import { FormObject, getFormObjectType, getFormObjectOptions } from '../../model/form-object';
import { CommonDwellingService } from '../../../common/service/common-dwellings.service';
import { EDITABLE_PROP, ALIAS_PROP, DOMAIN_PROP, TYPE_PROP, LENGTH_PROP, NAME_PROP, DEFAULT_VALUE_PROP, NULLABLE_PROP } from '../../constant/common-constants';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Entrance } from '../../model/entrance';
import { Dwelling } from '../../model/dwelling';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { DwellingManagementService } from '../dwelling-creation.service';
import {MatIconModule} from "@angular/material/icon";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule} from "@angular/material/core";
import {MomentDateAdapter} from "@angular/material-moment-adapter";
import {MY_FORMATS} from "../../model/common-utils";
import {Log} from "../../register-log-view/model/log";
import {DWELLING_HIDDEN_FIELDS} from "../../../../common/data/hidden-fields";

@Component({
  selector: 'asrdb-dwelling-details-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [
    DwellingManagementService,
    {provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE]},
    {provide: MAT_DATE_FORMATS, useValue: MY_FORMATS},
  ],
  templateUrl: './dwelling-details-form.component.html',
  styleUrls: ['./dwelling-details-form.component.css']
})
export class DwellingDetailsFormComponent implements OnDestroy {
  private onDestroy = new Subject();
  private initialized = false;
  private dwelling?: Dwelling;
  private logs: Log[] = [];

  @ViewChild('cancelConfirmDialog') cancelConfirmDialog?: TemplateRef<any>;

  formGroup: FormGroup<any> = new FormGroup({});
  formStructure: FormObject[] = [];
  id?: string;
  entrances: Entrance[] = [];
  entranceId = '';
  isSaving: Observable<boolean>;
  isLoadingResults = false;

  constructor(
    private dwellingService: CommonDwellingService,
    @Inject(MAT_DIALOG_DATA) public data: { id?: string, entrances: Entrance[], logs: Log[], entranceId: string },
    public dialogRef: MatDialogRef<DwellingDetailsFormComponent>,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private dwellingCreationService: DwellingManagementService
  ) {
    this.loadDwellingById(data.id);

    this.entranceId = data.entranceId;
    this.entrances = this.data.entrances;
    this.logs = this.data.logs;
    this.isSaving = this.dwellingCreationService.isSavingObservable;
    this.isSaving.pipe(takeUntil(this.onDestroy)).subscribe(saving => {
      if (!saving && this.initialized) {
        this.dialogRef.close();
      } else if (!this.initialized) {
        this.initialized = true;
      }
    });

    if (!data.id) {
      DWELLING_HIDDEN_FIELDS.push('DwlEntranceID');
    }
  }

  private initForm() {
    this.isLoadingResults = true;
    this.dwellingService.getAttributesMetadata().subscribe((fields: never[]) => {
      fields = fields.filter(field => {
        console.log(field[NAME_PROP], `Editable: ${field[EDITABLE_PROP]} | Show: ${!DWELLING_HIDDEN_FIELDS.includes(field[NAME_PROP])}`);
        return field[EDITABLE_PROP] && !DWELLING_HIDDEN_FIELDS.includes(field[NAME_PROP]);
      });
      fields.forEach(field => {
        this.createFormControlForField(field);
        this.createFormObject(field);
      });

      this.isLoadingResults = false;
    });
  }

  private loadDwellingById(id?: string) {
    this.id = id;
    if (id) {
      this.isLoadingResults = true;
      this.dwellingService.getDwellings({
        where: `GlobalID = '${id}'`,
        start: 0,
        num: 1
      }).pipe(takeUntil(this.onDestroy), catchError((err) => {
        console.log(err);
        return of(null);
      })).subscribe((res) => {
        if (isDevMode()) {
          console.log('Dwellings: ', res);
        }
        if (!res) {
          this.matSnackBar.open('Could not load result. Please try again');
          this.isLoadingResults = false;
          return;
        }
        this.dwelling = res.data.features.map((feature: any) => feature.attributes)[0];
        this.initForm();
        this.isLoadingResults = false;
      });
    } else {
      this.initForm();
    }
  }

  private createFormObject(field: never) {
    const isEntranceFK = field[NAME_PROP] === 'DwlEntranceID';
    const isSelect = field[DOMAIN_PROP] || isEntranceFK;
    const fieldType = isSelect ? 'select' : getFormObjectType(field[TYPE_PROP], field[LENGTH_PROP] ?? 0);
    const fieldOptions = isEntranceFK ? this.getOptionsForEntrance() : getFormObjectOptions(fieldType, field[DOMAIN_PROP]);
    this.formStructure.push({
      name: field[NAME_PROP],
      alias: field[ALIAS_PROP],
      type: fieldType,
      selectOptions: fieldOptions,
      maxLength: field[LENGTH_PROP]
    });
  }

  private createFormControlForField(field: never) {
    const fieldName = field[NAME_PROP];
    const value: string | number | undefined = this.dwelling?.[fieldName];
    const defaultValue = fieldName === 'DwlEntranceID' ? undefined: (field[DEFAULT_VALUE_PROP] ?? '');
    const control = new FormControl(value || value === 0 ? value : defaultValue);
    if (!field[NULLABLE_PROP]) {
      control.addValidators(Validators.required);
    }
    if (field[LENGTH_PROP]) {
      control.addValidators(Validators.maxLength(field[LENGTH_PROP]));
    }
    this.formGroup.addControl(fieldName, control);
  }

  private getOptionsForEntrance() {
    return this.entrances.map(entrance => ({
      text: entrance.GlobalID,
      value: entrance.GlobalID
    }));
  }

  ngOnDestroy(): void {
    this.onDestroy.next(true);
    this.onDestroy.complete();
  }

  cancel() {
    if (!this.cancelConfirmDialog) {
      return this.closeDialog();
    }
    this.matDialog.open(this.cancelConfirmDialog).afterClosed().subscribe(confirm => {
      if (confirm) {
        setTimeout(() => {
          this.matSnackBar.open('Dialog was closed and all changes were discarded', 'Ok', {
            duration: 3000
          });
          this.dialogRef.close();
        }, 200);
      }
    });
  }

  private closeDialog() {
    this.matSnackBar.open('Dialog was closed and all changes were discarded', 'Ok', {
      duration: 3000
    });
    this.dialogRef.close();
    return;
  }

  save() {
    if (this.formGroup.invalid || (!this.id && !this.entranceId)) {
      this.matSnackBar.open('Data cannot be saved. Please check the form for invalid data.', 'Ok', {
        duration: 3000
      });
      this.formGroup.markAllAsTouched();
      return;
    }
    const dwelling = this.formGroup.value as Dwelling;
    if (this.dwelling) {
      dwelling.GlobalID = this.dwelling.GlobalID;
      dwelling.OBJECTID = this.dwelling.OBJECTID;
    } else {
      dwelling.DwlEntranceID = this.entranceId;
    }
    this.dwellingCreationService.saveDwelling(dwelling);
  }

  getLogForField(variable: string): string {
    return this.logs.find(log => log.variable === variable)?.qualityMessageEn
      ?? '';
  }

  getError(control: AbstractControl) {
    if (control.errors?.['maxlength']) {
      return 'Value should not be longer than ' + control.errors?.['maxlength'].requiredLength;
    }
    return '';
  }
}
