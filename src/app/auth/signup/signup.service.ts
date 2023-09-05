import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Observer } from 'rxjs';
import { AuthStateService } from 'src/app/common/services/auth-state.service';
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

  constructor(private httpClient: HttpClient, private router: Router) { }

  createSignupForm(): SignupForm {
    return new FormGroup({
      email: new FormControl('', [Validators.email, Validators.required]),
      fullName: new FormControl('', [Validators.required, Validators.pattern(/^[a-z][a-z]+(?: [a-z][a-z]+)+$/i)]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    });
  }

  signup(signupForm: SignupFormValue) {
    const formData = new FormData();
    const nameArray = signupForm.fullName!.split(' ');
    formData.append('name', nameArray[0]);
    formData.append('lastName', nameArray[1]);
    formData.append('email', signupForm.email!);
    formData.append('password', signupForm.password!);

    return new Observable(subscribe => {
      this.httpClient.post(environment.base_url + '/auth/signup', formData).subscribe({
        next: (response) => {
          subscribe.next(response);
          if (response) {
            this.router.navigateByUrl('/auth/signin');
          }
        },
        error: (error) => {
          console.error(error);
          subscribe.next();
        }
      });
    })
  }
}
