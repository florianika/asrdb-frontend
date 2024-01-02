import { Condition, ICondition } from './ICondition';

export class NullCondition implements ICondition {
  id: string;
  condition: Condition = Condition.IS_NULL;
  isValueRequired = false;

  constructor() {
    this.id = Math.random().toString();
  }

  getText(): string {
    return 'Is null';
  }

  getValueInputType(): string {
    return 'text';
  }

  buildExpression(variable: string, value?: string | number): string {
    if (!variable) {
      throw new Error('Variable is required for the condition');
    }

    return `${variable} is null`;
  }

}
