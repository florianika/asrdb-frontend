import { ErrorHandler, Injectable } from '@angular/core';
import { AppErrorService } from './app-error.service';
import { LoggerService } from './logger.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  constructor(
    private appErrorService: AppErrorService,
    private logger: LoggerService
  ) {}

  handleError(error: unknown): void {
    const normalized = this.appErrorService.normalize(error);
    this.logger.error('Unhandled application error', normalized.cause, {
      kind: normalized.kind,
      status: normalized.status,
      url: normalized.url,
    });
  }
}
