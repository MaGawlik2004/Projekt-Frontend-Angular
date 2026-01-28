import { Component, inject, signal, OnInit, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import {
  LanguageService,
  TranslationLanguage,
  TranslationSection,
  TranslationValue,
} from '../../../services/language/language-service.service';
import { ToastService } from '../../../services/toast/toast-service.service';

@Component({
  selector: 'mg-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  public langService: LanguageService = inject(LanguageService);
  private toastService: ToastService = inject(ToastService);

  public registerForm!: FormGroup<{
    full_name: FormControl<string | null>;
    email: FormControl<string | null>;
    password: FormControl<string | null>;
  }>;

  public isLoading: WritableSignal<boolean> = signal(false);

  public ngOnInit(): void {
    this.registerForm = this.fb.group({
      full_name: this.fb.control<string | null>(null, [
        Validators.required,
        Validators.minLength(3),
      ]),
      email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
      password: this.fb.control<string | null>(null, [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
  }

  /**
   * Pomocnicza metoda do bezpiecznego pobierania tekstów tłumaczeń
   */
  private getTranslation(sectionKey: string, key: string, fallback: string): string {
    const trans: TranslationLanguage = this.langService.t();
    const section: TranslationSection = trans[sectionKey];
    const value: TranslationValue = section[key];

    return typeof value === 'string' ? value : fallback;
  }

  public handleRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      return;
    }

    this.isLoading.set(true);

    const registerData = {
      full_name: this.registerForm.controls.full_name.value ?? '',
      email: this.registerForm.controls.email.value ?? '',
      password: this.registerForm.controls.password.value ?? '',
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        const msg: string = this.getTranslation('notifications', 'registerSuccess', 'Success');
        this.toastService.show(msg, 'success');
        void this.router.navigate(['/login']);
      },
      error: (err: { error?: { detail?: string } }) => {
        const defaultErr: string = this.getTranslation('register', 'defaultError', 'Error');
        const errorMsg: string = err.error?.detail || defaultErr;
        this.toastService.show(errorMsg, 'error');
        this.isLoading.set(false);
      },
    });
  }
}
