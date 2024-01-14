import { Injectable } from '@angular/core';
import { QualityManagementConfig, QualityRule, QualityRuleResponse, QualityRulesResponse } from './quality-management-config';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

const SAVE_URL = '/qms/rules';
const UPDATE_URL = '/qms/rules/';

@Injectable({
  providedIn: 'root'
})
export class QualityManagementService {
  private qualityRules = new BehaviorSubject<QualityRule[]>([]);
  private qualityRule = new BehaviorSubject<QualityRule | null>(null);
  private loadingResults = new BehaviorSubject<boolean>(false);

  private isSaving = new BehaviorSubject<boolean>(false);

  constructor(private httpClient: HttpClient, private snack: MatSnackBar, private router: Router) { }

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

  public getRules(type: string | null) {
    this.loadingResults.next(true);
    const url = QualityManagementConfig.getUrlForType(type);
    this.httpClient.get<QualityRulesResponse>(url).pipe(catchError(err => {
      this.snack.open(`Could not load quality rules for ${type}`, 'Ok', {
        duration: 3000
      });
      console.log(err);
      return of({ruleDTO: []});
    })).subscribe((res: QualityRulesResponse) => {
      this.qualityRules.next(res.ruleDTO);
      this.loadingResults.next(false);
    });
  }

  public getRule(type: string | null, id: string) {
    this.loadingResults.next(true);
    const url = QualityManagementConfig.getUrlForType(type) + '/' + id;

    this.httpClient.get<QualityRuleResponse>(url).pipe(catchError(err => {
      this.snack.open(`Could not load quality rule for ${type} and id ${id}`, 'Ok', {
        duration: 3000
      });
      console.log(err);
      return of({ruleDTO: null});
    })).subscribe((res: QualityRuleResponse | {ruleDTO: null}) => {
      this.qualityRule.next(res.ruleDTO);
      this.loadingResults.next(false);
    });
  }

  public save(rule: any, qualityType: string) {
    this.isSaving.next(true);
    this.httpClient.post(environment.base_url + SAVE_URL, JSON.stringify(rule), {
      headers: {
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (value) => {
        this.isSaving.next(false);
        this.router.navigateByUrl('/dashboard/quality-management/' + qualityType);
        this.snack.open('Quality rule was saved', 'Ok', {
          duration: 3000
        });
      },
      error: (err) => {
        this.isSaving.next(false);
        this.snack.open('Error when trying to save the rule. Please try again.', 'Ok', {
          duration: 3000
        });
      },
    });
  }

  public update(rule: any, qualityType: string) {
    this.isSaving.next(true);
    this.httpClient.put(environment.base_url + UPDATE_URL + rule.id, JSON.stringify(rule), {
      headers: {
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (value) => {
        this.isSaving.next(true);
        this.router.navigateByUrl('/dashboard/quality-management/' + qualityType);
        this.snack.open('Quality rule was saved', 'Ok', {
          duration: 3000
        });
      },
      error: (err) => {
        this.isSaving.next(true);
        this.snack.open('Error when trying to save the rule. Please try again.', 'Ok', {
          duration: 3000
        });
      },
    });
  }
}
