import {Component, Inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from "@angular/material/button";
import {MAT_DIALOG_DATA, MatDialogModule} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {
  VariableSelectorComponent
} from "../../../../../common/standalone-components/variable-selector/variable-selector.component";
import {
  EntityTypeSelectorComponent
} from "../../../../../common/standalone-components/entity-type-selector/entity-type-selector.component";
import {LogFilter} from "../../model/log-filter";
import {FormsModule} from "@angular/forms";
import {MatIconModule} from "@angular/material/icon";

@Component({
  selector: 'asrdb-register-log-table-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    VariableSelectorComponent,
    EntityTypeSelectorComponent,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './register-log-table-filter.component.html',
  styleUrls: ['./register-log-table-filter.component.css']
})
export class RegisterLogTableFilterComponent {
  public filter = {
    entityType: '',
    variable: '',
    status: '',
    qualityAction: '',
    errorLevel: ''
  } as LogFilter;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LogFilter
  ) {
    this.filter = JSON.parse(JSON.stringify(data));
  }

  clearFormValue($event: any, filterProp: string) {
    $event.stopPropagation();
    $event.preventDefault();
    (this.filter as any)[filterProp] = '';
  }
}
