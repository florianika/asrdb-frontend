import { Condition, ICondition } from './ICondition';

export class EqualsCondition implements ICondition {
  id: string;
  condition: Condition = Condition.EQUALS;
  isValueRequired = true;

  constructor() {
    this.id = Math.random().toString();
  }

  getText(): string {
    return 'Equals';
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

    return `${variable} = "${value}"`;
  }

}
