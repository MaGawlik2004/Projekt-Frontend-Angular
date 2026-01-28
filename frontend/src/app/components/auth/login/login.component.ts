import { Component, inject, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../services/toast/toast-service.service';
import {
  LanguageService,
  TranslationLanguage,
  TranslationSection,
  TranslationValue,
} from '../../../services/language/language-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mg-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  public langService: LanguageService = inject(LanguageService);
  private toastService: ToastService = inject(ToastService);

  public loginForm!: FormGroup<{
    email: FormControl<string | null>;
    password: FormControl<string | null>;
  }>;

  public ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: this.fb.control<string | null>(null, [Validators.required, Validators.email]),
      password: this.fb.control<string | null>(null, [
        Validators.required,
        Validators.minLength(3),
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

  public onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      return;
    }

    const loginData = {
      email: this.loginForm.controls.email.value ?? '',
      password: this.loginForm.controls.password.value ?? '',
    };

    this.authService.login(loginData).subscribe({
      next: () => {
        const msg: string = this.getTranslation('notifications', 'loginSuccess', 'Success');
        this.toastService.show(msg, 'success');

        // POPRAWKA: Obsługa potencjalnego null z getRole()
        const role: string = this.authService.getRole() ?? '';

        if (role === 'admin') {
          void this.router.navigate(['/admin']);
        } else if (role === 'doctor') {
          void this.router.navigate(['/doctor']);
        } else {
          void this.router.navigate(['/user']);
        }
      },
      error: (err: { error?: { detail?: string } }) => {
        const defaultErr: string = this.getTranslation('auth', 'loginError', 'Error');
        const errorMsg: string = err.error?.detail || defaultErr;
        this.toastService.show(errorMsg, 'error');
      },
    });
  }
}
