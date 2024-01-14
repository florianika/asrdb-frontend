import { Condition, ICondition } from './ICondition';

export class LowerEqualsCondition implements ICondition {
  id: string;
  condition = '<=';
  isValueRequired = true;

  constructor() {
    this.id = Math.random().toString();
  }

  getText(): string {
    return 'Lower or equals to';
  }

  getValueInputType(): string {
    return 'text';
  }

  buildExpression(variable: string, value?: string | number): string {
    if (!variable) {
      console.log('Variable is required for the condition');
      return '';
    }
    if (!value) {
      console.log('Value is required for the condition');
      return '';
    }

    return `${variable} ${this.condition} ${value}`;
  }

  getCondition(): string {
    return this.condition;
  }

}
