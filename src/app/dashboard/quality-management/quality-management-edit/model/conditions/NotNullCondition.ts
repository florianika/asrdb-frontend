import { Condition, ICondition } from './ICondition';

export class NotNullCondition implements ICondition {
  id: string;
  condition = 'isNull()';
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
      console.log('Variable is required for the condition');
      return '';
    }

    return `not ${variable}.${this.condition}`;
  }

  getCondition(): string {
    return this.condition;
  }

}
