import {inject, Injectable, signal} from '@angular/core';
import {BehaviorSubject, catchError, of} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";

export type FieldWork = {
  "fieldWorkId": number,
  "startDate": string,
  "endDate": string,
  "fieldWorkStatus": string,
  "description": string,
  "fieldWorkName": string,
  "openEmailTemplateId": number,
  "createdUser": string,
  "createdTimestamp": string,
  "updatedUser"?: string,
  "updatedTimestamp"?: string,
  "remarks"?: string
}
export type SelectedRule = {
  id: number,
  localId: string,
  ruleId: number,
  createdUser: string,
  createdTimestamp: string,
  ruleNameAl: string,
  ruleNameEn: string,
  ruleLocalId: string,
  ruleEntityType: string,
}
export type FieldWorkListResponse = {
  fieldworksDTO: FieldWork[],
}
export type FieldWorkCreateRequest = {
  fieldWorkName: string,
  description: string,
  startDate: string,
  endDate: string,
  createdUser: string,
}
export type FieldWorkClosureStatusResponse = {
  fieldwork_id: number,
  can_be_closed: boolean,
  reasons: string,
  last_checked: string,
}

@Injectable({
  providedIn: 'root'
})
export class FieldWorkService {

  private matSnackBar = inject(MatSnackBar);
  private httpClient = inject(HttpClient);
  private router = inject(Router);

  private fieldWorks = new BehaviorSubject<{
    loading: boolean,
    fieldWorks: FieldWork[],
  }>({
    loading: false,
    fieldWorks: []
  });
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

  public loadSelectedRules(fieldWorkId: number) {
    this.selectedRules.update((state) => ({
      ...state,
      loading: true,
    }));
    this.httpClient
      .get<{fieldworkRulesDTO: SelectedRule[]}>(environment.base_url + `/qms/fieldwork/${fieldWorkId}/rules`)
      .pipe(catchError(error => {
        console.error(error);
        this.matSnackBar.open('Error loading selected rules', 'Close', {duration: 3000});
        return of({fieldworkRulesDTO: [] as SelectedRule[]});
      }))
      .subscribe(res => {
        this.selectedRules.update((state) => ({
          ...state,
          rules: res.fieldworkRulesDTO,
          loading: false,
        }));
      });
  }

  public loadAllFieldWorks() {
    this.fieldWorks.next({
      loading: true,
      fieldWorks: []
    });

    this.httpClient
      .get<FieldWorkListResponse>(environment.base_url + '/qms/fieldwork')
      .pipe(catchError(error => {
        console.error(error);
        this.matSnackBar.open('Error loading field works', 'Close', {duration: 3000});
        return of({fieldworksDTO: [] as FieldWork[]});
      }))
      .subscribe(res => {
        this.fieldWorks.next({
          loading: false,
          fieldWorks: res.fieldworksDTO
        });
      });
  }

  public getActiveFieldWork(step: number = 0) {
    this.fieldWorkState.update((state) => ({
      ...state,
      isLoading: true,
    }));
    this.httpClient
      .get<{ fieldWorkDTO: FieldWork }>(environment.base_url + '/qms/fieldwork/active')
      .pipe(catchError(error => {
        console.error(error);
        return of(null);
      }))
      .subscribe(res => {
        this.fieldWorkState.update((state) => ({
          ...state,
          isLoading: false,
          isSaving: false,
          activeFieldWork: res?.fieldWorkDTO || null,
          currentStep: step,
        }));
      });
  }

  public updateFieldWork(changes: Partial<FieldWork>, fieldWorkId: number) {
    const data = {
      ...this.fieldWorkState().activeFieldWork,
      ...changes,
      fieldWorkId: fieldWorkId,
    } as FieldWork;
    this.fieldWorkState.update((state) => ({
      ...state,
      isSaving: true
    }));

    this.httpClient
      .put<{message: string}>(environment.base_url + `/qms/fieldwork/${fieldWorkId}`, data)
      .pipe(catchError(error => {
        console.error(error);
        this.matSnackBar.open('Error updating field work', 'Close', {duration: 3000});
        return of(null);
      }))
      .subscribe(res => {
        if (!res) {
          this.fieldWorkState.update((state) => ({
            ...state,
            isSaving: false,
          }));
          this.matSnackBar.open('Field work update failed. Please try again.', 'Close', {duration: 5000});
          return;
        }
        this.getActiveFieldWork(this.fieldWorkState().currentStep + 1);
      });
  }

  public assignEmailTemplate(emailTemplateId: number, fieldWorkId: number) {
    this.fieldWorkState.update((state) => ({
      ...state,
      isSaving: true
    }));
    const request = {
      emailTemplateId: emailTemplateId,
    };
    this.httpClient
      .patch<{message: string}>(environment.base_url + `/qms/fieldwork/${fieldWorkId}/email/template/open`, request)
      .pipe(catchError(error => {
        console.error(error);
        this.matSnackBar.open('Error assigning email template', 'Close', {duration: 3000});
        return of(null);
      }))
      .subscribe(res => {
        if (!res) {
          this.fieldWorkState.update((state) => ({
            ...state,
            isSaving: false,
          }));
          this.matSnackBar.open('Email template assignment failed. Please try again.', 'Close', {duration: 5000});
          return;
        }
        this.getActiveFieldWork(this.fieldWorkState().currentStep + 1);
      });
  }

