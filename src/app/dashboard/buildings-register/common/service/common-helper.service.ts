import { Injectable } from "@angular/core";

@Injectable()
export class CommonBuildingRegisterHelper {


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

  getValueFromStatus(fields: any[], column: string, code: string) {
    const codeValues = this.getCodeValues(fields, column, code);
    if (!codeValues) {
      return code;
    }
    return codeValues.name;
  }

  getField(fields: any[], column: string) {
    return fields?.find(field => field.name === column);
  }

  getCodeValues(fields: any[], column: string, code: string) {
    const field = this.getField(fields, column);
    const codeValues = field?.domain?.codedValues?.find((o: any) => o.code === code);
    return codeValues;
  }
}
