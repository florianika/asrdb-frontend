import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { EntityType } from '../../quality-management-config';
import { Expression, Operator, Rule } from '../model/quality-expression';
import { Condition, ConditionsMap } from '../model/conditions/ICondition';

@Component({
  selector: 'asrdb-quality-management-expression-builder',
  templateUrl: './quality-management-expression-builder.component.html',
  styleUrls: ['./quality-management-expression-builder.component.css']
})
export class QualityManagementExpressionBuilderComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() variable?: string | null;
  @Input() entityType!: EntityType;

  public expression!: Expression;
  public expressionFormGroup: FormGroup[] = [];
  public expressionString = "";

  ngOnInit(): void {
    this.expression = this.buildExpressionFromString();
    this.test();
    this.toForm()
  }

  toForm() {
    const expressionMap = this.expression.toFlatArray();
    this.expressionFormGroup = [];
    expressionMap.forEach(element => {
      const form = {
        variable: new FormControl(element.variable),
        condition: new FormControl(element.condition),
        value: new FormControl(element.value),
        group: new FormControl(element.group),
        operator: new FormControl(element.operator)
      };
      const newFormGroup = new FormGroup(form, { updateOn: 'blur' });
      newFormGroup.valueChanges.subscribe((ruleValues) => {
        this.expression.updateValues(element.id, ruleValues);
        this.expressionString = this.buildExpressionString();
      });
      this.expressionFormGroup.push(newFormGroup);
    });
  }

  addRule() {
    this.expression.addRule(new Expression(
      new Rule(
        this.variable ?? "Variable",
        ConditionsMap.get(Condition.EQUALS)!,
        '',
        false
      )
    ));
    this.toForm();
  }

  removeRule(rule: Expression) {
    this.expression.removeRule(rule);
    this.toForm();
  }

  buildExpressionFromString() {
    return this.formGroup.value.expression
      ? Expression.fromString(this.formGroup.value.expression)
      : new Expression(
        new Rule(this.variable ?? "Variable", ConditionsMap.get(Condition.EQUALS)!, '', false));
  }

  buildExpressionString() {
    return this.expression.toString();
  }

  test() {
    const expression = new Expression(
      new Rule('A', ConditionsMap.get(Condition.EQUALS)!, '12', false),
      Operator.AND,
      new Expression(
        new Rule('B', ConditionsMap.get(Condition.NOT_EQUALS)!, '12', true),
        Operator.OR,
        new Expression(
          new Rule('C', ConditionsMap.get(Condition.IS_NOT_NULL)!, undefined, false),
          Operator.AND,
          new Expression(
            new Rule('D', ConditionsMap.get(Condition.IN)!, '12, 13', false),
          )
        )
      )
    );

    const expressionString = expression.toString();
    console.log(expressionString);
    console.log(Expression.fromString(expressionString));
  }
}
