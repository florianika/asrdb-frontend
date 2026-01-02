import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import {
  MatFormField,
  MatLabel,
  MatPrefix,
  MatSuffix,
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ForgotPasswordService } from './forgot-password.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    ReactiveFormsModule,
    RouterLink,
    MatSuffix,
  ],
  providers: [ForgotPasswordService],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent implements OnInit {
  loading = this.forgotPasswordService.isLoading$;
  hiddenPassword = true;

  forgotPassword: FormGroup<{
    email: FormControl<string | null>;
    password: FormControl<string | null>;
  }> = new FormGroup({
    email: new FormControl<string | null>(null, [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl<string | null>(null, [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
      ),
    ]),
  });

  public token = '';

  constructor(
    private forgotPasswordService: ForgotPasswordService,
    private matSnackbar: MatSnackBar,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    const tokenQuery = this.activatedRoute.snapshot.queryParamMap.get('token');
    if (tokenQuery) {
      this.token = tokenQuery;
    }
  }

  sendResetPasswordEmail() {
    if (this.forgotPassword.valid) {
      const email = this.forgotPassword.get('email')?.value;
      if (email) {
        this.forgotPasswordService.sendResetPasswordEmail(email);
      }
    } else {
      this.matSnackbar.open(
        $localize`Please enter a valid email address.`,
        $localize`OK`,
        { duration: 5000 }
      );
    }
  }

  resetPassword() {
    if (this.forgotPassword.valid && this.token) {
      const password = this.forgotPassword.get('password')?.value;
      if (password) {
        this.forgotPasswordService.resetPassword(this.token, password);
      }
    } else {
      const message = !this.forgotPassword.valid
        ? $localize`Please ensure the form is valid before submitting.`
        : $localize`Invalid or missing token for password reset.`;

      this.matSnackbar.open(message, $localize`OK`, {
        duration: 5000,
      });
    }
  }

  handleSubmit() {
    if (this.token) {
      this.resetPassword();
    } else {
      this.sendResetPasswordEmail();
    }
  }

  toggleVisibility(event: Event) {
    event.preventDefault();
    this.hiddenPassword = !this.hiddenPassword;
  }
}
