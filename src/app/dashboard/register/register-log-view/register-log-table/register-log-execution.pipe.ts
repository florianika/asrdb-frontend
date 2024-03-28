import { Pipe, PipeTransform } from '@angular/core';
import {EXECUTING} from "./register-log.service";

@Pipe({
  standalone: true,
  name: 'logExecution'
})
export class LogExecutionPipe implements PipeTransform {
  transform(value?: number): boolean {
    return value === EXECUTING;
  }
}
