import { Component } from '@angular/core';
import { AuthStateService } from './common/services/auth-state.service';

@Component({
    selector: 'asrdb-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false
})
export class AppComponent {
  title = 'asrdb-frontend';
  isLoggedIn = this.authStateService.getLoginStateAsObservable();

  constructor(private authStateService: AuthStateService) {}
}
