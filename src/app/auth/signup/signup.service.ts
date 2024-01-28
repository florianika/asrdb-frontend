import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, Observer } from 'rxjs';
import { environment } from 'src/environments/environment';

export type SignupForm = FormGroup<{
    email: FormControl<string | null>;
    fullName: FormControl<string | null>;
    password: FormControl<string | null>;
    confirmPassword: FormControl<string | null>;
}>;

export type SignupFormValue = Partial<{
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}>;

@Injectable()
export class SignupService {
  private signingUp = new BehaviorSubject(false);
  private signupObserver = {
    next: (response) => {
      this.signingUp.next(false);
      this.router.navigateByUrl('/auth/signin');
    },
    error: (error) => {
      this.signingUp.next(false);
      console.error(error);
      this.matSnack.open('Could not sign up. Please try again later', 'Ok', {
        duration: 3000
      });
    }
  } as Observer<any>;

  constructor(private httpClient: HttpClient, private router: Router, private matSnack: MatSnackBar) { }

  createSignupForm(): SignupForm {
    return new FormGroup({
      email: new FormControl('', [Validators.email, Validators.required]),
      fullName: new FormControl('', [Validators.required, Validators.pattern(/^[a-z][a-z]+(?: [a-z][a-z]+)+$/i)]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    });
  }

  signup(signupForm: SignupFormValue) {
    this.signingUp.next(true);
    const nameArray = signupForm.fullName!.split(' ');
    const data = {
      name: nameArray[0],
      lastName: nameArray[1],
      email: signupForm.email,
      password: signupForm.password
    };
    this.httpClient.post<any>(environment.base_url + '/auth/signup', JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json'
      }
    }).subscribe(this.signupObserver);
  }

  get signingUpAsObservable() {
    return this.signingUp.asObservable();
  }
}
