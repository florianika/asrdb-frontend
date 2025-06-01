import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailTemplateManagementTableComponent } from './email-template-management-table/email-template-management-table.component';

const routes: Routes = [
  { path: '', component: EmailTemplateManagementTableComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmailTemplateManagementRoutingModule {}
