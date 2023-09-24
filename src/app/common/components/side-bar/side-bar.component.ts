import { Component } from '@angular/core';
import { AuthStateService } from '../../services/auth-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'asrdb-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent {
  sideBarElements = [
    {
      sectionTitle: "",
      sectionElements: [
        {
          title: "Dashboard",
          path: "/dashboard",
          icon: "dashboard"
        },
        {
          title: "Building register",
          path: "/dashboard/buildings-register",
          icon: "domainm"
        },
        {
          title: "Quality management",
          path: "/dashboard/quality-management",
          icon: "edit_note"
        },
      ]
    },
    {
      sectionTitle: "Administration",
      sectionElements: [
        {
          title: "User administration",
          path: "/dashboard/administration/user-management",
          icon: "manage_accounts"
        },
        {
          title: "Role management",
          path: "/dashboard/administration/role-management",
          icon: "verified_user"
        },
      ],
      condition: (): boolean => {
        return this.isAdmin;
      }
    }
  ]

  constructor(private authStateService: AuthStateService, private route: Router) {}

  get isAdmin(): boolean {
    return this.authStateService.isAdmin();
  }

  isSelected(path: string): boolean{
    return this.route.url.includes(path);
  }
}
