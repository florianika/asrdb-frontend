import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  catchError,
  of,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

export type FieldWork = {
  fieldWorkId: number;
  startDate: string;
  endDate: string;
  fieldWorkStatus: string;
  description: string;
  fieldWorkName: string;
  openEmailTemplateId: number;
  createdUser: string;
  createdTimestamp: string;
  updatedUser?: string;
  updatedTimestamp?: string;
  remarks?: string;
};

export type SelectedRule = {
  id: number;
  localId: string;
  ruleId: number;
  createdUser: string;
  createdTimestamp: string;
  ruleNameAl: string;
  ruleNameEn: string;
  ruleLocalId: string;
  ruleEntityType: string;
};

export type FieldWorkListResponse = { fieldworksDTO: FieldWork[] };
export type FieldWorkCreateRequest = {
  fieldWorkName: string;
  description: string;
  startDate: string;
  endDate: string;
  createdUser: string;
};

export type FieldWorkClosureStatusResponse = {
  fieldWorkId: number;
  canBeClosed: boolean;
  reasons: string;
  lastChecked: string;
};

@Injectable({ providedIn: 'root' })
export class FieldWorkService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private activeFieldWorkStatusPollingStop$ = new Subject<void>();
  private matSnackBar = inject(MatSnackBar);
  private httpClient = inject(HttpClient);
  private router = inject(Router);

  private fieldWorks = new BehaviorSubject<{
    loading: boolean;
    fieldWorks: FieldWork[];
  }>({ loading: false, fieldWorks: [] });
  public fieldWorkState = signal({
    isSaving: false,
    activeFieldWork: null as FieldWork | null,
    isLoading: false,
    currentStep: 0,
  });
  public selectedRules = signal({
    rules: [] as SelectedRule[],
    loading: false,
  });
  public canBeClosed = signal<FieldWorkClosureStatusResponse | null>(null);

  get fieldWorksAsObservable() {
    return this.fieldWorks.asObservable();
  }

  ngOnDestroy(): void {
    this.cancelActiveFieldWorkStatusPolling(true);
    this.destroy$.next();
    this.destroy$.complete();
    this.activeFieldWorkStatusPollingStop$.complete();
  }

  public cancelActiveFieldWorkStatusPolling(resetLoading = true) {
    this.activeFieldWorkStatusPollingStop$.next();
    if (resetLoading) {
      this.fieldWorkState.update(state => ({ ...state, isLoading: false }));
    }
  }

  public loadSelectedRules(fieldWorkId: number) {
    this.selectedRules.update(state => ({ ...state, loading: true }));
    this.httpClient
      .get<{ fieldworkRulesDTO: SelectedRule[] }>(
        `${environment.base_url}/qms/fieldwork/${fieldWorkId}/rules`
      )
      .pipe(
        catchError(error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Error loading selected rules`,
            $localize`Close`,
            { duration: 3000 }
          );
          return of({ fieldworkRulesDTO: [] as SelectedRule[] });
        })
      )
      .subscribe(res => {
        this.selectedRules.update(state => ({
          ...state,
          rules: res.fieldworkRulesDTO,
          loading: false,
        }));
      });
  }

  public loadAllFieldWorks() {
    this.fieldWorks.next({ loading: true, fieldWorks: [] });
    this.httpClient
      .get<FieldWorkListResponse>(`${environment.base_url}/qms/fieldwork`)
      .pipe(
        catchError(error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Error loading field works`,
            $localize`Close`,
            { duration: 3000 }
          );
          return of({ fieldworksDTO: [] as FieldWork[] });
        })
      )
      .subscribe(res =>
        this.fieldWorks.next({ loading: false, fieldWorks: res.fieldworksDTO })
      );
  }

  public getActiveFieldWork(step: number = 0) {
    this.fieldWorkState.update(state => ({ ...state, isLoading: true }));
    this.httpClient
      .get<{ fieldWorkDTO: FieldWork }>(
        `${environment.base_url}/qms/fieldwork/active`
      )
      .pipe(
        catchError(error => {
          console.error(error);
          return of(null);
        })
      )
      .subscribe(res =>
        this.fieldWorkState.update(state => ({
          ...state,
          isLoading: false,
          isSaving: false,
          activeFieldWork: res?.fieldWorkDTO || null,
          currentStep: step,
        }))
      );
  }

  public updateFieldWork(changes: Partial<FieldWork>, fieldWorkId: number) {
    const data = {
      ...this.fieldWorkState().activeFieldWork,
      ...changes,
      fieldWorkId,
    } as FieldWork;
    this.fieldWorkState.update(state => ({ ...state, isSaving: true }));
    this.httpClient
      .put<{ message: string }>(
        `${environment.base_url}/qms/fieldwork/${fieldWorkId}`,
        data
      )
      .pipe(
        catchError(error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Error updating field work`,
            $localize`Close`,
            { duration: 3000 }
          );
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.fieldWorkState.update(state => ({ ...state, isSaving: false }));
          this.matSnackBar.open(
            $localize`Field work update failed. Please try again.`,
            $localize`Close`,
            { duration: 5000 }
          );
          return;
        }
        this.getActiveFieldWork(this.fieldWorkState().currentStep + 1);
      });
  }

  public assignEmailTemplate(emailTemplateId: number, fieldWorkId: number) {
    this.fieldWorkState.update(state => ({ ...state, isSaving: true }));
    const request = { emailTemplateId };
    this.httpClient
      .patch<{ message: string }>(
        `${environment.base_url}/qms/fieldwork/${fieldWorkId}/email/template/open`,
        request
      )
      .pipe(
        catchError(error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Error assigning email template`,
            $localize`Close`,
            { duration: 3000 }
          );
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.fieldWorkState.update(state => ({ ...state, isSaving: false }));
          this.matSnackBar.open(
            $localize`Email template assignment failed. Please try again.`,
            $localize`Close`,
            { duration: 5000 }
          );
          return;
        }
        this.getActiveFieldWork(this.fieldWorkState().currentStep + 1);
      });
  }

  public createFieldWork(request: FieldWorkCreateRequest) {
    this.fieldWorkState.update(state => ({ ...state, isSaving: true }));
    this.httpClient
      .post<{ fieldWorkId: number }>(
        `${environment.base_url}/qms/fieldwork`,
        request
      )
      .pipe(
        catchError(error => {
          console.error(error);
          if (error.status === 403) {
            this.matSnackBar.open(
              $localize`Another active field work exists. Please continue with that one.`,
              $localize`Close`,
              { duration: 3000 }
            );
          } else {
            this.matSnackBar.open(
              $localize`Error creating field work`,
              $localize`Close`,
              { duration: 3000 }
            );
          }
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res?.fieldWorkId) {
          this.fieldWorkState.update(state => ({ ...state, isSaving: false }));
          this.matSnackBar.open(
            $localize`Field work creation failed. Please try again.`,
            $localize`Close`,
            { duration: 5000 }
          );
          return;
        }
        this.getActiveFieldWork(1);
      });
  }

  public openFieldWork(fieldWorkId: number) {
    this.fieldWorkState.update(state => ({ ...state, isLoading: true }));
    this.httpClient
      .post(`${environment.base_url}/qms/fieldwork/${fieldWorkId}/open`, {})
      .pipe(
        catchError(error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Error opening field work`,
            $localize`Close`,
            { duration: 3000 }
          );
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.fieldWorkState.update(state => ({ ...state, isLoading: false }));
          return;
        }
        this.startActiveFieldWorkStatusPolling(fieldWorkId);
      });
  }

  public addRule(ruleId: number) {
    const request = { ruleId };
    this.selectedRules.update(state => ({ ...state, loading: true }));
    const fieldWorkId = this.fieldWorkState().activeFieldWork?.fieldWorkId;
    if (!fieldWorkId) {
      console.error('No active field work found');
      this.selectedRules.update(state => ({ ...state, loading: false }));
      return;
    }
    this.httpClient
      .post<{ message: string }>(
        `${environment.base_url}/qms/fieldwork/${fieldWorkId}/rules`,
        request
      )
      .pipe(
        catchError(error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Error adding rule`,
            $localize`Close`,
            { duration: 3000 }
          );
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.selectedRules.update(state => ({ ...state, loading: false }));
          return;
        }
        this.loadSelectedRules(fieldWorkId);
      });
  }

  public removeRule(ruleId: number) {
    this.selectedRules.update(state => ({ ...state, loading: true }));
    const id = this.fieldWorkState().activeFieldWork?.fieldWorkId;
    if (!id) {
      console.error('No active field work found');
      this.selectedRules.update(state => ({ ...state, loading: false }));
      return;
    }
    this.httpClient
      .delete<{ message: string }>(
        `${environment.base_url}/qms/fieldwork/${id}/rules/${ruleId}`
      )
      .pipe(
        catchError(error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Error removing rule`,
            $localize`Close`,
            { duration: 3000 }
          );
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.selectedRules.update(state => ({ ...state, loading: false }));
          return;
        }
        this.loadSelectedRules(id);
      });
  }

  public canFieldWorkBeClosed(fieldWorkId: number) {
    this.httpClient
      .get<FieldWorkClosureStatusResponse>(
        `${environment.base_url}/qms/fieldwork/${fieldWorkId}/can-be-closed`
      )
      .pipe(
        catchError(error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Error checking if field work can be closed`,
            $localize`Close`,
            { duration: 3000 }
          );
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.canBeClosed.set(null);
          this.matSnackBar.open(
            $localize`Error checking field work closure status`,
            $localize`Close`,
            { duration: 3000 }
          );
          return;
        }
        this.canBeClosed.set(res);
      });
  }

  private startActiveFieldWorkStatusPolling(fieldWorkId: number, retries = 20) {
    this.cancelActiveFieldWorkStatusPolling(false);
    this.fieldWorkState.update(state => ({ ...state, isLoading: true }));
    let retriesLeft = retries;

    timer(0, 5000)
      .pipe(
        takeUntil(this.destroy$),
        takeUntil(this.activeFieldWorkStatusPollingStop$),
        switchMap(() =>
          this.httpClient
            .get<{ fieldWorkDTO: FieldWork }>(
              `${environment.base_url}/qms/fieldwork/${fieldWorkId}`
            )
            .pipe(
              catchError(error => {
                console.error(error);
                this.matSnackBar.open(
                  $localize`Error fetching field work status`,
                  $localize`Close`,
                  { duration: 3000 }
                );
                this.cancelActiveFieldWorkStatusPolling(false);
                this.fieldWorkState.update(state => ({
                  ...state,
                  isLoading: false,
                }));
                return of(null);
              })
            )
        )
      )
      .subscribe(res => {
        if (!res) {
          return;
        }
        if (res.fieldWorkDTO.fieldWorkStatus === 'OPEN') {
          this.cancelActiveFieldWorkStatusPolling(false);
          this.fieldWorkState.update(state => ({ ...state, isLoading: false }));
          this.matSnackBar.open(
            $localize`Field work opened successfully`,
            $localize`Close`,
            { duration: 3000 }
          );
          void this.router.navigate(['/dashboard/field-work']);
          return;
        }
        retriesLeft -= 1;
        if (
          res.fieldWorkDTO.fieldWorkStatus === 'FAILED' ||
          retriesLeft <= 0
        ) {
          this.cancelActiveFieldWorkStatusPolling(false);
          this.fieldWorkState.update(state => ({ ...state, isLoading: false }));
          this.matSnackBar.open(
            $localize`Field work failed to open. Please try again.`,
            $localize`Close`,
            { duration: 5000 }
          );
          return;
        }
      });
  }
}
