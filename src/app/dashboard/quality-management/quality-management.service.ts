import { Injectable } from '@angular/core';
import { EntityType, QualityManagementConfig, QualityRule } from './quality-management-config';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class QualityManagementService {
  private qualityRules = new BehaviorSubject<QualityRule[]>([]);
  private loadingResults = new BehaviorSubject<boolean>(false);

  constructor(private httpClient: HttpClient, private snack: MatSnackBar) { }

  public get qualityRulesAsObservable() {
    return this.qualityRules.asObservable();
  }

  public get loadingResultsAsObservable() {
    return this.loadingResults.asObservable();
  }

  public getData(type: EntityType) {
    this.loadingResults.next(true);
    const url = QualityManagementConfig.getUrlForType(type);
    this.httpClient.get<QualityRule[]>(url).pipe(catchError(err => {
      this.snack.open(`Could not load quality rules for ${type}`, 'Ok', {
        duration: 3000
      });
      console.log(err);
      return of([]);
    })).subscribe((res: QualityRule[]) => {
      this.qualityRules.next(res);
      this.loadingResults.next(false);
    });
  }
}
