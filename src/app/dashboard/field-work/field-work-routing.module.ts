import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FieldWorkTableComponent } from './field-work-table/field-work-table.component';
import { FiledWorkFormComponent } from './filed-work-form/filed-work-form.component';
import { FieldWorkClosureModalComponent } from './field-work-closure/field-work-closure-modal.component';

const routes: Routes = [
  { path: '', component: FieldWorkTableComponent },
  { path: 'create', component: FiledWorkFormComponent },
  { path: 'edit/:id', component: FiledWorkFormComponent },
  { path: 'close/:id', component: FieldWorkClosureModalComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FieldWorkRoutingModule {}
