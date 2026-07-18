import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {MatDrawer} from '@angular/material/sidenav';
import {AuthStateService} from '../../services/auth-state.service';

@Component({
    selector: 'asrdb-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ToolbarComponent {
  @Input() drawer!: MatDrawer;
  isLoggedIn = this.authStateService.getLoginStateAsObservable();

  constructor(private authStateService: AuthStateService) {}

  logout() {
    this.authStateService.logout();
  }

  changeLanguage(language: string) {
    const currentUrl = new URL(location.href);
    const newUrl = currentUrl.origin + `/${language}/` + currentUrl.hash;
    console.log('Navigating to URL:', newUrl);
    history.pushState(newUrl, '', newUrl);
    location.reload();
  }
}
