import { computed, Injectable, signal } from '@angular/core';
import {
  FieldWork,
  FieldWorkClosureStatusResponse,
  SelectedRule,
} from './field-work.models';

type FieldWorkState = {
  fieldWorksLoading: boolean;
  fieldWorks: FieldWork[];
  isSaving: boolean;
  activeFieldWork: FieldWork | null;
  isLoading: boolean;
  currentStep: number;
  selectedRules: SelectedRule[];
  selectedRulesLoading: boolean;
  canBeClosed: FieldWorkClosureStatusResponse | null;
};

const INITIAL_STATE: FieldWorkState = {
  fieldWorksLoading: false,
  fieldWorks: [],
  isSaving: false,
  activeFieldWork: null,
  isLoading: false,
  currentStep: 0,
  selectedRules: [],
  selectedRulesLoading: false,
  canBeClosed: null,
};

@Injectable({ providedIn: 'root' })
export class FieldWorkStore {
  private readonly state = signal<FieldWorkState>(INITIAL_STATE);

  readonly fieldWorksState = computed(() => ({
    loading: this.state().fieldWorksLoading,
    fieldWorks: this.state().fieldWorks,
  }));
  readonly fieldWorkState = computed(() => ({
    isSaving: this.state().isSaving,
    activeFieldWork: this.state().activeFieldWork,
    isLoading: this.state().isLoading,
    currentStep: this.state().currentStep,
  }));
  readonly selectedRules = computed(() => ({
    rules: this.state().selectedRules,
    loading: this.state().selectedRulesLoading,
  }));
  readonly canBeClosed = computed(() => this.state().canBeClosed);

  snapshot(): Readonly<FieldWorkState> {
    return this.state();
  }

  patch(statePatch: Partial<FieldWorkState>): void {
    this.state.update(state => ({ ...state, ...statePatch }));
  }

  reset(): void {
    this.state.set(INITIAL_STATE);
  }
}
