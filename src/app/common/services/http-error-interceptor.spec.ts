import {
  HttpErrorResponse,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';
import { AppErrorService } from './app-error.service';
import { HttpErrorInterceptor } from './http-error-interceptor';
import { LoggerService } from './logger.service';

describe('HttpErrorInterceptor', () => {
  it('logs normalized context and preserves the original error', async () => {
    const logger = jasmine.createSpyObj<LoggerService>('LoggerService', [
      'error',
    ]);
    const originalError = new HttpErrorResponse({
      status: 500,
      url: '/api/buildings',
    });
    const handler = jasmine.createSpyObj<HttpHandler>('HttpHandler', [
      'handle',
    ]);
    handler.handle.and.returnValue(throwError(() => originalError));
    const interceptor = new HttpErrorInterceptor(new AppErrorService(), logger);

    let receivedError: unknown;
    try {
      await firstValueFrom(
        interceptor.intercept(new HttpRequest('GET', '/api/buildings'), handler)
      );
    } catch (error) {
      receivedError = error;
    }

    expect(receivedError).toBe(originalError);
    expect(logger.error).toHaveBeenCalledWith(
      'HTTP request failed',
      originalError,
      jasmine.objectContaining({
        kind: 'server',
        method: 'GET',
        status: 500,
      })
    );
  });
});
