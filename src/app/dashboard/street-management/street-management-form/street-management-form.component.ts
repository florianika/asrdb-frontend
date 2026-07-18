import {
  Component,
  Inject,
  isDevMode,
  OnDestroy,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { catchError, Observable, of, Subject, takeUntil } from 'rxjs';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  FormObject,
  FormObjectSelectOption,
  getFormObjectOptions,
  getFormObjectType,
  getValue,
} from '../../register/model/form-object';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { STREET_HIDDEN_FIELDS } from '../../../common/data/hidden-fields';
import {
  ALIAS_PROP,
  DEFAULT_VALUE_PROP,
  DOMAIN_PROP,
  EDITABLE_PROP,
  LENGTH_PROP,
  NAME_PROP,
  NULLABLE_PROP,
  TYPE_PROP,
} from '../../register/constant/common-constants';
import { StreetManagementService } from '../../register/register-form/street-creation.service';
import { CommonStreetService } from '../../common/service/common-street.service';
import { Street } from '../../register/model/street';
import {
  EsriDomain,
  EsriQueryResponse,
} from '../../register/model/esri-response';
import { arcGisGlobalIdEquals } from '../../common/helper/arcgis-query';

type StreetField = Record<string, unknown>;

@Component({
  selector: 'asrdb-street-management-form',
  templateUrl: './street-management-form.component.html',
  styleUrls: ['./street-management-form.component.css'],
  standalone: false,
})
export class StreetManagementFormComponent implements OnDestroy {
  private onDestroy = new Subject<void>();
  private initialized = false;
  private street?: Street;

  @ViewChild('cancelConfirmDialog')
  cancelConfirmDialog?: TemplateRef<unknown>;

  formGroup: FormGroup = new FormGroup({});
  formStructure: FormObject[] = [];
  id?: string;
  municipality: string;
  isSaving: Observable<boolean>;
  isLoadingResults = false;
  inputFilters: Record<string, string> = {};

  constructor(
    private streetService: CommonStreetService,
    @Inject(MAT_DIALOG_DATA)
    public data: { id?: string; municipality?: string },
    public dialogRef: MatDialogRef<StreetManagementFormComponent>,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private streetManagementService: StreetManagementService
  ) {
    this.municipality = data.municipality || '';
    this.id = data.id;

    this.loadStreetById(data.id);
    this.isSaving = this.streetManagementService.isSavingObservable;
    this.isSaving.pipe(takeUntil(this.onDestroy)).subscribe(saving => {
      if (!saving && this.initialized) {
        this.dialogRef.close();
      } else if (!this.initialized) {
        this.initialized = true;
      }
    });
  }

  filterInputOptions($event: Event, name: string) {
    const value = ($event.target as HTMLInputElement | null)?.value ?? '';
    this.inputFilters[name] = value;
    this.formStructure.forEach((field: FormObject) => {
      if (
        field.name === name &&
        field.type === 'select' &&
        field.originalOptions
      ) {
        field.selectOptions = field.originalOptions.filter(option =>
          option.text.toLowerCase().includes(value.toLowerCase())
        );
      }
    });
  }

  clearInputFilter($event: Event, name: string) {
    $event.stopPropagation();
    $event.preventDefault();
    this.inputFilters[name] = '';
    this.formStructure.forEach((field: FormObject) => {
      if (
        field.name === name &&
        field.type === 'select' &&
        field.originalOptions
      ) {
        field.selectOptions = field.originalOptions;
      }
    });
  }

  private initForm() {
    this.isLoadingResults = true;
    this.streetService
      .getAttributesMetadata()
      .subscribe((fields: unknown[]) => {
        fields = fields.filter(field => {
          const fieldRecord = field as StreetField;
          console.log(
            fieldRecord[NAME_PROP],
            `Editable: ${fieldRecord[EDITABLE_PROP]} | Show: ${!STREET_HIDDEN_FIELDS.includes(String(fieldRecord[NAME_PROP]))}`
          );
          return (
            Boolean(fieldRecord[EDITABLE_PROP]) &&
            !STREET_HIDDEN_FIELDS.includes(String(fieldRecord[NAME_PROP]))
          );
        });
        fields.forEach(field => {
          const typedField = field as StreetField;
          this.createFormControlForField(typedField);
          this.createFormObject(typedField);
        });

        this.isLoadingResults = false;
      });
  }

