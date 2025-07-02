import {Component, effect, inject, signal} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {QualityManagementService} from "../../../quality-management/quality-management.service";
import {FieldWorkService, SelectedRule} from "../../field-work.service";
import {MatFormField, MatLabel, MatSuffix} from "@angular/material/form-field";
import {MatOptgroup, MatOption, MatSelect} from "@angular/material/select";
import {BUILDING_ENTITY, DWELLING_ENTITY, ENTRANCE_ENTITY} from "../../../../common/constants/common-constants";
import {AuthStateService} from "../../../../common/services/auth-state.service";
import {MatIcon} from "@angular/material/icon";
import {MatButton, MatIconButton} from "@angular/material/button";
import {ShortQualityRule} from "../../../quality-management/quality-management-config";
import {MatInput} from "@angular/material/input";
import {NgIf} from "@angular/common";
import {
  FieldWorkFormStep3StatisticTableComponent
} from "./field-work-form-step3-statistic-table/field-work-form-step3-statistic-table.component";
import {MatSnackBar} from "@angular/material/snack-bar";

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
    FieldWorkFormStep3StatisticTableComponent
  ],
  providers: [
    QualityManagementService
  ],
  templateUrl: './field-work-form-step3.component.html',
  styleUrl: './field-work-form-step3.component.css'
})
export class FieldWorkFormStep3Component {

  private _qualityManagementService = inject(QualityManagementService);
  private _fieldWorkService = inject(FieldWorkService);
  private _authStateService = inject(AuthStateService);
  private _matSnackBar = inject(MatSnackBar);
  private idRef: null | number = null;

  public selectControl = new FormControl('');

  public rulesToRender = [
    { entityType: BUILDING_ENTITY, label: 'Building rules', rules: [] as ShortQualityRule[] },
    { entityType: ENTRANCE_ENTITY, label: 'Entrance rules', rules: [] as ShortQualityRule[] },
    { entityType: DWELLING_ENTITY, label: 'Dwelling rules', rules: [] as ShortQualityRule[] }
  ];
  public selectedRulesToRender = [
    { entityType: BUILDING_ENTITY, label: 'Selected building rules', rules: [] as SelectedRule[] },
    { entityType: ENTRANCE_ENTITY, label: 'Selected entrance rules', rules: [] as SelectedRule[] },
    { entityType: DWELLING_ENTITY, label: 'Selected dwelling rules', rules: [] as SelectedRule[] }
  ];

  public activeRules = this._qualityManagementService.activeRules;
  public fieldWorkState = this._fieldWorkService.fieldWorkState;
  public selectedRules = this._fieldWorkService.selectedRules;
  public filterValue = signal('');

  constructor() {
    this._qualityManagementService.getActiveRules();
    effect(() => {
      const id = this.fieldWorkState().activeFieldWork?.fieldWorkId;
      if (id && (this.idRef === null || this.idRef !== id)) {
        this.idRef = id;
        this._fieldWorkService.loadSelectedRules(id);
      }
      const rules = this.activeRules().rules;
      this.rulesToRender.forEach(group => {
        group.rules = rules.filter(rule =>
          rule.entityType === group.entityType
          && this.notInSelectedRules(rule.id)
          && (this.filterValue().length === 0 || rule.nameEn.toLowerCase().includes(this.filterValue().toLowerCase()))
        );
      });

      this.selectedRulesToRender.forEach(group => {
        group.rules = this.selectedRules().rules
          .filter(rule =>
          rule.ruleEntityType === group.entityType
        );
      });
    }, { allowSignalWrites: true });
  }

  addRule(id: number) {
    const userId = this._authStateService.getNameId();
    if (!userId) {
      console.error('User ID is not available');
      return;
    }
    if (!id) {
      return;
    }
    this._fieldWorkService.addRule(id, userId);
    this.resetFilterValue();
    this.selectControl.setValue('');
  }

  removeRule(id: number) {
    this._fieldWorkService.removeRule(id);
  }

  notInSelectedRules(id: number): boolean {
    return !this.selectedRules().rules.some(rule => rule.ruleId === id);
  }

  resetFilterValue() {
    this.filterValue.set('');
  }

  public back() {
    this.fieldWorkState.update((state) => ({
      ...state,
      currentStep: Math.max(state.currentStep - 1, 0)
    }));
  }

  public next() {
    if (this.selectedRules().rules.length === 0) {
      this._matSnackBar.open('Please select at least one rule', 'Close', { duration: 3000 });
      return;
    }
    this.fieldWorkState.update((state) => ({
      ...state,
      currentStep: Math.min(state.currentStep + 1, 3)
    }));
  }

  protected readonly BUILDING_ENTITY  = BUILDING_ENTITY;
  protected readonly ENTRANCE_ENTITY = ENTRANCE_ENTITY;
  protected readonly DWELLING_ENTITY  = DWELLING_ENTITY;
}
