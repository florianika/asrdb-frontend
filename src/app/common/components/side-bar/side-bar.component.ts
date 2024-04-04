import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
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
          selected: true
        },
      ],
      visible: true
    },
    {
      sectionTitle: '',
      sectionElements: [
        {
          title: 'Building List',
          path: '/dashboard/register',
          pathMatch: true,
          icon: 'domainm',
          selected: false,
        },
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
      visible: this.isAdmin
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
        sectionElement.selected = this.isSelected(sectionElement.path);
      }
    }
  }

  private isSelected(path: string, pathMatch = false): boolean {
    return pathMatch ? this.router.url === path : this.router.url.includes(path);
  }
}
