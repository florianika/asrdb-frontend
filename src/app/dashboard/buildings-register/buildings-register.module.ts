import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BuildingsRegisterRoutingModule } from './buildings-register-routing.module';
import { BuildingsRegisterComponent } from './buildings-register.component';


@NgModule({
  declarations: [
    BuildingsRegisterComponent
  ],
  imports: [
    CommonModule,
    BuildingsRegisterRoutingModule
  ]
})
export class BuildingsRegisterModule { }
