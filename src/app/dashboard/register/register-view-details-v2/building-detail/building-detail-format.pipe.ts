import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'buildingDetailFormat',
  standalone: true
})
export class BuildingDetailFormatPipe implements PipeTransform {

  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const parsedValue = Number(value);
    if (isNaN(parsedValue)) {
      return String(value);
    }

    return Math.round(parsedValue).toString();
  }

}
