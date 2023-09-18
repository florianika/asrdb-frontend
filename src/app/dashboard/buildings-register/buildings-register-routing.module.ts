import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuildingsRegisterComponent } from './buildings-register.component';

const routes: Routes = [
  {path: '', component: BuildingsRegisterComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BuildingsRegisterRoutingModule { }
