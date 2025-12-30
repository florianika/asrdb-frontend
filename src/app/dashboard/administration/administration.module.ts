import { NgModule } from '@angular/core';
import { AdministrationRoutingModule } from './administration-routing.module';
import {DateAdapter, MAT_DATE_LOCALE} from "@angular/material/core";
import {MomentDateAdapter} from "@angular/material-moment-adapter";

@NgModule({
  declarations: [],
  imports: [AdministrationRoutingModule],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    }
  ],
})
export class AdministrationModule {}
