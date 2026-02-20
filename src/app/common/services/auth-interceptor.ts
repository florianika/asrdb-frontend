import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { AuthStateService } from './auth-state.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    if (
      req.url.includes('/addFeatures') ||
      req.url.includes('/updateFeatures') ||
      req.url.includes('/deleteFeatures')
    ) {
      return next.handle(req);
    }

    // Lazily inject AuthStateService to avoid circular dependency
    const auth = this.injector.get(AuthStateService);
    // Get the auth token from the service.
    const authToken = auth.getAuthorizationToken();
    if (!authToken) {
      return next.handle(req);
    }
    // Clone the request and replace the original headers with
    // cloned headers, updated with the authorization.
    const authReq = req.clone({
      headers: req.headers.set('Authorization', authToken),
    });

    // send cloned request with header to the next handler.
    return next.handle(authReq);
  }
}
