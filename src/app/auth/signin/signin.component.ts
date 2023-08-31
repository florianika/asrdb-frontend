import { Component, OnDestroy, OnInit } from '@angular/core';
import { SigninService } from './signin.service';
import { FormGroup, FormControl } from '@angular/forms';
import { AuthStateService } from 'src/app/common/services/auth-state.service';
import { Router } from '@angular/router';
import { Subscriber, Subscription } from 'rxjs';

@Component({
  selector: 'asrdb-signin',
  templateUrl: './signin.component.html',
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-box-pack: center;
      justify-content: center;
    }
    .login-card {
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
    .login-card-title {
      text-align: center;
      color: black;
    }
    .login-card-create-account {
      cursor: pointer;
      text-align: right;
      padding-top: 20px;
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
export class SigninComponent implements OnInit, OnDestroy {
  loading = false;
  hiddenPassword = true;
  signinFormGroup: FormGroup<{
    email: FormControl<string | null>;
    password: FormControl<string | null>;
  }>;

  private loginStateSubscriber?: Subscription;

  constructor(private signinService: SigninService, private authStateService: AuthStateService, private router: Router) {
    this.signinFormGroup = this.signinService.createSigninForm();
  }

  ngOnDestroy(): void {
    this.loginStateSubscriber?.unsubscribe();
  }

  ngOnInit(): void {
    this.loginStateSubscriber = this.authStateService.getLoginStateAsObservable().subscribe(state => {
      this.loading = false;
      if (state) {
        this.router.navigateByUrl('/dashboard');
      }
    })
  }

  signin() {
    this.loading = true;
    this.signinService.signin(this.signinFormGroup.value);
  }
}
