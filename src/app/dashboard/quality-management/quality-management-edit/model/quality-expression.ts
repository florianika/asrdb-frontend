import { Condition, ConditionsMap, ICondition, getCondition } from "./conditions/ICondition";


/*
=========================================
*/

export interface FlatRule {
  id: string;
  variable: string;
  condition: ICondition;
  value?: string;
  group?: boolean;
  operator?: string;
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
  constructor(public firstRule: Rule, public operator?: Operator, public nextRule?: Expression) {}

  addRule(rule: Expression) {
    if (!this.nextRule) {
      this.nextRule = rule;
    } else {
      this.nextRule.addRule(rule);
    }
  }

  removeRule(rule: Expression) {
    if (this.nextRule?.firstRule.variable === rule.firstRule.variable && this.nextRule?.firstRule.value === rule.firstRule.value && this.nextRule?.firstRule.condition === rule.firstRule.condition) {
      const nextRule = this.nextRule.nextRule;
      this.nextRule = nextRule;
    }
  }

  static fromString(expressionString: string): Expression {
    // A = "12" & (B != "12" | C is not null) & D in ("12, 13")

    let index = Expression.getOperatorIndex(expressionString);
    const operator = index === -1 ? undefined : expressionString.substring(index, index + 1) as Operator;

    if (index === -1) {
      index = expressionString.length;
    }

    const subString = expressionString
      .substring(0, index)
      .trim();

    const parts = subString.split(" "); // ['A', '=', '"12"']

    const {variable, group} = Expression.getVariableAndGroup(parts[0] as string);
    const condition = Expression.getCondition(subString, variable, parts);
    const value = Expression.getValue(subString, parts);

    const rule = new Rule(variable, condition, value, group);
    const nextExpression: Expression | undefined = operator ? Expression.fromString(expressionString.substring(index + 2)) : undefined;

    return new Expression(rule, operator, nextExpression);
  }

  toFlatArray(): FlatRule[] {
    const ruleArray: FlatRule[] = [];
    ruleArray.push({...this.firstRule, operator: this.operator});
    if (this.nextRule) {
      ruleArray.push(...this.nextRule.toFlatArray());
    }
    return ruleArray;
  }

  toString(): string {
    let expression = this.buildExpression();

    if (this.operator != undefined && this.nextRule != undefined) {
      const operator = this.operator;
      if (this.firstRule.group) {
        return this.buildGroupedExpression(this.nextRule, expression, operator!);
      } else {
        return expression + ` ${operator} ` + this.nextRule.toString();
      }
    }
    return expression;
  }

  updateValues(id: string, values: Partial<{
    variable: string | null;
    condition: ICondition | null;
    value: string | null | undefined;
    group: boolean | null | undefined;
    operator: string | null | undefined;
}>) {
    if (this.firstRule.id === id) {
      this.firstRule.variable = values.variable ?? "";
      this.firstRule.condition = values.condition ?? getCondition(Condition.EQUALS);
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

  private buildGroupedExpression(nextRule: Expression, expression: string, operator: string) {
    const secondExpression = nextRule.buildExpression();
    const combinedExpression = `(${expression} ${operator} ${secondExpression})`;
    if (nextRule.nextRule) {
      const nextOperator = nextRule.operator;
      return combinedExpression + ` ${nextOperator} ` + nextRule.nextRule.toString();
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
    let variableName = variable;
    let group = false;
    if (variable.startsWith("(")) {
      variableName = variable.substring(1);
      group = true;
    }
    return {
      variable: variableName,
      group
    }
  }

  private static getCondition(subString: string, variable: string, parts: string[]) {
    let condition;
    if (subString.includes(Condition.IS_NULL) || subString.includes(Condition.IS_NOT_NULL)) {
      const conditionString = subString
        .substring(variable.length + 1)
        .trim()
        .replace(')', "");
      condition = getCondition(conditionString);
    } else if (subString.includes(Condition.NOT_IN)) {
      condition = getCondition(`${parts[1]} ${parts[2]}`);
    } else {
      condition = getCondition(parts[1] as string);
    }
    return condition;
  }

  private static getValue(subString: string, parts: string[]) {
    let value;
    if (subString.includes(Condition.IS_NULL) || subString.includes(Condition.IS_NOT_NULL)) {
      return;
    }
    if (subString.includes(Condition.NOT_IN)) {
      const valueParts = parts.slice(3);
      value = valueParts.join(' ') as string | undefined;
    }
    const valueParts = parts.slice(2);
    value = valueParts.join(' ') as string | undefined;
    return value?.trim();
  }
}

export class Rule {
  id: string;
  constructor(public variable: string, public condition: ICondition, public value?: string, public group?: boolean) {
    this.id = Math.random().toString();
  }
}
