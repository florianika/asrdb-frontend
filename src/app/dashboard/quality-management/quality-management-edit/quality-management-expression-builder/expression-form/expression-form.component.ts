import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Condition, ConditionsMap } from '../../model/conditions/ICondition';
import { Operator } from '../../model/quality-expression';

@Component({
  selector: 'asrdb-expression-form',
  templateUrl: './expression-form.component.html',
  styleUrls: ['./expression-form.component.css']
})
export class ExpressionFormComponent {
  @Input() rule?: FormGroup;
  @Input() showOperator?: boolean;

  consdition = Condition;
  operator = Operator;

  getCondition(condition: Condition) {
    return ConditionsMap.get(condition);
  }
}
