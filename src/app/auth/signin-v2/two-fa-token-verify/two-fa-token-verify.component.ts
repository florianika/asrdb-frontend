import {Component, EventEmitter, inject, Input, OnDestroy, Output} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { SigninV2Service } from '../signin-v2.service';

@Component({
  selector: 'asrdb-two-fa-token-verify',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInput,
    MatFormField,
    MatLabel,
    MatIcon,
    MatButton,
  ],
  templateUrl: './two-fa-token-verify.component.html',
  styleUrl: './two-fa-token-verify.component.css',
})
export class TwoFaTokenVerifyComponent implements OnDestroy {
  @Input() form!: FormGroup;
  @Output() proceed = new EventEmitter();

  public signinService = inject(SigninV2Service);

  ngOnDestroy() {
    this.proceed.unsubscribe();
  }

  checkToken() {
    this.proceed.emit();
  }
}
