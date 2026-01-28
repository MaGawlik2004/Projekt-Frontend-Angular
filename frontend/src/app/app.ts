import { Component, signal, inject, WritableSignal } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth/auth.service';
import { LanguageService } from './services/language/language-service.service';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  selector: 'mg-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent {
  protected readonly title: WritableSignal<string> = signal('frontend');
  private router: Router = inject(Router);
  public authService: AuthService = inject(AuthService);
  public langService: LanguageService = inject(LanguageService);

  public isDarkMode: WritableSignal<boolean> = signal(false);

  public constructor() {
    const savedTheme: string | null = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.setDarkMode(true);
    }
  }

  public toggleTheme(): void {
    this.setDarkMode(!this.isDarkMode());
  }

  private setDarkMode(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    if (isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  public toggleLanguage(): void {
    const newLang: 'pl' | 'en' = this.langService.currentLang() === 'pl' ? 'en' : 'pl';
    this.langService.setLanguage(newLang);
  }

  public isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  public logout(): void {
    this.authService.logout();
    void this.router.navigate(['/']);
  }
}
