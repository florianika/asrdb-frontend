import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'concatenateMessage'
})
export class ConcatenateMessagePipe implements PipeTransform {
  transform(value?: string, lenght = 10): string {
    if (!value) {
      return '-';
    }
    if (value.trim().length > lenght) {
      return value.substring(0, lenght) + '...';
    }
    return value;
  }
}
