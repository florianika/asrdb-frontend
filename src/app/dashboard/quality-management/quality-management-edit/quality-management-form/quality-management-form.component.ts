import { Component, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { EntityType, QualityAction, QualityRule, RuleStatus } from '../../quality-management-config';

@Component({
  selector: 'asrdb-quality-management-form',
  templateUrl: './quality-management-form.component.html',
  styleUrls: ['./quality-management-form.component.css']
})
export class QualityManagementFormComponent {
  @Input() rule?: QualityRule;
  @Input() qualityType!: EntityType;

  public firstFormGroup = new FormGroup({
    localId: new FormControl<string>(this.rule?.localId ?? '', [Validators.required]),
    entityType: new FormControl<EntityType>({value: this.rule?.entityType ?? 'BUILDING', disabled: true}, [Validators.required]),
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
  });
}
