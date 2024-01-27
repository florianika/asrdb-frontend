import { Condition, ICondition } from './ICondition';

export class HighierCondition implements ICondition {
  id: string;
  condition = '>';
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
      console.log('Variable is required for the condition');
      throw new Error('Variable is required')
    }
    if (!value) {
      console.log('Value is required for the condition');
      throw new Error('Value is required')
    }

    return `${variable} ${this.condition} ${value}`;
  }

  getCondition(): string {
    return this.condition;
  }

}
