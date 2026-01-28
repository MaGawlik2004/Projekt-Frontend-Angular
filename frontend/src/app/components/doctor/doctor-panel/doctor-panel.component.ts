import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../../services/language/language-service.service';

@Component({
  selector: 'mg-doctor-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './doctor-panel.component.html',
  styleUrl: './doctor-panel.component.scss',
})
export class DoctorPanelComponent {
  public langService = inject(LanguageService);
}
