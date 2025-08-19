import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {Subject, takeUntil} from 'rxjs';
import {
  FormObject,
  getFormObjectOptions,
  getFormObjectType,
  getValue,
} from '../../model/form-object';
import { CommonEntranceService } from '../../../common/service/common-entrance.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { Entrance } from '../../model/entrance';
import {
  ALIAS_PROP,
  DEFAULT_VALUE_PROP,
  DOMAIN_PROP,
  LENGTH_PROP,
  NAME_PROP,
  NULLABLE_PROP,
  TYPE_PROP,
} from '../../constant/common-constants';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RegisterLogService } from '../../register-log-view/register-log-table/register-log.service';
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
import { MatButtonModule } from '@angular/material/button';
import { CommonBuildingService } from '../../../common/service/common-building.service';
import { CommonStreetService } from '../../../common/service/common-street.service';
import { QueryFilter } from '../../model/query-filter';
import {
  AuthStateService,
  DEFAULT_MUNICIPALITY,
} from '../../../../common/services/auth-state.service';
import { ENTRANCE_ENTITY } from '../../../../common/constants/common-constants';
import { EntityAttribute } from '../../../common/service/common-entity-structure.service';

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
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    CommonStreetService,
    CommonBuildingService,
  ],
  templateUrl: './entrance-details-form.component.html',
  styleUrls: ['./entrance-details-form.component.css'],
})
export class EntranceDetailsFormComponent implements OnInit, OnDestroy {
  @Input() buildingId: string | undefined = undefined;
  @Input() formGroup!: FormGroup;
  @Input() existingEntrancesDetails?: Entrance[] = [];
  @Input() structure: EntityAttribute[] = [];

  private onDestroy = new Subject();
  private fields = [] as any[];
  private streets = [];
  private readonly entranceId: string | null;

  formStructure: FormObject[] = [];
  inputFilters: Record<string, string> = {};

  constructor(
    private entranceService: CommonEntranceService,
    private buildingService: CommonBuildingService,
    private streetService: CommonStreetService,
    private activatedRoute: ActivatedRoute,
    private authStateService: AuthStateService,
    private registerLogService: RegisterLogService
  ) {
    this.entranceId =
      this.activatedRoute.snapshot.queryParamMap.get('entranceId');
  }

  ngOnInit(): void {
    const role = this.authStateService.getRole();
    this.entranceService
      .getAttributesMetadata()
      .subscribe((fieldsResponse: any[]) => {
        this.fields = this.structure
          .map(structureEntry => {
            const metadataField = fieldsResponse.find(
              field => field[NAME_PROP] === structureEntry.name
            );
            if (metadataField) {
              metadataField[ALIAS_PROP] = structureEntry.label.en;
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
              // @ts-ignore
              ['write'].includes(structureEntry.display[role.toLowerCase()]) &&
              !['map', 'none'].includes(structureEntry.section)
            );
          });
        if (!this.formGroup) {
          this.formGroup = new FormGroup({});
        }
        // load municipality for building
        this.buildingService
          .getBuildingMunicipality(this.buildingId ?? '')
          .subscribe(({ data }: any) => {
            const municipality =
              data.features[0]?.attributes?.['BldMunicipality'] ??
              DEFAULT_MUNICIPALITY;
            this.loadStreets(municipality);
          });
      });
  }

  loadStreets(municipality: string) {
    const filter = {
      where: `StrMunicipality = ${municipality}`,
    } as Partial<QueryFilter>;
    this.streetService
      .getAllStreetsForMunicipality(filter)
      .subscribe((streets: any) => {
        this.streets = streets.data.features.map((street: any) => {
          return {
            text: street.attributes['StrNameCore'],
            value: street.attributes['GlobalID'],
          };
        });

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

  private createFormObject(field: any) {
    if (field[NAME_PROP] === 'EntStrGlobalID') {
      this.formStructure.push({
        name: (this.entranceId ?? '') + '_' + field[NAME_PROP],
        alias: field[ALIAS_PROP],
        type: 'select',
        selectOptions: this.streets,
        originalOptions: this.streets,
        maxLength: field[LENGTH_PROP],
      });
      return;
    }
    const fieldType = field[DOMAIN_PROP]
      ? 'select'
      : getFormObjectType(field[TYPE_PROP], field[LENGTH_PROP] ?? 0);
    const fieldOptions = getFormObjectOptions(fieldType, field[DOMAIN_PROP]);
    this.formStructure.push({
      name: (this.entranceId ?? '') + '_' + field[NAME_PROP],
      alias: field[ALIAS_PROP],
      type: fieldType,
      selectOptions: fieldOptions,
      originalOptions: fieldOptions,
      maxLength: field[LENGTH_PROP],
    });
  }

  private createFormControlForField(field: any) {
    const fieldName = field[NAME_PROP];
    const entrance = this.existingEntrancesDetails?.find(
      o => o.GlobalID === this.entranceId
    );
    const value = getValue(field, fieldName, entrance);
    const defaultValue = field[DEFAULT_VALUE_PROP] ?? '';

    const control = new FormControl(
      value || value === 0 ? value : defaultValue
    );
    if (!field[NULLABLE_PROP]) {
      control.addValidators(Validators.required);
    }
    if (field[LENGTH_PROP]) {
      control.addValidators(Validators.maxLength(field[LENGTH_PROP]));
    }
    this.formGroup.addControl(
      (this.entranceId ?? '') + '_' + field[NAME_PROP],
      control
    );
  }

  getLogForField(variable: string): Log | undefined {
    const variableName = variable.split('_')[1];
    return this.registerLogService.getLogForVariable(
      ENTRANCE_ENTITY,
      variableName,
      this.entranceId ?? undefined
    );
  }

  hasLog(variable: string): boolean {
    return !!this.getLogForField(variable);
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

  protected readonly getColor = getColor;
}
