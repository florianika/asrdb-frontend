import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class FieldWorkNotificationService {
  constructor(private snackBar: MatSnackBar) {}

  show(message: string, duration = 3000): void {
    this.snackBar.open(message, $localize`Close`, { duration });
  }
}
