import {
  Component,
  Inject,
  isDevMode,
  LOCALE_ID,
  OnDestroy,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, Observable, of, Subject, takeUntil } from 'rxjs';
import {
  FormObject,
  getFormObjectOptions,
  getFormObjectType,
  getValue,
} from '../../model/form-object';
import { CommonDwellingService } from '../../../common/service/common-dwellings.service';
import {
  ALIAS_PROP,
  DEFAULT_VALUE_PROP,
  DOMAIN_PROP,
  LENGTH_PROP,
  NAME_PROP,
  NULLABLE_PROP,
  TYPE_PROP,
} from '../../constant/common-constants';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Entrance } from '../../model/entrance';
import { Dwelling } from '../../model/dwelling';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { DwellingManagementService } from '../dwelling-creation.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { getColor, MY_FORMATS } from '../../model/common-utils';
import { Log } from '../../register-log-view/model/log';
import { STREET_HIDDEN_FIELDS } from '../../../../common/data/hidden-fields';
import { DWELLING_ENTITY } from '../../../../common/constants/common-constants';
import {
  CommonEntityStructureService,
  EntityAttribute,
} from '../../../common/service/common-entity-structure.service';
import { AuthStateService } from '../../../../common/services/auth-state.service';
import { getLocaleProperty } from '../../../common/helper/locale-property-helper';

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
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  templateUrl: './dwelling-details-form.component.html',
  styleUrls: ['./dwelling-details-form.component.css'],
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
  inputFilters: Record<string, string> = {};
  structure: EntityAttribute[] = [];

  constructor(
    private dwellingService: CommonDwellingService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      id?: string;
      entrances: Entrance[];
      logs: Log[];
      entranceId: string;
    },
    public dialogRef: MatDialogRef<DwellingDetailsFormComponent>,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private dwellingCreationService: DwellingManagementService,
    private commonStructureService: CommonEntityStructureService,
    private authStateService: AuthStateService,
    @Inject(LOCALE_ID) private locale: string
  ) {
    this.commonStructureService.getEntityStructure(DWELLING_ENTITY);
    this.commonStructureService.structureLoaded.subscribe(response => {
      if (!response.loading && response.structure) {
        this.structure = response.structure;
        if (data.id) {
          this.loadDwellingById(data.id);
        } else {
          this.initForm();
        }
      }
    });

    this.entranceId = data.entranceId;
    this.entrances = this.data.entrances;
    this.logs = this.data.logs;
    this.isSaving = this.dwellingCreationService.isSavingObservable;
    this.isSaving.pipe(takeUntil(this.onDestroy)).subscribe(saving => {
      if (!saving && this.initialized) {
        this.dialogRef.close($localize`saved`);
      } else if (!this.initialized) {
        this.initialized = true;
      }
    });

    if (!data.id) {
      STREET_HIDDEN_FIELDS.push('DwlEntGlobalID');
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
    const role = this.authStateService.getRole();
    this.dwellingService
      .getAttributesMetadata()
      .subscribe((fieldsResponse: any[]) => {
        const fields = this.structure
          .map(structureEntry => {
            const metadataField = fieldsResponse.find(
              field => field[NAME_PROP] === structureEntry.name
            );
            if (metadataField) {
              metadataField[ALIAS_PROP] = getLocaleProperty(
                structureEntry.label,
                this.locale as 'en' | 'sq'
              );
            }
            return metadataField;
          })
          .filter(field => {
            if (!field) {
              return false;
            }
            const structureEntry = this.structure.find(
              entry => entry.name === field[NAME_PROP]
            );
            return (
              !!structureEntry &&
              !structureEntry.internal &&
              role &&
              role.toLowerCase() in structureEntry.display &&
              ['write'].includes(
                (structureEntry.display as any)[role.toLowerCase()]
              ) &&
              !['map', 'none'].includes(structureEntry.section)
            );
          });

        if (!this.formGroup) {
          this.formGroup = new FormGroup({});
        }
        this.formStructure = [];

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
      this.dwellingService
        .getDwellings({
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
            console.log('Dwellings: ', res);
          }
          if (!res) {
            this.matSnackBar.open(
              $localize`Could not load result. Please try again`,
              $localize`Ok`
            );
            this.isLoadingResults = false;
            return;
          }
          this.dwelling = res.data.features.map(
            (feature: any) => feature.attributes
          )[0];
          this.initForm();
          this.isLoadingResults = false;
        });
    } else {
      this.initForm();
    }
  }

  private createFormObject(field: any) {
    const isEntranceFK = field[NAME_PROP] === 'DwlEntGlobalID';
    const isSelect = field[DOMAIN_PROP] || isEntranceFK;
    const fieldType = isSelect
      ? 'select'
      : getFormObjectType(field[TYPE_PROP], field[LENGTH_PROP] ?? 0);
    const fieldOptions = isEntranceFK
      ? this.getOptionsForEntrance()
      : getFormObjectOptions(fieldType, field[DOMAIN_PROP]);
    this.formStructure.push({
      name: field[NAME_PROP],
      alias: field[ALIAS_PROP],
      type: fieldType,
      selectOptions: fieldOptions,
      originalOptions: fieldOptions,
      maxLength: field[LENGTH_PROP],
    });
  }

  private createFormControlForField(field: any) {
    const fieldName = field[NAME_PROP];
    const value = getValue(field, fieldName, this.dwelling);
    const defaultValue =
      fieldName === 'DwlEntGlobalID'
        ? undefined
        : (field[DEFAULT_VALUE_PROP] ?? '');
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

  private getOptionsForEntrance() {
    return this.entrances.map(entrance => ({
      text: entrance.GlobalID,
      value: entrance.GlobalID,
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
    if (this.formGroup.invalid || (!this.id && !this.entranceId)) {
      this.matSnackBar.open(
        $localize`Data cannot be saved. Please check the form for invalid data.`,
        $localize`Ok`,
        { duration: 3000 }
      );
      this.formGroup.markAllAsTouched();
      return;
    }
    const dwelling = this.formGroup.value as Dwelling;
    if (this.dwelling) {
      dwelling.GlobalID = this.dwelling.GlobalID;
      dwelling.OBJECTID = this.dwelling.OBJECTID;
    } else {
      dwelling.DwlEntGlobalID = this.entranceId;
    }
    this.dwellingCreationService.saveDwelling(dwelling);
  }

  getLogForField(variable: string): Log | undefined {
    const cleanedId = this.dwelling?.GlobalID.replace('{', '')
      .replace('}', '')
      .toLowerCase();
    return this.logs.find(
      log =>
        log.variable === variable &&
        log.entityType === DWELLING_ENTITY &&
        log.dwlId === cleanedId
    );
  }

  hasLog(variable: string): boolean {
    return !!this.getLogForField(variable);
  }

  getError(control: AbstractControl) {
    if (control.errors?.['maxlength']) {
      return $localize`Value should not be longer than ${control.errors?.['maxlength'].requiredLength}`;
    }
    return '';
  }

  protected readonly getColor = getColor;
}
