import { ICondition } from './ICondition';

export class NotNullCondition implements ICondition {
  id: string;
  condition = 'notnull()';
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

  buildExpression(variable: string): string {
    if (!variable) {
      console.log('Variable is required for the condition');
      throw new Error('Variable is required');
    }

    return `${variable}.${this.condition}`;
  }

  getCondition(): string {
    return this.condition;
  }

}
