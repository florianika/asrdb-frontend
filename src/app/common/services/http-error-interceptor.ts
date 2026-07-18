import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AppErrorService } from './app-error.service';
import { LoggerService } from './logger.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private appErrorService: AppErrorService,
    private logger: LoggerService
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError(error => {
        const normalized = this.appErrorService.normalize(error, request.url);
        this.logger.error('HTTP request failed', normalized.cause, {
          kind: normalized.kind,
          method: request.method,
          status: normalized.status,
          url: normalized.url,
        });

        // Preserve HttpErrorResponse for existing feature-level handlers.
        return throwError(() => error);
      })
    );
  }
}
