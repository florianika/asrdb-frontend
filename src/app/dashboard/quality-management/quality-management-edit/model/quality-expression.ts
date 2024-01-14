import { Condition, ConditionsMap, ICondition, getCondition, getConditionByConditionString, getConditionById } from "./conditions/ICondition";
import { NotNullCondition } from "./conditions/NotNullCondition";

export interface FlatRule {
  id: string;
  variable: string;
  condition: ICondition;
  value?: string;
  group?: boolean;
  operator?: string;
}

export interface ExpressionForm {
  variable: string | null;
  condition: string | null;
  value: string | null | undefined;
  group: boolean | null | undefined;
  operator: string | null | undefined;
}

export enum Operator {
  AND = "&",
  OR = "|"
}

export const OperatorsMap = new Map<Operator, string>([
  [Operator.AND, 'And'],
  [Operator.OR, 'Or'],
]);

export const OperatorsToExpressionMap = new Map<Operator, string>([
  [Operator.AND, '&'],
  [Operator.OR, '|'],
]);

export class Expression {
  constructor(public firstRule: Rule, public operator?: Operator, public nextRule?: Expression) { }

  addRule(rule: Expression) {
    if (!this.nextRule) {
      this.nextRule = rule;
    } else {
      this.nextRule.addRule(rule);
    }
  }

  removeRule(rule: Partial<ExpressionForm>) {
    if (this.nextRule?.firstRule.variable === rule.variable && this.nextRule?.firstRule.value === rule.value && this.nextRule?.firstRule.condition === rule.condition) {
      const nextRule = this.nextRule?.nextRule;
      this.nextRule = nextRule;
    }
  }

  static fromString(expressionString: string): Expression {
    // A = "12" & (B != "12" | C is not null) & D in ("12, 13")
    let isNotCondtition = false;
    let index = Expression.getOperatorIndex(expressionString);
    const operator = index === -1 ? undefined : expressionString.substring(index, index + 1) as Operator;

    if (index === -1) {
      index = expressionString.length;
    }

    let subString = expressionString
      .substring(0, index)
      .trim();

    if (subString.startsWith('not') || subString.startsWith('(not')) {
      subString = subString.replace('not ', '').trim();
      isNotCondtition = true;
    }

    const parts = subString.split(" "); // ['A', '=', '"12"']

    const { variable, group } = Expression.getVariableAndGroup(parts[0] as string);
    const condition = Expression.getCondition(subString, parts, isNotCondtition);
    const value = Expression.getValue(subString, parts, condition);

    const rule = new Rule(variable, condition, value, group);
    const nextExpression: Expression | undefined = operator ? Expression.fromString(expressionString.substring(index + 2)) : undefined;

    return new Expression(rule, operator, nextExpression);
  }

  toFlatArray(): FlatRule[] {
    const ruleArray: FlatRule[] = [];
    ruleArray.push({ ...this.firstRule, operator: this.operator });
    if (this.nextRule) {
      ruleArray.push(...this.nextRule.toFlatArray());
    }
    return ruleArray;
  }

  toString(closeBrackets = 0): string {
    let expression = this.buildExpression();

    if (this.operator != undefined && this.nextRule != undefined) {
      const operator = this.operator;
      if (this.firstRule.group) {
        if (this.nextRule.operator === Operator.OR && this.nextRule.firstRule.group) {
          return `(${expression} ${operator} ${this.nextRule.toString(++closeBrackets)}`;
        } else {
          return this.buildGroupedExpression(this.nextRule, expression, operator!, closeBrackets);
        }
      } else {
        return expression + ` ${operator} ` + this.nextRule.toString();
      }
    }
    return expression;
  }

  updateValues(id: string, values: Partial<ExpressionForm>) {
    if (this.firstRule.id === id) {
      this.firstRule.variable = values.variable ?? "";
      this.firstRule.condition = values.condition ? getConditionById(values.condition) : getCondition(Condition.EQUALS);
      this.firstRule.value = values.value ?? "";
      this.firstRule.group = (values.group ?? false) && values.operator === Operator.OR;
      this.operator = values.operator as Operator ?? undefined;
    } else {
      this.nextRule?.updateValues(id, values);
    }
  }

