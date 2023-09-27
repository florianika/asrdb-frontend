import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AuthStateService } from '../../services/auth-state.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

@Component({
  selector: 'asrdb-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideBarComponent {
  sideBarElements = [
    {
      sectionTitle: "",
      sectionElements: [
        {
          title: "Dashboard",
          path: "/dashboard/overview",
          icon: "dashboard",
          isSelected: false,
        },
        {
          title: "Building register",
          path: "/dashboard/buildings-register",
          icon: "domainm",
          isSelected: false,
        },
        {
          title: "Quality management",
          path: "/dashboard/quality-management",
          icon: "edit_note",
          isSelected: false,
        },
      ]
    },
    {
      sectionTitle: "Administration",
      sectionElements: [
        {
          title: "User administration",
          path: "/dashboard/administration/user-management",
          icon: "manage_accounts",
          isSelected: false,
        },
        {
          title: "Role management",
          path: "/dashboard/administration/role-management",
          icon: "verified_user",
          isSelected: false,
        },
      ],
      condition: (): boolean => {
        return this.isAdmin;
      }
    }
  ]

  constructor(private authStateService: AuthStateService, private router: Router, private changeDetection: ChangeDetectorRef) {
    setTimeout(() => {
      this.updateIsSelectedValues(this.router.url);
      changeDetection.markForCheck();
    }, 100);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => {
        this.updateIsSelectedValues(e.url);
      })
    );
  }

  get isAdmin(): boolean {
    return this.authStateService.isAdmin();
  }

  private updateIsSelectedValues(url: string) {
    for (const sideBarElement of this.sideBarElements) {
      for (const sectionElement of sideBarElement.sectionElements) {
        sectionElement.isSelected = this.isSelected(sectionElement.path, url);
      }
    }
  }

  private isSelected(path: string, url: string): boolean {
    return url.includes(path);
  }
}
