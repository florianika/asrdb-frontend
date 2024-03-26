import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { EntityType, QualityAction, QualityRule, RuleStatus } from '../../quality-management-config';
import { QualityManagementService } from '../../quality-management.service';
import { MatStepper } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import 'brace';
import 'brace/mode/sql.js';
import 'brace/theme/github';

@Component({
  selector: 'asrdb-quality-management-form',
  templateUrl: './quality-management-form.component.html',
  styleUrls: ['./quality-management-form.component.css']
})
export class QualityManagementFormComponent implements OnInit {
  @Input() rule?: QualityRule;
  @Input() qualityType!: EntityType;
  @Input() id?: string | null;

  @ViewChild('resetDialog') resetDialog!: TemplateRef<any>;
  @ViewChild('stepper') stepper!: MatStepper;

  public isSaving = this.qualityManagementService.isSavingAsObservable;
  public firstFormGroup!: FormGroup;
  public secondFormGroup!: FormGroup;
  public thirdFormGroup!: FormGroup;

  get existingExpression(): string {
    return this.rule?.expression ?? '';
  }

  constructor(
    private qualityManagementService: QualityManagementService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar
  ) {

  }

  ngOnInit(): void {
    this.firstFormGroup = new FormGroup({
      localId: new FormControl<string>({ value: this.rule?.localId ?? '', disabled: !!this.id }, [Validators.required]),
      entityType: new FormControl<EntityType>({ value: this.rule?.entityType ?? this.qualityType, disabled: true }, [Validators.required]),
      variable: new FormControl<string>(this.rule?.variable ?? '', [Validators.required]),
      nameAl: new FormControl<string>(this.rule?.nameAl ?? ''),
      nameEn: new FormControl<string>(this.rule?.nameEn ?? ''),
      descriptionAl: new FormControl<string>(this.rule?.descriptionAl ?? ''),
      descriptionEn: new FormControl<string>(this.rule?.descriptionEn ?? ''),
    }, { updateOn: 'blur' });

    this.secondFormGroup = new FormGroup({
      qualityAction: new FormControl<QualityAction>(this.rule?.qualityAction ?? 'AUT', [Validators.required]),
      ruleStatus: new FormControl<RuleStatus>(this.rule?.ruleStaus ?? 'ACTIVE', [Validators.required]),
      ruleRequirement: new FormControl<string>(this.rule?.ruleRequirement ?? ''),
      remark: new FormControl<string>(this.rule?.remark ?? ''),
      qualityMessageAl: new FormControl<string>(this.rule?.qualityMessageAl ?? '', [Validators.required]),
      qualityMessageEn: new FormControl<string>(this.rule?.qualityMessageEn ?? '', [Validators.required]),
    }, { updateOn: 'blur' });

    this.thirdFormGroup = new FormGroup({
      expression: new FormControl<string>(this.rule?.expression ?? '', [Validators.required])
    }, { updateOn: 'blur' });
  }

  updateExpression(event: string) {
    console.log(event)
    this.thirdFormGroup.setValue({
      'expression': event
    }, {
      emitEvent: false
    })
  }

  save() {
    if (this.firstFormGroup.invalid || this.secondFormGroup.invalid || this.thirdFormGroup.invalid) {
      this.matSnackBar.open('Please check the form for invalid fields marked in red', 'Ok', {
        duration: 5000
      });
      return;
    }
    const rule = {
      ...this.firstFormGroup.getRawValue(),
      ...this.secondFormGroup.getRawValue(),
      ...this.thirdFormGroup.getRawValue()
    } as any;
    if (this.id) {
      rule.id = this.id;
      this.qualityManagementService.update(rule, this.qualityType);
    } else {
      this.qualityManagementService.save(rule, this.qualityType);
    }
  }

  reset(stepper: MatStepper) {
    this.matDialog
      .open(this.resetDialog)
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          stepper.reset();
          this.firstFormGroup.setValue({
            localId: this.rule?.localId ?? '',
            entityType: this.rule?.entityType ?? this.qualityType,
            variable: this.rule?.variable ?? '',
            nameAl: this.rule?.nameAl ?? '',
            nameEn: this.rule?.nameEn ?? '',
            descriptionAl: this.rule?.descriptionAl ?? '',
            descriptionEn: this.rule?.descriptionEn ?? '',
          });
          this.secondFormGroup.setValue({
            qualityAction: this.rule?.qualityAction ?? 'AUT',
            ruleStatus: this.rule?.ruleStaus ?? 'ACTIVE',
            ruleRequirement: this.rule?.localId ?? '',
            remark: this.rule?.ruleRequirement ?? '',
            qualityMessageAl: this.rule?.qualityMessageAl ?? '',
            qualityMessageEn: this.rule?.qualityMessageEn ?? '',
          });
          this.thirdFormGroup.setValue({
            expression: this.rule?.expression ?? ''
          });
        }
      });
  }
}
