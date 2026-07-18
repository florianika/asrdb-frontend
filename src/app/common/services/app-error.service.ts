import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TimeoutError } from 'rxjs';
import { AppError, AppErrorKind } from '../model/app-error';

@Injectable({ providedIn: 'root' })
export class AppErrorService {
  normalize(error: unknown, url?: string): AppError {
    if (error instanceof TimeoutError) {
      return {
        kind: 'timeout',
        message: $localize`The request timed out.`,
        url,
        cause: error,
      };
    }

    if (error instanceof HttpErrorResponse) {
      return {
        kind: this.kindFromStatus(error.status),
        message: this.messageFromResponse(error),
        status: error.status,
        url: error.url ?? url,
        cause: error,
      };
    }

    return {
      kind: 'unknown',
      message:
        error instanceof Error ? error.message : $localize`Unknown error`,
      url,
      cause: error,
    };
  }

  private kindFromStatus(status: number): AppErrorKind {
    if (status === 0) return 'network';
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 400 || status === 409 || status === 422) {
      return 'validation';
    }
    if (status >= 500) return 'server';
    return 'unknown';
  }

  private messageFromResponse(error: HttpErrorResponse): string {
    const responseMessage = error.error?.message;
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage;
    }
    if (error.status === 0) {
      return $localize`The server could not be reached.`;
    }
    return error.message || $localize`The request failed.`;
  }
}
