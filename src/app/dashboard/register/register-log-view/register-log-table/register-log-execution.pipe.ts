import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'logExecution'
})
export class LogExecutionPipe implements PipeTransform {
  transform(value?: number): boolean {

    if (value === 1) {
      return true;
    }
    return false;
  }
}
