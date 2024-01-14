import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Condition, ConditionsMap, ICondition } from '../../model/conditions/ICondition';
import { ExpressionForm, Operator } from '../../model/quality-expression';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'asrdb-expression-form',
  templateUrl: './expression-form.component.html',
  styleUrls: ['./expression-form.component.css']
})
export class ExpressionFormComponent {
  @Input() rule?: FormGroup;
  @Input() showOperator?: boolean;
  @Input() showDeleteButton: boolean = false;
  @Output() removeExpression = new EventEmitter<Partial<ExpressionForm>>();

  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  consdition = Condition;
  operator = Operator;

  constructor(private matDialog: MatDialog) {
  }

  getCondition(condition: Condition) {
    return ConditionsMap.get(condition);
  }

  openDeleteConditionDialog() {
    this.matDialog
      .open(this.deleteDialog)
      .afterClosed()
      .subscribe(response => {
        if (response) {
          this.removeExpression.emit(this.rule?.value);
        }
      }
      );
  }
}