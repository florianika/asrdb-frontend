import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmailTemplateManagementRoutingModule } from './email-template-management-routing.module';
import { EmailTemplateManagementTableComponent } from './email-template-management-table/email-template-management-table.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { RoleSelectorComponent } from '../../../common/standalone-components/role-selector/role-selector.component';
import { EmailTemplateManagementFormComponent } from './email-template-management-form/email-template-management-form.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConcatenateMessagePipe } from 'src/app/common/pipes/concatenate-message.pipe';
import { NgxEditorModule } from 'ngx-editor';
import { UserManagementService } from '../user-management/user-management.service';

@NgModule({
  declarations: [
    EmailTemplateManagementTableComponent,
    EmailTemplateManagementFormComponent,
  ],
  imports: [
    CommonModule,
    EmailTemplateManagementRoutingModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    RoleSelectorComponent,
    ReactiveFormsModule,
    MatTooltipModule,
    ConcatenateMessagePipe,
    NgxEditorModule,
  ],
  providers: [UserManagementService],
})
export class EmailTemplateManagementModule {}
