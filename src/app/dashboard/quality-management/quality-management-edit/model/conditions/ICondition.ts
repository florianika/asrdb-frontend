import { EqualsCondition } from './EqualsCondition';
import { HighierCondition } from './HighierCondition';
import { HighierEqualsCondition } from './HighierEqualsCondition';
import { InCondition } from './InCondition';
import { LowerCondition } from './LowerCondition';
import { LowerEqualsCondition } from './LowerEqualsCondition';
import { NotEqualsCondition } from './NotEqualsCondition';
import { NotInCondition } from './NotInCondition';
import { NotNullCondition } from './NotNullCondition';
import { NullCondition } from './NullCondition';

export interface ICondition {
  id: string;
  condition: Condition;
  isValueRequired: boolean;
  getText(): string;
  getValueInputType(): string;
  buildExpression(variable: string, value?: string): string;
}

export enum Condition {
  EQUALS = '==',
  NOT_EQUALS = '!=',
  IS_NULL = 'isNull()',
  IS_NOT_NULL = 'isNull()',
  HIGHIER = '>',
  HIGHIER_EQ = '>=',
  LOWER = '<',
  LOWER_EQ = '<=',
  IN = 'in',
  NOT_IN = 'not in'
}

export function getCondition(conditionString: string) : ICondition {
  for (const [key, value] of ConditionsMap.entries()) {
    if (key === conditionString) {
      return value;
    }
  }
  return ConditionsMap.get(Condition.EQUALS)!;
}

export const ConditionsMap = new Map<Condition, ICondition>([
  [Condition.EQUALS, new EqualsCondition()],
  [Condition.NOT_EQUALS, new NotEqualsCondition()],
  [Condition.IS_NULL, new NullCondition()],
  [Condition.IS_NOT_NULL, new NotNullCondition()],
  [Condition.HIGHIER, new HighierCondition()],
  [Condition.HIGHIER_EQ, new HighierEqualsCondition()],
  [Condition.LOWER, new LowerCondition()],
  [Condition.LOWER_EQ, new LowerEqualsCondition()],
  [Condition.IN, new InCondition()],
  [Condition.NOT_IN, new NotInCondition()],
]);
