import { Component } from '@angular/core';
import { SigninService } from './signin.service';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'asrdb-signin',
  templateUrl: './signin.component.html',
  styles: [`
    .login-container {
      min-height: 100%;
      min-width: 100%;
      display: flex;
      flex-direction: column;
      -webkit-box-pack: center;
      justify-content: center;
    }

    .login-card {
      display: flex;
      flex-direction: column;
      margin: 0 auto;
      width: 400px;
      padding: 32px 40px;
      background: rgb(255, 255, 255);
      border-radius: 3px;
      box-shadow: rgba(0, 0, 0, 0.1) 0 0 10px;
      box-sizing: border-box;
      color: rgb(94, 108, 132);
      max-width: 95%;
    }

    .login-card-title {
      text-align: center;
      color: black;
    }

    .login-card-create-account {
      cursor: pointer;
      text-align: right;
      margin-top: 20px;
    }

    .login-card-create-account:hover {
      text-decoration: underline;
    }

    .login-card-logo {
      margin-bottom: 35px;
      width: 75%;
      margin-left: auto;
      margin-right: auto;
    }

    .login-card-logo-small {
      margin-top: 10px;
      width: 35%;
      margin-left: auto;
      margin-right: auto;
    }

    .login-card-content {
      padding-top: 20px;
      padding-left: 0;
      padding-right: 0;
    }

    .login-card-forgot-password {
      cursor: pointer;
      text-align: right;
      margin-top: -15px;
      margin-bottom: 25px;
      z-index: 4;
      position: relative;
    }

    .login-card-forgot-password:hover {
      text-decoration: underline;
    }
  `]
})
export class SigninComponent {
  loading = this.signinService.signingInAsObservable;
  hiddenPassword = true;
  signinFormGroup: FormGroup<{
    email: FormControl<string | null>;
    password: FormControl<string | null>;
  }>;

  constructor(private signinService: SigninService) {
    this.signinFormGroup = this.signinService.createSigninForm();
  }

  signin() {
    this.signinService.signin(this.signinFormGroup.value);
  }

}
