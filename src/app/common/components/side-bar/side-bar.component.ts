import { Component } from '@angular/core';
import { AuthStateService } from '../../services/auth-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'asrdb-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css'],
})
export class SideBarComponent {
  sideBarElements = [
    {
      sectionTitle: "",
      sectionElements: [
        {
          title: "Dashboard",
          path: "dashboard/overview",
          icon: "dashboard",
        },
        {
          title: "Building register",
          path: "/dashboard/buildings-register",
          icon: "domainm",
        },
        {
          title: "Quality management",
          path: "/dashboard/quality-management",
          icon: "edit_note",
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
        },
        {
          title: "Role management",
          path: "/dashboard/administration/role-management",
          icon: "verified_user",
        },
      ],
      condition: (): boolean => { //TODO: This is triggered on hover. Find a better solution
        return this.isAdmin;
      }
    }
  ]

  constructor(private authStateService: AuthStateService, private router: Router) {
  }

  get isAdmin(): boolean {
    return this.authStateService.isAdmin();
  }

  isSelected(path: string): boolean {
    return this.router.url.includes(path);
  }
}
