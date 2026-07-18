import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subject, catchError, finalize, of } from 'rxjs';
import { Router } from '@angular/router';
import { AsyncOrchestrationService } from '../common/service/async-orchestration.service';
import { LoggerService } from '../../common/services/logger.service';
import { FieldWorkApiService } from './field-work-api.service';
import {
  FieldWork,
  FieldWorkCreateRequest,
  SelectedRule,
} from './field-work.models';
import { FieldWorkNotificationService } from './field-work-notification.service';
import { FieldWorkStore } from './field-work.store';

export * from './field-work.models';

@Injectable()
export class FieldWorkService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private activeFieldWorkStatusPollingStop$ = new Subject<void>();
  private canBeClosedRequestInFlightFor: number | null = null;
  private api = inject(FieldWorkApiService);
  private notifications = inject(FieldWorkNotificationService);
  private store = inject(FieldWorkStore);
  private router = inject(Router);
  private asyncOrchestration = inject(AsyncOrchestrationService);
  private logger = inject(LoggerService);

  public readonly fieldWorksState = this.store.fieldWorksState;
  public readonly fieldWorkState = this.store.fieldWorkState;
  public readonly selectedRules = this.store.selectedRules;
  public readonly canBeClosed = this.store.canBeClosed;

  ngOnDestroy(): void {
    this.cancelActiveFieldWorkStatusPolling(true);
    this.destroy$.next();
    this.destroy$.complete();
    this.activeFieldWorkStatusPollingStop$.complete();
  }

  public cancelActiveFieldWorkStatusPolling(resetLoading = true) {
    this.asyncOrchestration.resetPolling(
      this.activeFieldWorkStatusPollingStop$
    );
    if (resetLoading) {
      this.store.patch({ isLoading: false });
    }
  }

  public setCurrentStep(step: number) {
    this.store.patch({ currentStep: step });
  }

  public moveCurrentStep(offset: number, min = 0, max = 3) {
    const currentStep = this.store.snapshot().currentStep;
    const nextStep = Math.min(max, Math.max(min, currentStep + offset));
    this.store.patch({ currentStep: nextStep });
  }

  public loadSelectedRules(fieldWorkId: number) {
    this.store.patch({ selectedRulesLoading: true });
    this.api
      .getSelectedRules(fieldWorkId)
      .pipe(
        catchError(error => {
          this.logger.error('Could not load field work', error);
          this.notifications.show($localize`Error loading selected rules`);
          return of({ fieldworkRulesDTO: [] as SelectedRule[] });
        })
      )
      .subscribe(res => {
        this.store.patch({
          selectedRules: res.fieldworkRulesDTO,
          selectedRulesLoading: false,
        });
      });
  }

  public loadAllFieldWorks() {
    this.store.patch({ fieldWorksLoading: true, fieldWorks: [] });
    this.api
      .getAll()
      .pipe(
        catchError(error => {
          this.logger.error('Could not load active field work', error);
          this.notifications.show($localize`Error loading field works`);
          return of({ fieldworksDTO: [] as FieldWork[] });
        })
      )
      .subscribe(res => {
        this.store.patch({
          fieldWorksLoading: false,
          fieldWorks: res.fieldworksDTO,
        });
      });
  }

  public getActiveFieldWork(step: number = 0) {
    this.store.patch({ isLoading: true });
    this.api
      .getActive()
      .pipe(
        catchError(error => {
          this.logger.error('Could not create field work', error);
          return of(null);
        })
      )
      .subscribe(res => {
        const activeFieldWork = res?.fieldWorkDTO || null;
        const previousCanBeClosed = this.store.snapshot().canBeClosed;
        this.store.patch({
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
      ...this.store.snapshot().activeFieldWork,
      ...changes,
      fieldWorkId,
    } as FieldWork;
    this.store.patch({ isSaving: true });
    this.api
      .update(fieldWorkId, data)
      .pipe(
        catchError(error => {
          this.logger.error('Could not update field work', error);
          this.notifications.show($localize`Error updating field work`);
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.store.patch({ isSaving: false });
          this.notifications.show(
            $localize`Field work update failed. Please try again.`,
            5000
          );
          return;
        }
        this.getActiveFieldWork(this.store.snapshot().currentStep + 1);
      });
  }

  public assignEmailTemplate(emailTemplateId: number, fieldWorkId: number) {
    this.store.patch({ isSaving: true });
    this.api
      .assignEmailTemplate(fieldWorkId, emailTemplateId)
      .pipe(
        catchError(error => {
          this.logger.error('Could not load field work statistics', error);
          this.notifications.show($localize`Error assigning email template`);
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.store.patch({ isSaving: false });
          this.notifications.show(
            $localize`Email template assignment failed. Please try again.`,
            5000
          );
          return;
        }
        this.getActiveFieldWork(this.store.snapshot().currentStep + 1);
      });
  }

  public createFieldWork(request: FieldWorkCreateRequest) {
    this.store.patch({ isSaving: true });
    this.api
      .create(request)
      .pipe(
        catchError(error => {
          this.logger.error('Could not check field work readiness', error);
          if (error.status === 403) {
            this.notifications.show(
              $localize`Another active field work exists. Please continue with that one.`
            );
          } else {
            this.notifications.show($localize`Error creating field work`);
          }
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res?.fieldWorkId) {
          this.store.patch({ isSaving: false });
          this.notifications.show(
            $localize`Field work creation failed. Please try again.`,
            5000
          );
          return;
        }
        this.getActiveFieldWork(1);
      });
  }

  public openFieldWork(fieldWorkId: number) {
    this.store.patch({ isLoading: true });
    this.api
      .open(fieldWorkId)
      .pipe(
        catchError(error => {
          this.logger.error('Could not start field work', error);
          this.notifications.show($localize`Error opening field work`);
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.store.patch({ isLoading: false });
          return;
        }
        this.startActiveFieldWorkStatusPolling(fieldWorkId);
      });
  }

  public addRule(ruleId: number) {
    this.store.patch({ selectedRulesLoading: true });
    const fieldWorkId = this.store.snapshot().activeFieldWork?.fieldWorkId;
    if (!fieldWorkId) {
      this.logger.warn('No active field work found');
      this.store.patch({ selectedRulesLoading: false });
      return;
    }
    this.api
      .addRule(fieldWorkId, ruleId)
      .pipe(
        catchError(error => {
          this.logger.error(
            'Could not assign field work email template',
            error
          );
          this.notifications.show($localize`Error adding rule`);
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.store.patch({ selectedRulesLoading: false });
          return;
        }
        this.loadSelectedRules(fieldWorkId);
      });
  }

  public removeRule(ruleId: number) {
    this.store.patch({ selectedRulesLoading: true });
    const id = this.store.snapshot().activeFieldWork?.fieldWorkId;
    if (!id) {
      this.logger.warn('No active field work found');
      this.store.patch({ selectedRulesLoading: false });
      return;
    }
    this.api
      .removeRule(id, ruleId)
      .pipe(
        catchError(error => {
          this.logger.error('Could not update field work step', error);
          this.notifications.show($localize`Error removing rule`);
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.store.patch({ selectedRulesLoading: false });
          return;
        }
        this.loadSelectedRules(id);
      });
  }

  public canFieldWorkBeClosed(fieldWorkId: number, force = false) {
    if (
      !force &&
      this.store.snapshot().canBeClosed?.fieldWorkId === fieldWorkId
    ) {
      return;
    }
    if (this.canBeClosedRequestInFlightFor === fieldWorkId) {
      return;
    }
    this.canBeClosedRequestInFlightFor = fieldWorkId;

    this.api
      .getClosureStatus(fieldWorkId)
      .pipe(
        finalize(() => {
          if (this.canBeClosedRequestInFlightFor === fieldWorkId) {
            this.canBeClosedRequestInFlightFor = null;
          }
        }),
        catchError(error => {
          this.logger.error('Could not close field work', error);
          this.notifications.show(
            $localize`Error checking if field work can be closed`
          );
          return of(null);
        })
      )
      .subscribe(res => {
        if (!res) {
          this.store.patch({ canBeClosed: null });
          this.notifications.show(
            $localize`Error checking field work closure status`
          );
          return;
        }
        this.store.patch({ canBeClosed: res });
      });
  }

  private startActiveFieldWorkStatusPolling(fieldWorkId: number, retries = 20) {
    this.cancelActiveFieldWorkStatusPolling(false);
    this.store.patch({ isLoading: true });
    let retriesLeft = retries;

    this.asyncOrchestration
      .createPollingStream({
        destroy$: this.destroy$,
        stop$: this.activeFieldWorkStatusPollingStop$,
        request: () => this.api.getById(fieldWorkId),
        onError: error => {
          this.logger.error('Could not refresh field work status', error);
          this.notifications.show($localize`Error fetching field work status`);
          this.cancelActiveFieldWorkStatusPolling(false);
          this.store.patch({ isLoading: false });
        },
      })
      .subscribe(res => {
        if (!res) {
          return;
        }
        if (res.fieldWorkDTO.fieldWorkStatus === 'OPEN') {
          this.cancelActiveFieldWorkStatusPolling(false);
          this.store.patch({ isLoading: false });
          this.notifications.show($localize`Field work opened successfully`);
          void this.router.navigate(['/dashboard/field-work']);
          return;
        }
        retriesLeft -= 1;
        if (res.fieldWorkDTO.fieldWorkStatus === 'FAILED' || retriesLeft <= 0) {
          this.cancelActiveFieldWorkStatusPolling(false);
          this.store.patch({ isLoading: false });
          this.notifications.show(
            $localize`Field work failed to open. Please try again.`,
            5000
          );
          return;
        }
      });
  }
}
