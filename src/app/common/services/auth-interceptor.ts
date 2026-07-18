import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthStateService } from './auth-state.service';

export function isTrustedApiRequest(
  requestUrl: string,
  apiBaseUrl: string,
  appOrigin = globalThis.location?.origin
): boolean {
  if (!appOrigin) {
    return false;
  }

  try {
    const apiUrl = new URL(apiBaseUrl, appOrigin);
    const parsedRequestUrl = new URL(requestUrl, appOrigin);
    const apiPath = apiUrl.pathname.replace(/\/$/, '');
    const matchesApiPath =
      !apiPath ||
      apiPath === '/' ||
      parsedRequestUrl.pathname === apiPath ||
      parsedRequestUrl.pathname.startsWith(`${apiPath}/`);

    return parsedRequestUrl.origin === apiUrl.origin && matchesApiPath;
  } catch {
    return false;
  }
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    if (
      req.headers.has('Authorization') ||
      !isTrustedApiRequest(req.url, environment.base_url)
    ) {
      return next.handle(req);
    }

    const auth = this.injector.get(AuthStateService);
    const authToken = auth.getAuthorizationToken();
    if (!authToken) {
      return next.handle(req);
    }
    const authReq = req.clone({
      headers: req.headers.set('Authorization', authToken),
    });

    return next.handle(authReq);
  }
}
