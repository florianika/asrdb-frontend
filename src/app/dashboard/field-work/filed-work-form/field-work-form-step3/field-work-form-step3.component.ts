import { Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QualityManagementService } from '../../../quality-management/quality-management.service';
import { FieldWorkService, SelectedRule } from '../../field-work.service';
import {
  MatFormField,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';
import { MatOptgroup, MatOption, MatSelect } from '@angular/material/select';
import {
  BUILDING_ENTITY,
  DWELLING_ENTITY,
  ENTRANCE_ENTITY,
} from '../../../../common/constants/common-constants';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { ShortQualityRule } from '../../../quality-management/quality-management-config';
import { MatInput } from '@angular/material/input';
import { NgIf } from '@angular/common';
import { FieldWorkFormStep3StatisticTableComponent } from './field-work-form-step3-statistic-table/field-work-form-step3-statistic-table.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FieldWorkStatisticService } from '../../field-work-statistic.service';

@Component({
  selector: 'asrdb-field-work-form-step3',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatSelect,
    MatOption,
    MatOptgroup,
    MatIcon,
    MatIconButton,
    MatLabel,
    MatInput,
    MatSuffix,
    NgIf,
    FormsModule,
    MatButton,
    FieldWorkFormStep3StatisticTableComponent,
  ],
  providers: [QualityManagementService, FieldWorkStatisticService],
  templateUrl: './field-work-form-step3.component.html',
  styleUrl: './field-work-form-step3.component.css',
})
export class FieldWorkFormStep3Component {
  private _qualityManagementService = inject(QualityManagementService);
  private _fieldWorkService = inject(FieldWorkService);
  private _matSnackBar = inject(MatSnackBar);
  private _router = inject(Router);
  private _fieldWorkStatisticService = inject(FieldWorkStatisticService);
  private idRef: null | number = null;

  public selectControl = new FormControl('');

  public rulesToRender = [
    {
      entityType: BUILDING_ENTITY,
      label: $localize`Building rules`,
      rules: [] as ShortQualityRule[],
    },
    {
      entityType: ENTRANCE_ENTITY,
      label: $localize`Entrance rules`,
      rules: [] as ShortQualityRule[],
    },
    {
      entityType: DWELLING_ENTITY,
      label: $localize`Dwelling rules`,
      rules: [] as ShortQualityRule[],
    },
  ];

  public selectedRulesToRender = [
    {
      entityType: BUILDING_ENTITY,
      label: $localize`Selected building rules`,
      rules: [] as SelectedRule[],
    },
    {
      entityType: ENTRANCE_ENTITY,
      label: $localize`Selected entrance rules`,
      rules: [] as SelectedRule[],
    },
    {
      entityType: DWELLING_ENTITY,
      label: $localize`Selected dwelling rules`,
      rules: [] as SelectedRule[],
    },
  ];

  public activeRules = this._qualityManagementService.activeRules;
  public fieldWorkState = this._fieldWorkService.fieldWorkState;
  public selectedRules = this._fieldWorkService.selectedRules;
  public filterValue = signal('');
  public statistics = this._fieldWorkStatisticService.statistics;

  constructor() {
    this._qualityManagementService.getActiveRules();
    effect(
      () => {
        const id = this.fieldWorkState().activeFieldWork?.fieldWorkId;
        if (id && (this.idRef === null || this.idRef !== id)) {
          this.idRef = id;
          this._fieldWorkService.loadSelectedRules(id);
        }
        const rules = this.activeRules().rules;
        this.rulesToRender.forEach(group => {
          group.rules = rules.filter(
            rule =>
              rule.entityType === group.entityType &&
              this.notInSelectedRules(rule.id) &&
              (this.filterValue().length === 0 ||
                rule.nameEn
                  .toLowerCase()
                  .includes(this.filterValue().toLowerCase()))
          );
        });

        this.selectedRulesToRender.forEach(group => {
          group.rules = this.selectedRules().rules.filter(
            rule => rule.ruleEntityType === group.entityType
          );
        });
      },
      { allowSignalWrites: true }
    );
  }

  addRule(id: number) {
    if (!id) return;
    this._fieldWorkService.addRule(id);
    this.resetFilterValue();
    this.selectControl.setValue('');
    this.statistics.update(state => ({ ...state, statistics: [] }));
    this.showRegenerateStatisticsMessage();
  }

  removeRule(id: number) {
    this._fieldWorkService.removeRule(id);
    this.statistics.update(state => ({ ...state, statistics: [] }));
    this.showRegenerateStatisticsMessage();
  }

  notInSelectedRules(id: number): boolean {
    return !this.selectedRules().rules.some(rule => rule.ruleId === id);
  }

  resetFilterValue() {
    this.filterValue.set('');
  }

  public back() {
    this.fieldWorkState.update(state => ({
      ...state,
      currentStep: Math.max(state.currentStep - 1, 0),
    }));
  }

  public next() {
    if (this.selectedRules().rules.length === 0) {
      this._matSnackBar.open(
        $localize`Please select at least one rule`,
        $localize`Close`,
        { duration: 3000 }
      );
      return;
    }
    if (this.statistics().statistics.length === 0) {
      this._matSnackBar.open(
        $localize`Please generate statistics before proceeding`,
        $localize`Close`,
        { duration: 3000 }
      );
      return;
    }
    this.fieldWorkState.update(state => ({
      ...state,
      currentStep: Math.min(state.currentStep + 1, 3),
    }));
  }

  public handleClose() {
    void this._router.navigate(['/dashboard/field-work']);
  }

  private showRegenerateStatisticsMessage() {
    this._matSnackBar.open(
      $localize`You changed the selected rules, please generate statistics again`,
      $localize`Close`,
      { duration: 3000 }
    );
  }

  protected readonly BUILDING_ENTITY = BUILDING_ENTITY;
  protected readonly ENTRANCE_ENTITY = ENTRANCE_ENTITY;
  protected readonly DWELLING_ENTITY = DWELLING_ENTITY;
}
