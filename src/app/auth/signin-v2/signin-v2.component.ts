import { Component, inject, ViewChild } from '@angular/core';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsernamePasswordFormComponent } from './username-password-form/username-password-form.component';
import { TwoFaTokenVerifyComponent } from './two-fa-token-verify/two-fa-token-verify.component';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { SigninV2Service } from './signin-v2.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'asrdb-signin-v2',
    imports: [
        MatStepperModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        UsernamePasswordFormComponent,
        TwoFaTokenVerifyComponent,
        MatCard,
        MatCardContent,
        MatCardTitle,
        ReactiveFormsModule,
        RouterLink,
    ],
    providers: [SigninV2Service],
    templateUrl: './signin-v2.component.html',
    styleUrl: './signin-v2.component.css'
})
export class SigninV2Component {
  @ViewChild(MatStepper) stepper!: MatStepper;
  private signinService = inject(SigninV2Service);

  public usernamePasswordFormGroup = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });
  public tokenVerifyFormGroup = new FormGroup({
    token: new FormControl('', [Validators.required]),
  });

  public onUsernamePasswordProceed() {
    if (
      this.usernamePasswordFormGroup.invalid ||
      this.signinService.loginSignal().isLoggingIn
    ) {
      return;
    }

    this.signinService
      .login(
        this.usernamePasswordFormGroup.value.username ?? '',
        this.usernamePasswordFormGroup.value.password ?? ''
      )
      .subscribe(isLoggedIn => {
        if (isLoggedIn) {
          this.stepper.next();
        }
      });
  }

  public onTokenVerifyProceed() {
    if (
      this.tokenVerifyFormGroup.invalid ||
      this.signinService.verify2FASignal().isVerifying
    ) {
      return;
    }

    this.signinService
      .verify2FA(this.tokenVerifyFormGroup.value.token ?? '')
      .subscribe();
  }
}
