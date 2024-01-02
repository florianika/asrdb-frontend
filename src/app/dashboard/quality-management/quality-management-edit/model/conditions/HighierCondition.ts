import { Condition, ICondition } from './ICondition';

export class HighierCondition implements ICondition {
  id: string;
  condition: Condition = Condition.HIGHIER;
  isValueRequired = true;

  constructor() {
    this.id = Math.random().toString();
  }

  getText(): string {
    return 'Highier than';
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

    return `${variable} > "${value}"`;
  }

}
