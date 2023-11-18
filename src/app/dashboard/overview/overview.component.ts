import { Component } from '@angular/core';
import { AuthStateService } from 'src/app/common/services/auth-state.service';

@Component({
  selector: 'asrdb-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
})
export class OverviewComponent {
  constructor(private authState: AuthStateService) {
  }

  get user() {
    return this.authState.getFullName();
  }
}
