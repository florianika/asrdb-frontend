import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';

@Component({
  standalone: true,
  selector: 'asrdb-variable-selector',
  templateUrl: './variable-selector.component.html',
  styleUrls: ['./variable-selector.component.css'],
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ]
})
export class VariableSelectorComponent {
  @Input() required = false;
  @Input() variable: string = "";
  @Output() variableChange = new EventEmitter<string>();

  changeRole(selectedPermission: MatSelectChange) {
    this.variableChange.emit(selectedPermission.value);
  }
}