  private loadStreetById(id?: string) {
    this.id = id;
    if (id) {
      this.isLoadingResults = true;
      this.streetService
        .getStreets({
          where: arcGisGlobalIdEquals('GlobalID', id),
          start: 0,
          num: 1,
        })
        .pipe(
          takeUntil(this.onDestroy),
          catchError(err => {
            console.log(err);
            return of(null);
          })
        )
        .subscribe((res: EsriQueryResponse<Street> | null) => {
          if (isDevMode()) {
            console.log('Street: ', res);
          }
          if (!res) {
            this.matSnackBar.open(
              $localize`Could not load result. Please try again`,
              $localize`Ok`,
              { duration: 3000 }
            );
            this.isLoadingResults = false;
            return;
          }
          this.street = res.data.features[0]?.attributes;
          this.initForm();
          this.isLoadingResults = false;
        });
    } else {
      this.initForm();
    }
  }

  private createFormObject(field: StreetField) {
    const isSelect = field[DOMAIN_PROP];
    const fieldType = isSelect
      ? 'select'
      : getFormObjectType(
          String(field[TYPE_PROP]),
          Number(field[LENGTH_PROP] ?? 0)
        );
    const fieldOptions = getFormObjectOptions(
      fieldType,
      (field[DOMAIN_PROP] as EsriDomain | undefined) ?? undefined
    );
    this.formStructure.push({
      name: String(field[NAME_PROP]),
      alias: String(field[ALIAS_PROP]),
      type: fieldType,
      selectOptions: fieldOptions as FormObjectSelectOption[] | null,
      originalOptions: fieldOptions as FormObjectSelectOption[] | null,
      maxLength: Number(field[LENGTH_PROP] ?? 0) || undefined,
    });
  }

  private createFormControlForField(field: StreetField) {
    const fieldName = String(field[NAME_PROP]);
    const value = getValue(field, fieldName, this.street);
    const defaultValue =
      fieldName === 'GlobalID' ? undefined : (field[DEFAULT_VALUE_PROP] ?? '');
    const control = new FormControl(
      value || value === 0 ? value : defaultValue
    );
    if (!field[NULLABLE_PROP]) {
      control.addValidators(Validators.required);
    }
    const maxLength = Number(field[LENGTH_PROP] ?? 0);
    if (maxLength) {
      control.addValidators(Validators.maxLength(maxLength));
    }
    this.formGroup.addControl(fieldName, control);
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  cancel() {
    if (!this.cancelConfirmDialog) {
      return this.closeDialog();
    }
    this.matDialog
      .open(this.cancelConfirmDialog)
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          setTimeout(() => {
            this.matSnackBar.open(
              $localize`Dialog was closed and all changes were discarded`,
              $localize`Ok`,
              { duration: 3000 }
            );
            this.dialogRef.close();
          }, 200);
        }
      });
  }

  private closeDialog() {
    this.matSnackBar.open(
      $localize`Dialog was closed and all changes were discarded`,
      $localize`Ok`,
      { duration: 3000 }
    );
    this.dialogRef.close();
    return;
  }

  save() {
    if (this.formGroup.invalid) {
      this.matSnackBar.open(
        $localize`Data cannot be saved. Please check the form for invalid data.`,
        $localize`Ok`,
        { duration: 3000 }
      );
      this.formGroup.markAllAsTouched();
      return;
    }
    const street = this.formGroup.value as Street;
    if (this.street) {
      street.GlobalID = this.street.GlobalID;
      street.OBJECTID = this.street.OBJECTID;
    }
    this.streetManagementService.saveStreet(street);
  }

  getError(control: AbstractControl) {
    if (control.errors?.['maxlength']) {
      return (
        $localize`Value should not be longer than ` +
        control.errors?.['maxlength'].requiredLength
      );
    }
    return '';
  }
}
