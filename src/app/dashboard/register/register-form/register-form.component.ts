import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { BuildingCreationComponent } from './building-creation/building-creation.component';
import { BuildingDetailsFormComponent } from './building-details-form/building-details-form.component';
import { EntranceCreationComponent } from './entrance-creation/entrance-creation.component';
import { EntranceDetailsFormComponent } from './entrance-details-form/entrance-details-form.component';
import { CommonBuildingService } from '../service/common-building.service';
import { CommonEntranceService } from '../service/common-entrance.service';
import { of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'asrdb-register-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    BuildingCreationComponent,
    BuildingDetailsFormComponent,
    EntranceCreationComponent,
    EntranceDetailsFormComponent,
    MatButtonModule
  ],
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css']
})
export class RegisterFormComponent implements OnInit{
  isSaving = of(false);
  constructor(private buildingService: CommonBuildingService, private entranceService: CommonEntranceService) {
  }

  ngOnInit(): void {
    this.buildingService.getAttributesMetadata().subscribe((fileds: any[]) => {
      fileds.forEach(field => {
        this.buildingDetails.addControl(field.name, new FormControl());
      });
    });
    this.entranceService.getAttributesMetadata().subscribe((fileds: any[]) => {
      fileds.forEach(field => {
        this.entranceDetails.addControl(field.name, new FormControl());
      });
    });
  }

  buildingPoly = new FormGroup({
    buildingPoly: new FormControl(null, [Validators.required]),
    mapPoint: new FormControl([], [Validators.required, Validators.minLength(1)])
  });

  buildingDetails = new FormGroup({

  });

  entranceDetails = new FormGroup({

  });

  reset(stepper: MatStepper) {
    console.log(stepper);
  }

  save() {
    console.log();
  }
}
