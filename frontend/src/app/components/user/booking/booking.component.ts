import { Component, OnInit, inject, signal, WritableSignal, Signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../../../services/patient/patient.service';
import { Appointment } from '../../../models/appointment';
import { CalendarComponentComponent } from '../../shared/calendar-component/calendar-component.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import {
  LanguageService,
  TranslationLanguage,
  TranslationSection,
  TranslationValue,
} from '../../../services/language/language-service.service';
import { ToastService } from '../../../services/toast/toast-service.service';

@Component({
  selector: 'mg-booking',
  standalone: true,
  imports: [CommonModule, CalendarComponentComponent, ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent implements OnInit {
  private authService: AuthService = inject(AuthService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private fb: FormBuilder = inject(FormBuilder);
  public router: Router = inject(Router);
  private patientService: PatientService = inject(PatientService);
  public langService: LanguageService = inject(LanguageService);
  private toastService: ToastService = inject(ToastService);

  public appointments: WritableSignal<Appointment[]> = signal<Appointment[]>([]);
  public selectedSlot: WritableSignal<Appointment | null> = signal<Appointment | null>(null);
  public doctorId: string = '';

  public bookingFormGroup!: FormGroup<{
    reason_for_visit: FormControl<string | null>;
    previous_treatment: FormControl<boolean | null>;
    additional_notes: FormControl<string | null>;
  }>;

  public t: Signal<TranslationLanguage> = computed(() => this.langService.t());

  public ngOnInit(): void {
    const id: string | null = this.route.snapshot.paramMap.get('doctorId');
    if (id) {
      this.doctorId = id;
      this.loadAppointments();
    }
    this.initForm();
  }

  private initForm(): void {
    this.bookingFormGroup = this.fb.group({
      reason_for_visit: this.fb.control<string | null>('', [
        Validators.required,
        Validators.minLength(3),
      ]),
      previous_treatment: this.fb.control<boolean | null>(false),
      additional_notes: this.fb.control<string | null>(''),
    });
  }

  private getTranslation(sectionKey: string, valueKey: string, fallback: string): string {
    const trans: TranslationLanguage = this.langService.t();
    const section: TranslationSection = trans[sectionKey];
    const val: TranslationValue = section[valueKey];

    return typeof val === 'string' ? val : fallback;
  }

  public loadAppointments(): void {
    this.patientService.getDoctorAppointments(this.doctorId).subscribe({
      next: (data: Appointment[]) => this.appointments.set(data),
      error: () => {
        const errorMsg: string = this.getTranslation(
          'notifications',
          'loadAppointmentsError',
          'Error',
        );
        this.toastService.show(errorMsg, 'error');
      },
    });
  }

  public handleSlotClick(appt: Appointment): void {
    if (appt.status !== 'available') {
      return;
    }

    if (!this.authService.isLoggedIn()) {
      const loginMsg: string = this.getTranslation('booking', 'loginRequired', 'Login required');
      this.toastService.show(loginMsg, 'warning');
      void this.router.navigate(['/login']);

      return;
    }

    this.bookingFormGroup.reset({
      reason_for_visit: '',
      previous_treatment: false,
      additional_notes: '',
    });
    this.selectedSlot.set(appt);
  }

  public confirmBooking(): void {
    if (this.bookingFormGroup.invalid) {
      this.bookingFormGroup.markAllAsTouched();
      this.toastService.show('Proszę poprawnie wypełnić powód wizyty', 'warning');

      return;
    }

    const slot: Appointment | null = this.selectedSlot();
    if (slot?._id) {
      const formValue = this.bookingFormGroup.getRawValue();

      // Naprawiono: Poprawne otypowanie zamiast 'any' oraz bezpieczny dostęp do Partial<Appointment>
      const payload: Partial<Appointment> = {
        details: {
          reason_for_visit: formValue.reason_for_visit ?? '',
          previous_treatment: formValue.previous_treatment ?? false,
          additional_notes: formValue.additional_notes ?? '',
        },
      };

      this.patientService.bookVisit(slot._id, payload).subscribe({
        next: () => {
          this.toastService.show(
            this.getTranslation('notifications', 'bookingSuccess', 'Success'),
            'success',
          );
          this.selectedSlot.set(null);
          this.loadAppointments();
        },
        error: (err: { error?: { detail?: string } }) => {
          const defaultErr: string = this.getTranslation('notifications', 'bookingError', 'Error');
          const msg: string = err.error?.detail || defaultErr;
          this.toastService.show(msg, 'error');
        },
      });
    }
  }

  public closeModal(): void {
    this.selectedSlot.set(null);
  }

  public goBack(): void {
    void this.router.navigate(['/user/doctors']);
  }
}
