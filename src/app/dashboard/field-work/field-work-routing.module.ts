import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {FieldWorkService} from "./field-work.service";
import {FieldWorkTableComponent} from "./field-work-table/field-work-table.component";
import {FiledWorkFormComponent} from "./filed-work-form/filed-work-form.component";

const routes: Routes = [
  { path: '', component: FieldWorkTableComponent },
  { path: 'create', component: FiledWorkFormComponent },
  { path: 'edit/:id', component: FiledWorkFormComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [FieldWorkService]
})
export class FieldWorkRoutingModule { }
