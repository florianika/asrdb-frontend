import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { SignupForm, SignupFormValue, SignupService } from './signup.service';

@Component({
  selector: 'asrdb-signup',
  templateUrl: './signup.component.html',
  styles: [`
  .signup-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    -webkit-box-pack: center;
    justify-content: center;
  }
  .signup-card {
    display: flex;
    flex-direction: column;
    margin: 0px auto;
    width: 400px;
    padding: 32px 40px;
    background: rgb(255, 255, 255);
    border-radius: 3px;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 0px 10px;
    box-sizing: border-box;
    color: rgb(94, 108, 132);
    max-width: 95%;
  }
  .signup-card-title {
    text-align: center;
    color: black;
  }
  .signup-card-create-account {
    cursor: pointer;
    text-align: right;
    padding-top: 20px;
  }
  .signup-card-create-account:hover {
    text-decoration: underline;
  }
  .signup-card-logo {
    margin-bottom: 35px;
    width: 75%;
    margin-left: auto;
    margin-right: auto;
  }
  .signup-card-logo-small {
    margin-top: 10px;
    width: 35%;
    margin-left: auto;
    margin-right: auto;
  }
  .signup-card-content {
    padding-top: 20px;
    padding-left: 0;
    padding-right: 0;
  }
  .signup-card-password-hint {
    margin-bottom: 10px;
    font-size: 12px;
    margin-top: -20px;
    display: inline-block;
  }
`]
})
export class SignupComponent {
  hiddenPassword = true;
  hiddenRetypePassword = true;
  loading = this.signupService.signingUpAsObservable;
  signupFormGroup: SignupForm;

  constructor(private signupService: SignupService) {
    this.signupFormGroup = this.signupService.createSignupForm();
  }

  signup() {
    if (!this.signupFormGroup.invalid) {
      this.signupService.signup(this.signupFormGroup.value as SignupFormValue);
    }
  }
}
