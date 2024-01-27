import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { EntityType } from '../../quality-management-config';
import { Expression, Operator, Rule } from '../model/quality-expression';
import { Condition, ConditionsMap, ICondition, getCondition, getConditionById } from '../model/conditions/ICondition';

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

  get expressionFormControl(): AbstractControl | null {
    return this.formGroup.controls['expression'];
  }

  ngOnInit(): void {
    this.expression = this.buildExpressionFromString();
    this.toForm();
  }

  toForm() {
    const expressionMap = this.expression.toFlatArray();
    this.expressionFormGroup = [];
    expressionMap.forEach((element, index) => {
      const valueValidators = this.getValueValidations(element.condition);
      const form = {
        id: new FormControl(element.id),
        variable: new FormControl(element.variable, [Validators.required]),
        condition: new FormControl(element.condition.id, [Validators.required]),
        value: new FormControl(element.value, valueValidators),
        group: new FormControl(element.group),
        operator: new FormControl(element.operator, (index !== expressionMap.length - 1 ) ? [Validators.required] : [])
      };
      if (valueValidators.length === 0) {
        form.value.disable();
      }
      const newFormGroup = new FormGroup(form, { updateOn: 'change' });

      newFormGroup.valueChanges.subscribe((ruleValues) => {
        this.expression.updateValues(element.id, ruleValues);
        this.expressionString = this.buildExpressionString();
        this.formGroup.setValue({expression: this.expressionString});
        const condition = getConditionById(ruleValues.condition!);
        const existingForm = this.expressionFormGroup.find(f => f.value.id === ruleValues.id);
        if (existingForm) {
          const valueFormElement = existingForm.controls['value'];
          const shouldHaveValue = this.hasValue(condition.condition);

          if (shouldHaveValue && valueFormElement.disabled) {
            valueFormElement.enable();
            valueFormElement.setValidators([Validators.required]);
          } else if (!shouldHaveValue && valueFormElement.enabled) {
            valueFormElement.disable();
            valueFormElement.setValidators([]);
          }
        }
      });

      this.expressionFormGroup.push(newFormGroup);
    });
    this.expressionString = this.buildExpressionString();
  }

  addRule() {
    this.expression.addRule(new Expression(
      new Rule(
        this.variable ?? "Variable",
        ConditionsMap.get(Condition.EQUALS)!,
        '',
        false,
      ),
      Operator.AND,
      undefined,
    ));
    this.toForm();
    this.formGroup.setValue({expression: this.expressionString});
  }

  removeRule(id: string) {
    this.expression.removeRule(id);
    this.toForm();
    this.formGroup.setValue({expression: this.expressionString});
  }

  buildExpressionFromString() {
    return this.formGroup.value.expression
      ? Expression.fromString(this.formGroup.value.expression)
      : new Expression(
        new Rule(this.variable ?? "Variable", ConditionsMap.get(Condition.EQUALS)!, '', false));
  }

  buildExpressionString() {
    try {
      return this.expression.toString();
    } catch (error) {
      return '';
    }
  }

  private getValueValidations(condition: ICondition) {
    if (this.hasValue(condition.condition)) {
      return [Validators.required];
    }
    return [];
  }

  private hasValue(condition: string | undefined | null) {
    const isNullCondition = getCondition(Condition.IS_NULL).getCondition();
    const isNotNullCondition = getCondition(Condition.IS_NOT_NULL).getCondition();

    if (condition && [isNotNullCondition, isNullCondition].includes(condition)) {
      return false;
    }
    return true;
  }
}
