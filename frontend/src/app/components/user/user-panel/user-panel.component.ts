import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { LanguageService } from '../../../services/language/language-service.service';

@Component({
  selector: 'mg-user-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-panel.component.html',
  styleUrl: './user-panel.component.scss',
})
export class UserPanelComponent {
  public authService: AuthService = inject(AuthService);
  public langService: LanguageService = inject(LanguageService);

  /**
   * Metoda sprawdzająca stan zalogowania, wymagana przez szablon HTML
   */
  public isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
