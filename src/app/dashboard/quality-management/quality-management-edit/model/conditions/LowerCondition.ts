import { Condition, ICondition } from './ICondition';

export class LowerCondition implements ICondition {
  id: string;
  condition = '<';
  isValueRequired = true;

  constructor() {
    this.id = Math.random().toString();
  }

  getText(): string {
    return 'Lower than';
  }

  getValueInputType(): string {
    return 'text';
  }

  buildExpression(variable: string, value?: string | number): string {
    if (!variable) {
      throw new Error('Variable is required for the condition');
    }
    if (!value) {
      throw new Error('Value is required for the condition');
    }

    return `${variable} ${this.condition} "${value}"`;
  }

  getCondition(): string {
    return this.condition;
  }

}
