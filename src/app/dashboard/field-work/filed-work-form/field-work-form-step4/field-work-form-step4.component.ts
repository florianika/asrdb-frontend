import {Component, inject} from '@angular/core';
import {MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {FieldWorkService} from "../../field-work.service";
import {Router} from "@angular/router";
import {MatProgressSpinner} from "@angular/material/progress-spinner";

@Component({
  selector: 'asrdb-field-work-form-step4',
  standalone: true,
  imports: [
    MatButton,
    MatIcon,
    MatProgressSpinner
  ],
  templateUrl: './field-work-form-step4.component.html',
  styleUrl: './field-work-form-step4.component.css'
})
export class FieldWorkFormStep4Component {
  private _fieldWorkService = inject(FieldWorkService);
  private _router = inject(Router);

  public fieldWorkState = this._fieldWorkService.fieldWorkState;

  public back() {
    this.fieldWorkState.update((state) => ({
      ...state,
      currentStep: Math.max(state.currentStep - 1, 0)
    }));
  }

  public next() {
    const fieldWorkId = this.fieldWorkState().activeFieldWork?.fieldWorkId;
    if (!fieldWorkId) {
      console.error('No active field work found');
      return;
    }
    this._fieldWorkService.openFieldWork(fieldWorkId);
  }

  public handleClose() {
    void this._router.navigate(['/dashboard/field-work']);
  }
}
