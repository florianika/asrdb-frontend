import { Component } from '@angular/core';
import {AsyncPipe} from "@angular/common";
import {MatButton} from "@angular/material/button";
import {MatCard, MatCardContent, MatCardTitle} from "@angular/material/card";
import {MatFormField, MatLabel, MatPrefix, MatSuffix} from "@angular/material/form-field";
import {MatIcon} from "@angular/material/icon";
import {MatInput} from "@angular/material/input";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {RouterLink} from "@angular/router";
import {ForgotPasswordService} from "./forgot-password.service";

@Component({
  selector: 'asrdb-forgot-password',
  standalone: true,
  imports: [
      AsyncPipe,
      MatButton,
      MatCard,
      MatCardContent,
      MatCardTitle,
      MatFormField,
      MatIcon,
      MatInput,
      MatLabel,
      MatPrefix,
      MatSuffix,
      ReactiveFormsModule,
      RouterLink
  ],
  providers: [ForgotPasswordService],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  loading = this.forgotPasswordService.isLoading$;
  hiddenPassword = true;
  forgotPassword: FormGroup<{
    email: FormControl<string | null>;
  }> = new FormGroup({
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
  });

  constructor(private forgotPasswordService: ForgotPasswordService) {}

  resetPassword() {
    if (this.forgotPassword.valid) {
      const email = this.forgotPassword.get('email')?.value;
      if (email) {
        this.forgotPasswordService.resetPassword(email);
      }
    }
  }
}
