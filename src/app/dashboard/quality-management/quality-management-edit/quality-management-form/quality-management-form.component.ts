import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { EntityType, QualityAction, QualityRule, RuleStatus } from '../../quality-management-config';
import { QualityManagementService } from '../../quality-management.service';
import { MatStepper } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'asrdb-quality-management-form',
  templateUrl: './quality-management-form.component.html',
  styleUrls: ['./quality-management-form.component.css']
})
export class QualityManagementFormComponent {
  @Input() rule?: QualityRule;
  @Input() qualityType!: EntityType;
  @Input() id?: string | null;

  @ViewChild('resetDialog') resetDialog!: TemplateRef<any>;

  public isSaving = this.qualityManagementService.isSavingAsObservable;

  constructor(private qualityManagementService: QualityManagementService, private matDialog: MatDialog) { }

  public firstFormGroup = new FormGroup({
    localId: new FormControl<string>(this.rule?.localId ?? '', [Validators.required]),
    entityType: new FormControl<EntityType>({ value: this.rule?.entityType ?? 'BUILDING', disabled: true }, [Validators.required]),
    variable: new FormControl<string>(this.rule?.variable ?? '', [Validators.required]),
    nameAl: new FormControl<string>(this.rule?.nameAl ?? '', [Validators.required]),
    nameEn: new FormControl<string>(this.rule?.nameEn ?? ''),
    descriptionAl: new FormControl<string>(this.rule?.descriptionAl ?? ''),
    descriptionEn: new FormControl<string>(this.rule?.descriptionEn ?? ''),
  }, { updateOn: 'blur' });

  public secondFormGroup = new FormGroup({
    qualityAction: new FormControl<QualityAction>(this.rule?.qualityAction ?? 'AUT', [Validators.required]),
    qualityStatus: new FormControl<RuleStatus>(this.rule?.ruleStaus ?? 'ACTIVE', [Validators.required]),
    ruleRequirement: new FormControl<string>(this.rule?.localId ?? ''),
    remark: new FormControl<string>(this.rule?.ruleRequirement ?? ''),
    qualityMessageAl: new FormControl<string>(this.rule?.qualityMessageAl ?? '', [Validators.required]),
    qualityMessageEn: new FormControl<string>(this.rule?.qualityMessageEn ?? '', [Validators.required]),
  }, { updateOn: 'blur' });

  public thirdFormGroup = new FormGroup({
    expression: new FormControl<string>(this.rule?.expression ?? '', [Validators.required])
  }, { updateOn: 'blur' });

  save() {
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
        }
      })
  }
}
