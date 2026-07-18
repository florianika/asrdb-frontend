import { Injectable } from '@angular/core';
import { getDate } from '../helper/common-utils';

type CodedValue = {
  code: string | number;
  name: string;
};

type Domain = {
  codedValues?: CodedValue[];
};

type FieldLike = Record<string, unknown> & {
  name?: string;
  alias?: string;
  type?: string;
  domain?: Domain;
};

@Injectable()
export class CommonRegisterHelperService {
  getTitle(fields: FieldLike[], column: string) {
    const field = this.getField(fields, column);
    if (!field) {
      return column;
    }
    return field.alias || column;
  }

  getMunicipality(
    fields: FieldLike[],
    column: string,
    code: number | string
  ): string | number {
    const codeValues = this.getCodeValues(fields, column, code);
    if (!codeValues) {
      return code;
    }
    return codeValues.code + ' | ' + codeValues.name;
  }

  getValueFromStatus(
    fields: FieldLike[],
    column: string,
    code: string | number
  ): string | number {
    const codeValues = this.getCodeValues(fields, column, code);
    if (!codeValues && this.isNumberField(fields, column)) {
      return code;
    }
    if (!codeValues && this.isUnknownValue(code)) {
      return '';
    }
    if (!codeValues && this.isNotApplicable(code)) {
      return 'Not applicable';
    }
    if (this.isDateField(fields, column)) {
      const dateValue =
        typeof code === 'number'
          ? new Date(code).toISOString()
          : String(code || '');
      return getDate(dateValue);
    }
    if (column === 'BldArea') {
      return Math.round(Number(code)).toString();
    }
    if (!codeValues) {
      return code;
    }
    return codeValues.name;
  }

  getField(fields: FieldLike[], column: string): FieldLike | undefined {
    return fields?.find(field => String(field.name) === column);
  }

  getCodeValues(
    fields: FieldLike[],
    column: string,
    code: string | number
  ): CodedValue | undefined {
    const field = this.getField(fields, column);
    return field?.domain?.codedValues?.find(o => o.code == code);
  }

  private isUnknownValue(code: string | number) {
    return !code && code !== 0;
  }

  private isNotApplicable(code: string | number) {
    return (!code && code !== 0) || code.toString() === '9000';
  }

  private isDateField(fields: FieldLike[], column: string) {
    const field = this.getField(fields, column);
    return field?.type === 'esriFieldTypeDate';
  }

  private isNumberField(fields: FieldLike[], column: string) {
    const field = this.getField(fields, column);
    return (
      field?.type === 'esriFieldTypeDouble' ||
      field?.type === 'esriFieldTypeInteger' ||
      field?.type === 'esriFieldTypeSmallInteger'
    );
  }
}
