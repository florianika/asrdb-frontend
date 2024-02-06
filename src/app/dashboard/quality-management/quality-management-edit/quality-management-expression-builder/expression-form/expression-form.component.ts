import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Condition, ConditionsMap, ICondition } from '../../model/conditions/ICondition';
import { ExpressionForm, Operator } from '../../model/quality-expression';
import { MatDialog } from '@angular/material/dialog';
import { EntityType } from '../../../quality-management-config';

@Component({
  selector: 'asrdb-expression-form',
  templateUrl: './expression-form.component.html',
  styleUrls: ['./expression-form.component.css']
})
export class ExpressionFormComponent {
  @Input() rule?: FormGroup;
  @Input() showOperator?: boolean;
  @Input() showDeleteButton = false;
  @Input() entityType!: EntityType;
  @Output() removeExpression = new EventEmitter<string>();

  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  condition = Condition;
  operator = Operator;

  constructor(private matDialog: MatDialog) {
  }

  getCondition(condition: Condition): string {
    return ConditionsMap.get(condition)!.id;
  }

  openDeleteConditionDialog() {
    this.matDialog
      .open(this.deleteDialog)
      .afterClosed()
      .subscribe(response => {
        if (response) {
          this.removeExpression.emit(this.rule?.value.id);
        }
      }
    );
  }
}
