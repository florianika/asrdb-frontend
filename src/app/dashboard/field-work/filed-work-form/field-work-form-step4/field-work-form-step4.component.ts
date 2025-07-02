import {Component, inject} from '@angular/core';
import {MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {FieldWorkService} from "../../field-work.service";

@Component({
  selector: 'asrdb-field-work-form-step4',
  standalone: true,
  imports: [
      MatButton,
      MatIcon
  ],
  templateUrl: './field-work-form-step4.component.html',
  styleUrl: './field-work-form-step4.component.css'
})
export class FieldWorkFormStep4Component {
  private _fieldWorkService = inject(FieldWorkService);

  public fieldWorkState = this._fieldWorkService.fieldWorkState;

  public back() {
    this.fieldWorkState.update((state) => ({
      ...state,
      currentStep: Math.max(state.currentStep - 1, 0)
    }));
  }

  public next() {
    this.fieldWorkState.update((state) => ({
      ...state,
      currentStep: Math.min(state.currentStep + 1, 3)
    }));
  }
}
