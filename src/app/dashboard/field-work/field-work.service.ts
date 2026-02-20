import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Subject, catchError, finalize, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AsyncOrchestrationService } from '../common/service/async-orchestration.service';

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

type FieldWorkStoreState = {
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

@Injectable({ providedIn: 'root' })
export class FieldWorkService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private activeFieldWorkStatusPollingStop$ = new Subject<void>();
  private canBeClosedRequestInFlightFor: number | null = null;
  private matSnackBar = inject(MatSnackBar);
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private asyncOrchestration = inject(AsyncOrchestrationService);

  private readonly state = signal<FieldWorkStoreState>({
    fieldWorksLoading: false,
    fieldWorks: [],
    isSaving: false,
    activeFieldWork: null,
    isLoading: false,
    currentStep: 0,
    selectedRules: [],
    selectedRulesLoading: false,
    canBeClosed: null,
  });

  public readonly fieldWorksState = computed(() => ({
    loading: this.state().fieldWorksLoading,
    fieldWorks: this.state().fieldWorks,
  }));
  public readonly fieldWorkState = computed(() => ({
    isSaving: this.state().isSaving,
    activeFieldWork: this.state().activeFieldWork,
    isLoading: this.state().isLoading,
    currentStep: this.state().currentStep,
  }));
  public readonly selectedRules = computed(() => ({
    rules: this.state().selectedRules,
    loading: this.state().selectedRulesLoading,
  }));
  public readonly canBeClosed = computed(() => this.state().canBeClosed);

  ngOnDestroy(): void {
    this.cancelActiveFieldWorkStatusPolling(true);
    this.destroy$.next();
    this.destroy$.complete();
    this.activeFieldWorkStatusPollingStop$.complete();
  }

  public cancelActiveFieldWorkStatusPolling(resetLoading = true) {
    this.asyncOrchestration.resetPolling(this.activeFieldWorkStatusPollingStop$);
    if (resetLoading) {
      this.patchState({ isLoading: false });
    }
  }

  public setCurrentStep(step: number) {
    this.patchState({ currentStep: step });
  }

  public moveCurrentStep(offset: number, min = 0, max = 3) {
    const currentStep = this.state().currentStep;
    const nextStep = Math.min(max, Math.max(min, currentStep + offset));
    this.patchState({ currentStep: nextStep });
  }

  public loadSelectedRules(fieldWorkId: number) {
    this.patchState({ selectedRulesLoading: true });
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
        this.patchState({
          selectedRules: res.fieldworkRulesDTO,
          selectedRulesLoading: false,
        });
      });
  }

  public loadAllFieldWorks() {
    this.patchState({ fieldWorksLoading: true, fieldWorks: [] });
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
      .subscribe(res => {
        this.patchState({
          fieldWorksLoading: false,
          fieldWorks: res.fieldworksDTO,
        });
      });
  }

  public getActiveFieldWork(step: number = 0) {
    this.patchState({ isLoading: true });
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
      .subscribe(res => {
        const activeFieldWork = res?.fieldWorkDTO || null;
        const previousCanBeClosed = this.state().canBeClosed;
        this.patchState({
          isLoading: false,
          isSaving: false,
          activeFieldWork,
          currentStep: step,
          canBeClosed:
            activeFieldWork &&
            previousCanBeClosed?.fieldWorkId === activeFieldWork.fieldWorkId
              ? previousCanBeClosed
              : null,
        });
      });
  }

  public updateFieldWork(changes: Partial<FieldWork>, fieldWorkId: number) {
    const data = {
      ...this.state().activeFieldWork,
      ...changes,
      fieldWorkId,
    } as FieldWork;
    this.patchState({ isSaving: true });
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
          this.patchState({ isSaving: false });
          this.matSnackBar.open(
            $localize`Field work update failed. Please try again.`,
            $localize`Close`,
            { duration: 5000 }
          );
          return;
        }
        this.getActiveFieldWork(this.state().currentStep + 1);
      });
  }

  public assignEmailTemplate(emailTemplateId: number, fieldWorkId: number) {
    this.patchState({ isSaving: true });
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
          this.patchState({ isSaving: false });
          this.matSnackBar.open(
            $localize`Email template assignment failed. Please try again.`,
            $localize`Close`,
            { duration: 5000 }
          );
          return;
        }
        this.getActiveFieldWork(this.state().currentStep + 1);
      });
  }

  public createFieldWork(request: FieldWorkCreateRequest) {
    this.patchState({ isSaving: true });
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
          this.patchState({ isSaving: false });
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
    this.patchState({ isLoading: true });
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
          this.patchState({ isLoading: false });
          return;
        }
        this.startActiveFieldWorkStatusPolling(fieldWorkId);
      });
  }

  public addRule(ruleId: number) {
    const request = { ruleId };
    this.patchState({ selectedRulesLoading: true });
    const fieldWorkId = this.state().activeFieldWork?.fieldWorkId;
    if (!fieldWorkId) {
      console.error('No active field work found');
      this.patchState({ selectedRulesLoading: false });
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
          this.patchState({ selectedRulesLoading: false });
          return;
        }
        this.loadSelectedRules(fieldWorkId);
      });
  }

  public removeRule(ruleId: number) {
    this.patchState({ selectedRulesLoading: true });
    const id = this.state().activeFieldWork?.fieldWorkId;
    if (!id) {
      console.error('No active field work found');
      this.patchState({ selectedRulesLoading: false });
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
          this.patchState({ selectedRulesLoading: false });
          return;
        }
        this.loadSelectedRules(id);
      });
  }

  public canFieldWorkBeClosed(fieldWorkId: number) {
    if (this.state().canBeClosed?.fieldWorkId === fieldWorkId) {
      return;
    }
    if (this.canBeClosedRequestInFlightFor === fieldWorkId) {
      return;
    }
    this.canBeClosedRequestInFlightFor = fieldWorkId;

    this.httpClient
      .get<FieldWorkClosureStatusResponse>(
        `${environment.base_url}/qms/fieldwork/${fieldWorkId}/can-be-closed`
      )
      .pipe(
        finalize(() => {
          if (this.canBeClosedRequestInFlightFor === fieldWorkId) {
            this.canBeClosedRequestInFlightFor = null;
          }
        }),
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
          this.patchState({ canBeClosed: null });
          this.matSnackBar.open(
            $localize`Error checking field work closure status`,
            $localize`Close`,
            { duration: 3000 }
          );
          return;
        }
        this.patchState({ canBeClosed: res });
      });
  }

  private startActiveFieldWorkStatusPolling(fieldWorkId: number, retries = 20) {
    this.cancelActiveFieldWorkStatusPolling(false);
    this.patchState({ isLoading: true });
    let retriesLeft = retries;

    this.asyncOrchestration
      .createPollingStream({
        destroy$: this.destroy$,
        stop$: this.activeFieldWorkStatusPollingStop$,
        request: () =>
          this.httpClient
            .get<{
              fieldWorkDTO: FieldWork;
            }>(`${environment.base_url}/qms/fieldwork/${fieldWorkId}`),
        onError: error => {
          console.error(error);
          this.matSnackBar.open(
            $localize`Error fetching field work status`,
            $localize`Close`,
            { duration: 3000 }
          );
          this.cancelActiveFieldWorkStatusPolling(false);
          this.patchState({ isLoading: false });
        },
      })
      .subscribe(res => {
        if (!res) {
          return;
        }
        if (res.fieldWorkDTO.fieldWorkStatus === 'OPEN') {
          this.cancelActiveFieldWorkStatusPolling(false);
          this.patchState({ isLoading: false });
          this.matSnackBar.open(
            $localize`Field work opened successfully`,
            $localize`Close`,
            { duration: 3000 }
          );
          void this.router.navigate(['/dashboard/field-work']);
          return;
        }
        retriesLeft -= 1;
        if (res.fieldWorkDTO.fieldWorkStatus === 'FAILED' || retriesLeft <= 0) {
          this.cancelActiveFieldWorkStatusPolling(false);
          this.patchState({ isLoading: false });
          this.matSnackBar.open(
            $localize`Field work failed to open. Please try again.`,
            $localize`Close`,
            { duration: 5000 }
          );
          return;
        }
      });
  }

  private patchState(statePatch: Partial<FieldWorkStoreState>) {
    this.state.update(state => ({
      ...state,
      ...statePatch,
    }));
  }
}
