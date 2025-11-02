import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ForgotPasswordComponent} from "./forgot-password/forgot-password.component";

const routes: Routes = [
  { path: '', redirectTo: '/auth/signin', pathMatch: 'full' },
  {
    path: 'signin',
    loadChildren: () =>
      import('./signin/signin.module').then(m => m.SigninModule),
  },
  // {
  //   path: 'signup',
  //   loadChildren: () =>
  //     import('./signup/signup.module').then(m => m.SignupModule),
  // },
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
