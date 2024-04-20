import {Injectable} from '@angular/core';

@Injectable()
export class CommonRegisterHelperService {
  getTitle(fields: any[], column: string) {
    const field = this.getField(fields, column);
    if (!field) {
      return column;
    }
    return field.alias;
  }

  getMunicipality(fields: any[], column: string, code: string) {
    const codeValues = this.getCodeValues(fields, column, code);
    if (!codeValues) {
      return code;
    }
    return codeValues.code + ' - ' + codeValues.name;
  }

  getValueFromStatus(fields: any[], column: string, code: string | number) {
    const codeValues = this.getCodeValues(fields, column, code);
    if (!codeValues && this.isUnknownValue(code)) {
      return 'Unknown';
    }
    if (!codeValues && this.isNotApplicable(code)) {
      return 'Not applicable';
    }
    if (!codeValues) {
      return code;
    }
    return codeValues.name;
  }

  getField(fields: any[], column: string) {
    return fields?.find(field => field.name === column);
  }

  getCodeValues(fields: any[], column: string, code: string | number) {
    const field = this.getField(fields, column);
    return field?.domain?.codedValues?.find((o: any) => o.code === code);
  }

  private isUnknownValue(code: string | number) {
    return (!code && code !== 0) || /^9+$/.test(code.toString());
  }

  private isNotApplicable(code: string | number) {
    return (!code && code !== 0) || code.toString() === '9000';
  }
}
