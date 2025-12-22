import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ForgotPasswordComponent} from "./forgot-password/forgot-password.component";

const routes: Routes = [
  { path: '', redirectTo: '/auth/signin', pathMatch: 'full' },
  {
    path: 'signin',
    // loadChildren: () => import('./signin/signin.module').then(m => m.SigninModule),
    loadComponent: () => import('./signin-v2/signin-v2.component').then(m => m.SigninV2Component),
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
