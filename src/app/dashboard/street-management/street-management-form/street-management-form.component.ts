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

@Component({
  selector: 'asrdb-street-management-form',
  templateUrl: './street-management-form.component.html',
  styleUrls: ['./street-management-form.component.css'],
})
export class StreetManagementFormComponent implements OnDestroy {
  private onDestroy = new Subject();
  private initialized = false;
  private street?: Street;

  @ViewChild('cancelConfirmDialog') cancelConfirmDialog?: TemplateRef<any>;

  formGroup: FormGroup<any> = new FormGroup({});
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

    if (!data.id) {
      STREET_HIDDEN_FIELDS.push('GlobalID');
    }
  }

  filterInputOptions($event: any, name: string) {
    const value = $event.target.value;
    this.inputFilters[name] = value;
    this.formStructure.forEach((field: FormObject) => {
      if (
        field.name === name &&
        field.type === 'select' &&
        field.originalOptions
      ) {
        field.selectOptions = field.originalOptions.filter((option: any) =>
          option.text.toLowerCase().includes(value.toLowerCase())
        );
      }
    });
  }

  clearInputFilter($event: any, name: string) {
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
    this.streetService.getAttributesMetadata().subscribe((fields: never[]) => {
      fields = fields.filter(field => {
        console.log(
          field[NAME_PROP],
          `Editable: ${field[EDITABLE_PROP]} | Show: ${!STREET_HIDDEN_FIELDS.includes(field[NAME_PROP])}`
        );
        return (
          field[EDITABLE_PROP] &&
          !STREET_HIDDEN_FIELDS.includes(field[NAME_PROP])
        );
      });
      fields.forEach(field => {
        this.createFormControlForField(field);
        this.createFormObject(field);
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
          where: `GlobalID = '${id}'`,
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
        .subscribe(res => {
          if (isDevMode()) {
            console.log('Street: ', res);
          }
          if (!res) {
            this.matSnackBar.open('Could not load result. Please try again');
            this.isLoadingResults = false;
            return;
          }
          this.street = res.data.features.map(
            (feature: any) => feature.attributes
          )[0];
          this.initForm();
          this.isLoadingResults = false;
        });
    } else {
      this.initForm();
    }
  }

  private createFormObject(field: never) {
    const isSelect = field[DOMAIN_PROP];
    const fieldType = isSelect
      ? 'select'
      : getFormObjectType(field[TYPE_PROP], field[LENGTH_PROP] ?? 0);
    const fieldOptions = getFormObjectOptions(fieldType, field[DOMAIN_PROP]);
    this.formStructure.push({
      name: field[NAME_PROP],
      alias: field[ALIAS_PROP],
      type: fieldType,
      selectOptions: fieldOptions,
      originalOptions: fieldOptions,
      maxLength: field[LENGTH_PROP],
    });
  }

  private createFormControlForField(field: never) {
    const fieldName = field[NAME_PROP];
    const value = getValue(field, fieldName, this.street);
    const defaultValue =
      fieldName === 'GlobalID' ? undefined : (field[DEFAULT_VALUE_PROP] ?? '');
    const control = new FormControl(
      value || value === 0 ? value : defaultValue
    );
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
              'Dialog was closed and all changes were discarded',
              'Ok',
              {
                duration: 3000,
              }
            );
            this.dialogRef.close();
          }, 200);
        }
      });
  }

  private closeDialog() {
    this.matSnackBar.open(
      'Dialog was closed and all changes were discarded',
      'Ok',
      {
        duration: 3000,
      }
    );
    this.dialogRef.close();
    return;
  }

  save() {
    if (this.formGroup.invalid) {
      this.matSnackBar.open(
        'Data cannot be saved. Please check the form for invalid data.',
        'Ok',
        {
          duration: 3000,
        }
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
        'Value should not be longer than ' +
        control.errors?.['maxlength'].requiredLength
      );
    }
    return '';
  }
}
