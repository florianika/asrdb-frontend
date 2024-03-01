import { ICondition } from './ICondition';

export class NullCondition implements ICondition {
  id: string;
  condition = 'isnull()';
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
