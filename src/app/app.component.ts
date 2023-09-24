import { Component } from '@angular/core';
import { AuthStateService } from './common/services/auth-state.service';

@Component({
  selector: 'asrdb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'asrdb-frontend';

  constructor(private authStateService: AuthStateService) { }
}
