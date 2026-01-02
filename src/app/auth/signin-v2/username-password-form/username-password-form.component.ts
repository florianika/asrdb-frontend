import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  MatFormField,
  MatLabel,
  MatPrefix,
  MatSuffix,
} from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { SigninV2Service } from '../signin-v2.service';

@Component({
  selector: 'asrdb-username-password-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatIcon,
    MatSuffix,
    MatPrefix,
    MatButton,
  ],
  templateUrl: './username-password-form.component.html',
  styleUrl: './username-password-form.component.css',
})
export class UsernamePasswordFormComponent {
  @Input() form!: FormGroup;
  @Output() proceed = new EventEmitter();
  public signinService = inject(SigninV2Service);

  public showPassword: boolean = false;

  submitForm() {
    this.proceed.emit();
  }
}
