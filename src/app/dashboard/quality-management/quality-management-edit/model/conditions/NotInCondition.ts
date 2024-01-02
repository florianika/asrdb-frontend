import { Condition, ICondition } from './ICondition';

export class NotInCondition implements ICondition {
  id: string;
  condition: Condition = Condition.NOT_IN;
  isValueRequired = true;

  constructor() {
    this.id = Math.random().toString();
  }

  getText(): string {
    return 'Not in';
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

    return `${variable} not in ("${value}")`;
  }

}
