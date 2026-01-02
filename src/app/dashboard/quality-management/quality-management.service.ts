import { Injectable, signal } from '@angular/core';
import {
  ActiveQualityRulesResponse,
  QualityManagementConfig,
  QualityRule,
  QualityRuleResponse,
  QualityRulesResponse,
  ShortQualityRule,
} from './quality-management-config';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

const SAVE_URL = '/qms/rules';
const UPDATE_URL = '/qms/rules/';

@Injectable({
  providedIn: 'root',
})
export class QualityManagementService {
  private qualityRules = new BehaviorSubject<QualityRule[]>([]);
  private qualityRule = new BehaviorSubject<QualityRule | null>(null);
  private loadingResults = new BehaviorSubject<boolean>(false);
  private isSaving = new BehaviorSubject<boolean>(false);

  constructor(
    private httpClient: HttpClient,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  public activeRules = signal({
    rules: [] as ShortQualityRule[],
    loading: false,
  });

  public get qualityRulesAsObservable() {
    return this.qualityRules.asObservable();
  }

  public get qualityRuleAsObservable() {
    return this.qualityRule.asObservable();
  }

  public get loadingResultsAsObservable() {
    return this.loadingResults.asObservable();
  }

  public get isSavingAsObservable() {
    return this.isSaving.asObservable();
  }

  public getActiveRules() {
    this.activeRules.update(state => ({ ...state, loading: true }));
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
          return of({ shortRulesDTO: [] });
        })
      )
      .subscribe((res: ActiveQualityRulesResponse) => {
        this.activeRules.update(state => ({
          ...state,
          rules: res.shortRulesDTO,
          loading: false,
        }));
      });
  }

  public getRules(type: string | null) {
    this.loadingResults.next(true);
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
          return of({ rulesDTO: [] });
        })
      )
      .subscribe((res: QualityRulesResponse) => {
        this.qualityRules.next(res.rulesDTO);
        this.loadingResults.next(false);
      });
  }

  public getRule(type: string | null, id: string) {
    this.loadingResults.next(true);
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
          return of({ rulesDTO: null });
        })
      )
      .subscribe((res: QualityRuleResponse | { rulesDTO: null }) => {
        this.qualityRule.next(res.rulesDTO);
        this.loadingResults.next(false);
      });
  }

  cancelEdit() {
    this.isSaving.next(false);
    this.qualityRule.next(null);
  }

  public save(rule: any, qualityType: string) {
    this.isSaving.next(true);
    this.httpClient
      .post(environment.base_url + SAVE_URL, JSON.stringify(rule), {
        headers: { 'Content-Type': 'application/json' },
      })
      .subscribe({
        next: () => {
          this.isSaving.next(false);
          this.qualityRule.next(null);
          this.router.navigateByUrl(
            '/dashboard/quality-management/' + qualityType
          );
          this.snack.open(
            $localize`Quality rule was saved`,
            $localize`Ok`,
            { duration: 3000 }
          );
        },
        error: err => {
          console.error(err);
          this.isSaving.next(false);
          this.snack.open(
            $localize`Error when trying to save the rule. Please try again.`,
            $localize`Ok`,
            { duration: 3000 }
          );
        },
      });
  }

  public update(rule: any, qualityType: string) {
    this.isSaving.next(true);
    this.httpClient
      .put(environment.base_url + UPDATE_URL + rule.id, JSON.stringify(rule), {
        headers: { 'Content-Type': 'application/json' },
      })
      .subscribe({
        next: () => {
          this.isSaving.next(false);
          this.qualityRule.next(null);
          this.router.navigateByUrl(
            '/dashboard/quality-management/' + qualityType
          );
          this.snack.open(
            $localize`Quality rule was saved`,
            $localize`Ok`,
            { duration: 3000 }
          );
        },
        error: err => {
          console.error(err);
          this.isSaving.next(false);
          this.qualityRule.next(null);
          this.snack.open(
            $localize`Error when trying to save the rule. Please try again.`,
            $localize`Ok`,
            { duration: 3000 }
          );
        },
      });
  }

  public toggleStatus(ruleId: string, qualityType: string) {
    this.isSaving.next(true);
    this.httpClient
      .patch(environment.base_url + UPDATE_URL + ruleId, {})
      .subscribe({
        next: () => {
          this.isSaving.next(false);
          this.qualityRule.next(null);
          this.getRules(qualityType);
          void this.router.navigateByUrl(
            '/dashboard/quality-management/' + qualityType
          );
          this.snack.open(
            $localize`Quality rule was saved`,
            $localize`Ok`,
            { duration: 3000 }
          );
        },
        error: err => {
          console.error(err);
          this.isSaving.next(false);
          this.qualityRule.next(null);
          this.getRules(qualityType);
          this.snack.open(
            $localize`Error when trying to change status. Please try again.`,
            $localize`Ok`,
            { duration: 3000 }
          );
        },
      });
  }
}