  protected buildExpression() {
    return this.firstRule.condition.buildExpression(this.firstRule.variable, this.firstRule.value);
  }

  private buildGroupedExpression(nextRule: Expression, expression: string, operator: string, closeBrackets: number) {
    const secondExpression = nextRule.buildExpression();
    let combinedExpression = `(${expression} ${operator} ${secondExpression})`;
    if (nextRule.nextRule) {
      const nextOperator = nextRule.operator;
      if (nextOperator === Operator.AND && closeBrackets) {
        for (let index = 0; index < closeBrackets; index++) {
          combinedExpression += ")";
        }
        closeBrackets = 0;
      }
      return combinedExpression + ` ${nextOperator} ` + nextRule.nextRule.toString(closeBrackets);
    }
    if (closeBrackets) {
      for (let index = 0; index < closeBrackets; index++) {
        combinedExpression += ")";
      }
      closeBrackets = 0;
    }
    return combinedExpression;
  }

  private static getOperatorIndex(expression: string) {
    const andIndex = expression.indexOf(OperatorsToExpressionMap.get(Operator.AND) ?? "-99999");
    const orIndex = expression.indexOf(OperatorsToExpressionMap.get(Operator.OR) ?? "-99999");

    if (andIndex === -1) {
      return orIndex;
    }

    if (orIndex === -1) {
      return andIndex;
    }

    return Math.min(andIndex, orIndex);
  }

  private static getVariableAndGroup(variable: string) {
    const condition = getCondition(Condition.IS_NULL).getCondition();
    let variableName = variable.includes(condition) ? variable.substring(0, variable.lastIndexOf('.')) : variable;
    let group = false;
    if (variable.startsWith("(")) {
      variableName = variableName.substring(1);
      group = true;
    }
    return {
      variable: variableName,
      group
    }
  }

  private static getCondition(subString: string, parts: string[], isNotCondition: boolean): ICondition {
    const isNullCondition = getCondition(Condition.IS_NULL).getCondition();
    const notInCondition = getCondition(Condition.NOT_IN).getCondition();

    if (subString.includes(isNullCondition)) {
      return isNotCondition ? ConditionsMap.get(Condition.IS_NOT_NULL)! : ConditionsMap.get(Condition.IS_NULL)!;
    }
    if (subString.includes(notInCondition)) {
      return getCondition(Condition.NOT_IN);
    }
    return getConditionByConditionString(parts[1] as string);
  }

  private static getValue(subString: string, parts: string[], condition: ICondition) {
    const isNullCondition = getCondition(Condition.IS_NULL).getCondition();
    const notInCondition = getCondition(Condition.NOT_IN).getCondition();
    const inCondition = getCondition(Condition.IN).getCondition();

    let value;
    if (subString.includes(isNullCondition)) {
      return;
    } else if (subString.includes(notInCondition)) {
      const valueParts = parts.slice(3);
      value = valueParts.join(' ') as string | undefined;
    } else {
      const valueParts = parts.slice(2);
      value = valueParts.join(' ') as string | undefined;
    }
    value = value?.trim();

    if (value?.endsWith(")") && !subString.includes(isNullCondition)) {
      let index = value.indexOf(')');
      let startIndex = 0;
      if ([inCondition, notInCondition].includes(condition.getCondition())) {
        startIndex++;
      }
      value = value.substring(startIndex, index);
    }

    if (value?.startsWith('"')) {
      value = value.substring(1);
    }
    if (value?.endsWith('"')) {
      value = value.substring(0, value.length - 1);
    }
    return value?.trim();
  }
}

export class Rule {
  id: string;
  constructor(public variable: string, public condition: ICondition, public value?: string, public group?: boolean) {
    this.id = Math.random().toString();
  }
}
