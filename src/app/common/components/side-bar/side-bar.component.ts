import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { AuthStateService } from '../../services/auth-state.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/internal/operators/filter';
import { FILTER_REGISTER } from '../../../dashboard/register/register-table-view/register-filter.service';

@Component({
  selector: 'asrdb-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBarComponent implements AfterViewInit {
  sideBarElements = [
    {
      sectionTitle: '',
      sectionElements: [
        {
          title: 'Dashboard',
          path: 'dashboard/overview',
          icon: 'dashboard',
          selected: true,
        },
      ],
      visible: true,
    },
    {
      sectionTitle: '',
      sectionElements: [
        {
          title: 'Building List',
          path: '/dashboard/register',
          pathMatch: true,
          icon: 'apartment',
          selected: false,
        },
      ],
      visible: true,
    },
    {
      sectionTitle: '',
      sectionElements: [
        {
          title: 'Street List',
          path: '/dashboard/street-management',
          pathMatch: true,
          icon: 'signpost',
          selected: false,
        },
      ],
      visible: this.isAdmin || this.isSupervisor,
    },
    {
      sectionTitle: 'Quality Rule Management',
      sectionElements: [
        {
          title: 'Building Rules',
          path: '/dashboard/quality-management/BUILDING',
          icon: 'apartment',
          selected: false,
        },
        {
          title: 'Entrance Rules',
          path: '/dashboard/quality-management/ENTRANCE',
          icon: 'meeting_room',
          selected: false,
        },
        {
          title: 'Dwelling Rules',
          path: '/dashboard/quality-management/DWELLING',
          icon: 'light',
          selected: false,
        },
      ],
      visible: this.isAdmin || this.isSupervisor,
    },
    {
      sectionTitle: 'Administration',
      sectionElements: [
        {
          title: 'Field Work',
          path: 'dashboard/field-work',
          icon: 'home_work',
          selected: true,
        },
        {
          title: 'Test buildings',
          path: 'dashboard/administration/test-buildings',
          icon: 'home_work',
          selected: true,
        },
        {
          title: 'Statistics Export',
          path: 'dashboard/statistic-export',
          icon: 'leaderboard',
          selected: true,
        },
        {
          title: 'User administration',
          path: '/dashboard/administration/user-management',
          icon: 'manage_accounts',
          selected: false,
        },
        {
          title: 'Email templates',
          path: '/dashboard/administration/email-template-management',
          icon: 'mail',
          selected: false,
        },
      ],
      visible: this.isAdmin || this.isSupervisor,
    },
  ];

  constructor(
    private authStateService: AuthStateService,
    private router: Router,
    private changeDetection: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe(() => {
        this.setSelected();
        this.changeDetection.detectChanges();
      });
  }

  get isAdmin(): boolean {
    return this.authStateService.isAdmin();
  }

  get isSupervisor(): boolean {
    return this.authStateService.isSupervisor();
  }

  handleClick(title: string) {
    if (['Dashboard', 'Building List'].includes(title)) {
      localStorage.removeItem(FILTER_REGISTER);
    }
  }

  private setSelected() {
    for (const sideBarElement of this.sideBarElements) {
      for (const sectionElement of sideBarElement.sectionElements) {
        sectionElement.selected = !!(sectionElement.path && this.isSelected(sectionElement.path));
      }
    }
  }

  private isSelected(path: string, pathMatch = false): boolean {
    return pathMatch
      ? this.router.url === path
      : this.router.url.includes(path);
  }
}
