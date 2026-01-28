import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { Appointment } from '../../../models/appointment';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { CalendarComponentComponent } from '../../shared/calendar-component/calendar-component.component';
import {
  LanguageService,
  TranslationLanguage,
  TranslationSection,
  TranslationValue,
} from '../../../services/language/language-service.service';
import { ToastService } from '../../../services/toast/toast-service.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'mg-doctor-schedule',
  standalone: true,
  imports: [CommonModule, CalendarComponentComponent],
  templateUrl: './doctor-schedule.component.html',
  styleUrl: './doctor-schedule.component.scss',
})
export class DoctorScheduleComponent implements OnInit {
  private doctorService: DoctorService = inject(DoctorService);
  private router: Router = inject(Router);
  public langService: LanguageService = inject(LanguageService);
  private toastService: ToastService = inject(ToastService);
  public authService: AuthService = inject(AuthService);

  public appointments: WritableSignal<Appointment[]> = signal<Appointment[]>([]);

  public ngOnInit(): void {
    this.doctorService.getSchedule().subscribe({
      next: (data: Appointment[]) => this.appointments.set(data),
      error: () => {
        const msg: string = this.getNotificationMsg('fetchScheduleError', 'Error');
        this.toastService.show(msg, 'error');
      },
    });
  }

  /**
   * Pomocnicza metoda do bezpiecznego pobierania tekstów powiadomień
   */
  private getNotificationMsg(key: string, fallback: string): string {
    const trans: TranslationLanguage = this.langService.t();
    const section: TranslationSection = trans['notifications'];
    const value: TranslationValue = section[key];

    return typeof value === 'string' ? value : fallback;
  }

  public onAppointmentClick(appt: Appointment): void {
    if (!this.authService.isActive()) {
      const msg: string = this.langService.translate(
        'Twoje konto jest zawieszone. Możliwość edycji wizyt została zablokowana.',
        'Your account is suspended. Access to visit editing is disabled.',
      );
      this.toastService.show(msg, 'warning');

      return;
    }

    if (appt.status === 'booked' || appt.status === 'completed') {
      void this.router.navigate(['/doctor/visit', appt._id]);
    } else {
      const msg: string = this.getNotificationMsg('slotNotBooked', 'Slot not booked');
      this.toastService.show(msg, 'info');
    }
  }
}
