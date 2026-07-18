import { Injectable, isDevMode } from '@angular/core';

export type LogContext = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly loggedErrors = new WeakSet<object>();

  debug(message: string, context?: LogContext): void {
    if (isDevMode()) {
      console.debug(message, context ?? '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (isDevMode()) {
      console.info(message, context ?? '');
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(message, context ?? '');
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (typeof error === 'object' && error !== null) {
      if (this.loggedErrors.has(error)) {
        return;
      }
      this.loggedErrors.add(error);
    }
    console.error(message, context ?? '', error ?? '');
  }
}
