import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { AuthStateService } from '../../services/auth-state.service';

@Component({
  selector: 'asrdb-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent {
  @Input() drawer!: MatDrawer;
  isLoggedIn = this.authStateService.getLoginStateAsObservable();

  constructor(private authStateService: AuthStateService) {}

  logout() {
    this.authStateService.logout();
  }
}
