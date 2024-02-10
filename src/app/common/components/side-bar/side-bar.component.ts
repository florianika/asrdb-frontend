import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AuthStateService } from '../../services/auth-state.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/internal/operators/filter';

@Component({
  selector: 'asrdb-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
          selected: false
        },
      ],
      visible: true
    },
    {
      sectionTitle: '',
      sectionElements: [
        {
          title: 'Building register',
          path: '/dashboard/register',
          pathMatch: true,
          icon: 'domainm',
          selected: false,
        },
      ],
      visible: true
    },
    {
      sectionTitle: 'Registers (Deprecated)',
      sectionElements: [
        {
          title: 'Building register',
          path: '/dashboard/buildings-register',
          pathMatch: true,
          icon: 'domainm',
          selected: false,
        },
        {
          title: 'Entrance register',
          path: '/dashboard/buildings-register/entrance',
          icon: 'directions_walk',
          selected: false,
        },
        {
          title: 'Dwelling register',
          path: '/dashboard/buildings-register/dwelling',
          icon: 'meeting_room',
          selected: false,
        }
      ],
      visible: true
    },
    {
      sectionTitle: 'Quality Management',
      sectionElements: [
        {
          title: 'Building Q. Rules',
          path: '/dashboard/quality-management/BUILDING',
          icon: 'domainm',
          selected: false
        },
        {
          title: 'Entrance Q. Rules',
          path: '/dashboard/quality-management/ENTRANCE',
          icon: 'directions_walk',
          selected: false
        },
        {
          title: 'Dwelling Q. Rules',
          path: '/dashboard/quality-management/DWELLING',
          icon: 'meeting_room',
          selected: false
        },
      ],
      visible: true
    },
    {
      sectionTitle: 'Administration',
      sectionElements: [
        {
          title: 'User administration',
          path: '/dashboard/administration/user-management',
          icon: 'manage_accounts',
          selected: false
        },
        {
          title: 'Role management',
          path: '/dashboard/administration/role-management',
          icon: 'verified_user',
          selected: false
        },
      ],
      visible: this.isAdmin
    }
  ];

  constructor(private authStateService: AuthStateService, private router: Router, private changeDetection: ChangeDetectorRef) {
  }

  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.setSelected();
        this.changeDetection.detectChanges();
      });
  }

  get isAdmin(): boolean {
    return this.authStateService.isAdmin();
  }

  private setSelected() {
    for (const sideBarElement of this.sideBarElements) {
      for (const sectionElement of sideBarElement.sectionElements) {
        sectionElement.selected = this.isSelected(sectionElement.path, !!sectionElement.pathMatch);
      }
    }
  }

  private isSelected(path: string, pathMatch = false): boolean {
    return pathMatch ? this.router.url === path : this.router.url.includes(path);
  }
}
