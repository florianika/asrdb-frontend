import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, Observer } from 'rxjs';
import { environment } from 'src/environments/environment';

export type SignupForm = FormGroup<{
    email: FormControl<string | null>;
    firstName: FormControl<string | null>;
    lastName: FormControl<string | null>;
    password: FormControl<string | null>;
    confirmPassword: FormControl<string | null>;
    municipality: FormControl<string | null>;
}>;

export type SignupFormValue = Partial<{
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  municipality: string;
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
      firstName: new FormControl('', [Validators.required, Validators.pattern(/^[a-z]+$/i)]),
      lastName: new FormControl('', [Validators.pattern(/^[a-z]+$/i)]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
      municipality: new FormControl('', [Validators.required]),
    });
  }

  signup(signupForm: SignupFormValue) {
    this.signingUp.next(true);
    const data = {
      name: signupForm.firstName,
      lastName: signupForm.lastName ?? '',
      email: signupForm.email,
      password: signupForm.password,
      municipalityCode: signupForm.municipality
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
