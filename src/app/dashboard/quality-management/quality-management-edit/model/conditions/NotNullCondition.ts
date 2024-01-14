import { Condition, ICondition } from './ICondition';

export class NotNullCondition implements ICondition {
  id: string;
  condition: Condition = Condition.IS_NOT_NULL;
  isValueRequired = false;

  constructor() {
    this.id = Math.random().toString();
  }

  getText(): string {
    return 'Is not null';
  }

  getValueInputType(): string {
    return 'text';
  }

  buildExpression(variable: string, value?: string | number): string {
    if (!variable) {
      throw new Error('Variable is required for the condition');
    }

    return `not ${variable}.${this.condition}`;
  }

}
