import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  FieldWork,
  FieldWorkClosureStatusResponse,
  FieldWorkCreateRequest,
  FieldWorkListResponse,
  SelectedRule,
} from './field-work.models';

@Injectable({ providedIn: 'root' })
export class FieldWorkApiService {
  private readonly baseUrl = `${environment.base_url}/qms/fieldwork`;

  constructor(private http: HttpClient) {}

  getSelectedRules(fieldWorkId: number) {
    return this.http.get<{ fieldworkRulesDTO: SelectedRule[] }>(
      `${this.baseUrl}/${fieldWorkId}/rules`
    );
  }

  getAll() {
    return this.http.get<FieldWorkListResponse>(this.baseUrl);
  }

  getActive() {
    return this.http.get<{ fieldWorkDTO: FieldWork }>(`${this.baseUrl}/active`);
  }

  update(fieldWorkId: number, data: FieldWork) {
    return this.http.put<{ message: string }>(
      `${this.baseUrl}/${fieldWorkId}`,
      data
    );
  }

  assignEmailTemplate(fieldWorkId: number, emailTemplateId: number) {
    return this.http.patch<{ message: string }>(
      `${this.baseUrl}/${fieldWorkId}/email/template/open`,
      { emailTemplateId }
    );
  }

  create(request: FieldWorkCreateRequest) {
    return this.http.post<{ fieldWorkId: number }>(this.baseUrl, request);
  }

  open(fieldWorkId: number) {
    return this.http.post(`${this.baseUrl}/${fieldWorkId}/open`, {});
  }

  addRule(fieldWorkId: number, ruleId: number) {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/${fieldWorkId}/rules`,
      { ruleId }
    );
  }

  removeRule(fieldWorkId: number, ruleId: number) {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/${fieldWorkId}/rules/${ruleId}`
    );
  }

  getClosureStatus(fieldWorkId: number) {
    return this.http.get<FieldWorkClosureStatusResponse>(
      `${this.baseUrl}/${fieldWorkId}/can-be-closed`
    );
  }

  getById(fieldWorkId: number) {
    return this.http.get<{ fieldWorkDTO: FieldWork }>(
      `${this.baseUrl}/${fieldWorkId}`
    );
  }
}