  public createFieldWork(request: FieldWorkCreateRequest) {
    this.fieldWorkState.update((state) => ({
      ...state,
      isSaving: true
    }));
    this.httpClient
      .post<{fieldWorkId: number}>(environment.base_url + '/qms/fieldwork', request)
      .pipe(catchError(error => {
        console.error(error);
        if (error.status === 403) {
          this.matSnackBar.open('Another active field work exists. Please continue with that one.', 'Close', {duration: 3000});
        } else {
          this.matSnackBar.open('Error creating field work', 'Close', {duration: 3000});
        }
        return of(null);
      }))
      .subscribe(res => {
        if (!res?.fieldWorkId) {
          this.fieldWorkState.update((state) => ({
            ...state,
            isSaving: false,
          }));
          this.matSnackBar.open('Field work creation failed. Please try again.', 'Close', {duration: 5000});
          return;
        }
        this.getActiveFieldWork(1);
      });
  }

  public openFieldWork(fieldWorkId: number) {
    this.fieldWorkState.update(state => ({
      ...state,
      isLoading: true
    }));
    this.httpClient
      .post(environment.base_url + `/qms/fieldwork/${fieldWorkId}/open`, {})
      .pipe(catchError(error => {
        console.error(error);
        this.matSnackBar.open('Error opening field work', 'Close', {duration: 3000});
        return of(null);
      }))
      .subscribe(res => {
        if (!res) {
          this.fieldWorkState.update(state => ({
            ...state,
            isLoading: false
          }));
          return;
        }
        this.getActiveFieldWorkStatus(fieldWorkId);
      });
  }

  public addRule(ruleId: number) {
    const request = {
      ruleId: ruleId,
    }
    this.selectedRules.update((state) => ({
      ...state,
      loading: true,
    }));
    const fieldWorkId = this.fieldWorkState().activeFieldWork?.fieldWorkId;
    if (!fieldWorkId) {
      console.error('No active field work found');
      this.selectedRules.update((state) => ({
        ...state,
        loading: false,
      }));
      return;
    }
    this.httpClient
      .post<{message: string}>(environment.base_url + `/qms/fieldwork/${fieldWorkId}/rules`, request)
      .pipe(catchError(error => {
        console.error(error);
        this.matSnackBar.open('Error adding rule', 'Close', {duration: 3000});
        return of(null);
      }))
      .subscribe(res => {
        if (!res) {
          this.selectedRules.update((state) => ({
            ...state,
            loading: false,
          }));
          return;
        }
        this.loadSelectedRules(this.fieldWorkState().activeFieldWork?.fieldWorkId || 0);
      });
  }

  public removeRule(ruleId: number) {
    this.selectedRules.update((state) => ({
      ...state,
      loading: true,
    }));
    const id = this.fieldWorkState().activeFieldWork?.fieldWorkId;
    if (!id) {
      console.error('No active field work found');
      this.selectedRules.update((state) => ({
        ...state,
        loading: false,
      }));
      return;
    }
    this.httpClient
      .delete<{message: string}>(environment.base_url + `/qms/fieldwork/${id}/rules/${ruleId}`)
      .pipe(catchError(error => {
        console.error(error);
        this.matSnackBar.open('Error removing rule', 'Close', {duration: 3000});
        return of(null);
      }))
      .subscribe(res => {
        if (!res) {
          this.selectedRules.update((state) => ({
            ...state,
            loading: false,
          }));
          return;
        }
        this.loadSelectedRules(this.fieldWorkState().activeFieldWork?.fieldWorkId || 0);
      });
  }

  public canFieldWorkBeClosed(fieldWorkId: number) {
    this.httpClient
      .get<FieldWorkClosureStatusResponse>(environment.base_url + `/qms/fieldwork/${fieldWorkId}/can-be-closed`)
      .pipe(catchError(error => {
        console.error(error);
        this.matSnackBar.open('Error checking if field work can be closed', 'Close', {duration: 3000});
        return of(null);
      }))
      .subscribe(res => {
        if (!res) {
          this.canBeClosed.set(null);
          this.matSnackBar.open('Error checking field work closure status', 'Close', {duration: 3000});
          return;
        }
        this.canBeClosed.set(res);
      });
  }

  private getActiveFieldWorkStatus(fieldWorkId: number, retries = 20) {
    this.fieldWorkState.update(state => ({
      ...state,
      isLoading: true
    }));
    this.httpClient
      .get<{ fieldWorkDTO: FieldWork }>(environment.base_url + `/qms/fieldwork/${fieldWorkId}`)
      .pipe(catchError(error => {
        console.error(error);
        this.matSnackBar.open('Error fetching field work status', 'Close', {duration: 3000});
        return of(null);
      }))
      .subscribe(res => {
        if (!res) {
          this.fieldWorkState.update(state => ({
            ...state,
            isLoading: false
          }));
          return;
        }
        if (res.fieldWorkDTO.fieldWorkStatus === 'OPEN') {
          this.fieldWorkState.update(state => ({
            ...state,
            isLoading: false,
          }));
          this.matSnackBar.open('Field work opened successfully', 'Close', {duration: 3000});
          void this.router.navigate(['/dashboard/field-work']);
          return;
        }
        if (res.fieldWorkDTO.fieldWorkStatus === 'FAILED' || retries === 0) {
          this.fieldWorkState.update(state => ({
            ...state,
            isLoading: false,
          }));
          this.matSnackBar.open('Field work failed to open. Please try again.', 'Close', {duration: 5000});
          return;
        }
        setTimeout(() => {
          this.getActiveFieldWorkStatus(fieldWorkId, retries - 1);
        }, 5000);
      });
  }
}
