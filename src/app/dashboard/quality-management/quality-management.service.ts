import { computed, Injectable, signal } from '@angular/core';
import {
  ActiveQualityRulesResponse,
  QualityManagementConfig,
  QualityRule,
  QualityRuleResponse,
  QualityRulesResponse,
  ShortQualityRule,
} from './quality-management-config';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

const SAVE_URL = '/qms/rules';
const UPDATE_URL = '/qms/rules/';

type QualityManagementState = {
  qualityRules: QualityRule[];
  qualityRule: QualityRule | null;
  loadingResults: boolean;
  isSaving: boolean;
  activeRules: ShortQualityRule[];
  activeRulesLoading: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class QualityManagementService {
  private readonly state = signal<QualityManagementState>({
    qualityRules: [],
    qualityRule: null,
    loadingResults: false,
    isSaving: false,
    activeRules: [],
    activeRulesLoading: false,
  });

  public readonly qualityRules = computed(() => this.state().qualityRules);
  public readonly qualityRule = computed(() => this.state().qualityRule);
  public readonly loadingResults = computed(() => this.state().loadingResults);
  public readonly isSaving = computed(() => this.state().isSaving);
  public readonly activeRules = computed(() => ({
    rules: this.state().activeRules,
    loading: this.state().activeRulesLoading,
  }));

  constructor(
    private httpClient: HttpClient,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  public getActiveRules() {
    this.patchState({ activeRulesLoading: true });
    this.httpClient
      .get<ActiveQualityRulesResponse>(
        environment.base_url + '/qms/rules/active'
      )
      .pipe(
        catchError(err => {
          this.snack.open(
            $localize`Could not load active quality rules`,
            $localize`Ok`,
            { duration: 3000 }
          );
          console.error(err);
          return of({ shortRulesDTO: [] as ShortQualityRule[] });
        })
      )
      .subscribe((res: ActiveQualityRulesResponse) => {
        this.patchState({
          activeRules: res.shortRulesDTO,
          activeRulesLoading: false,
        });
      });
  }

  public getRules(type: string | null) {
    this.patchState({ loadingResults: true });
    const url = QualityManagementConfig.getUrlForType(type);
    this.httpClient
      .get<QualityRulesResponse>(url)
      .pipe(
        catchError(err => {
          this.snack.open(
            $localize`Could not load quality rules for ${type}`,
            $localize`Ok`,
            { duration: 3000 }
          );
          console.error(err);
          return of({ rulesDTO: [] as QualityRule[] });
        })
      )
      .subscribe((res: QualityRulesResponse) => {
        this.patchState({
          qualityRules: res.rulesDTO,
          loadingResults: false,
        });
      });
  }

  public getRule(type: string | null, id: string) {
    this.patchState({ loadingResults: true });
    this.httpClient
      .get<QualityRuleResponse>(environment.base_url + UPDATE_URL + id)
      .pipe(
        catchError(err => {
          this.snack.open(
            $localize`Could not load quality rule for ${type} and id ${id}`,
            $localize`Ok`,
            { duration: 3000 }
          );
          console.error(err);
          return of({ rulesDTO: null as QualityRule | null });
        })
      )
      .subscribe(
        (res: QualityRuleResponse | { rulesDTO: QualityRule | null }) => {
          this.patchState({
            qualityRule: res.rulesDTO,
            loadingResults: false,
          });
        }
      );
  }

  cancelEdit() {
    this.patchState({
      isSaving: false,
      qualityRule: null,
    });
  }

  public save(rule: Partial<QualityRule>, qualityType: string) {
    this.patchState({ isSaving: true });
    this.httpClient
      .post(environment.base_url + SAVE_URL, JSON.stringify(rule), {
        headers: { 'Content-Type': 'application/json' },
      })
      .subscribe({
        next: () => {
          this.patchState({
            isSaving: false,
            qualityRule: null,
          });
          void this.router.navigateByUrl(
            '/dashboard/quality-management/' + qualityType
          );
          this.snack.open($localize`Quality rule was saved`, $localize`Ok`, {
            duration: 3000,
          });
        },
        error: err => {
          console.error(err);
          this.patchState({ isSaving: false });
          this.snack.open(
            $localize`Error when trying to save the rule. Please try again.`,
            $localize`Ok`,
            { duration: 3000 }
          );
        },
      });
  }

  public update(
    rule: Partial<QualityRule> & { id: string | number },
    qualityType: string
  ) {
    this.patchState({ isSaving: true });
    this.httpClient
      .put(environment.base_url + UPDATE_URL + rule.id, JSON.stringify(rule), {
        headers: { 'Content-Type': 'application/json' },
      })
      .subscribe({
        next: () => {
          this.patchState({
            isSaving: false,
            qualityRule: null,
          });
          void this.router.navigateByUrl(
            '/dashboard/quality-management/' + qualityType
          );
          this.snack.open($localize`Quality rule was saved`, $localize`Ok`, {
            duration: 3000,
          });
        },
        error: err => {
          console.error(err);
          this.patchState({
            isSaving: false,
            qualityRule: null,
          });
          this.snack.open(
            $localize`Error when trying to save the rule. Please try again.`,
            $localize`Ok`,
            { duration: 3000 }
          );
        },
      });
  }

  public toggleStatus(ruleId: string, qualityType: string) {
    this.patchState({ isSaving: true });
    this.httpClient
      .patch(environment.base_url + UPDATE_URL + ruleId, {})
      .subscribe({
        next: () => {
          this.patchState({
            isSaving: false,
            qualityRule: null,
          });
          this.getRules(qualityType);
          void this.router.navigateByUrl(
            '/dashboard/quality-management/' + qualityType
          );
          this.snack.open($localize`Quality rule was saved`, $localize`Ok`, {
            duration: 3000,
          });
        },
        error: err => {
          console.error(err);
          this.patchState({
            isSaving: false,
            qualityRule: null,
          });
          this.getRules(qualityType);
          this.snack.open(
            $localize`Error when trying to change status. Please try again.`,
            $localize`Ok`,
            { duration: 3000 }
          );
        },
      });
  }

  private patchState(statePatch: Partial<QualityManagementState>) {
    this.state.update(state => ({
      ...state,
      ...statePatch,
    }));
  }
}
