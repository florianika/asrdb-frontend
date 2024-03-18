import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthStateService } from './auth-state.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private auth: AuthStateService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    if (req.url.includes('/addFeatures') || req.url.includes('/updateFeatures')) {
      return next.handle(req);
    }

    // Get the auth token from the service.
    const authToken = this.auth.getAuthorizationToken();
    // Clone the request and replace the original headers with
    // cloned headers, updated with the authorization.
    const authReq = req.clone({
      headers: req.headers.set('Authorization', authToken ?? '')
    });

    // send cloned request with header to the next handler.
    return next.handle(authReq);
  }
}
