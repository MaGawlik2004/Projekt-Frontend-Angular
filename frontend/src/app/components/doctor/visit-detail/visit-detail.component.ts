import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { MedicalHistory } from '../../../models/medical-history';
import { FullAppointment } from '../../../models/appointment';
import {
  LanguageService,
  TranslationLanguage,
  TranslationSection,
  TranslationValue,
} from '../../../services/language/language-service.service';
import { ToastService } from '../../../services/toast/toast-service.service';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'mg-visit-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ConfirmModalComponent],
  templateUrl: './visit-detail.component.html',
  styleUrl: './visit-detail.component.scss',
})
export class VisitDetailComponent implements OnInit {
  private doctorService: DoctorService = inject(DoctorService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  public langService: LanguageService = inject(LanguageService);
  private toastService: ToastService = inject(ToastService);
  public authService: AuthService = inject(AuthService);

  public appointment: WritableSignal<FullAppointment | null> = signal<FullAppointment | null>(null);
  public history: WritableSignal<MedicalHistory[]> = signal<MedicalHistory[]>([]);
  public expandedHistoryId: WritableSignal<string | null> = signal<string | null>(null);
  public isConfirmModalOpen: WritableSignal<boolean> = signal(false);

  public visitForm!: FormGroup<{
    patient_id: FormControl<string | null>;
    appointment_id: FormControl<string | null>;
    diagnosis: FormControl<string | null>;
    treatment_notes: FormControl<string | null>;
    recommendationsInput: FormControl<string | null>;
  }>;

  public ngOnInit(): void {
    this.initForm();
    const apptId: string | null = this.route.snapshot.paramMap.get('id');
    if (apptId) {
      this.loadData(apptId);
    }
  }

  private initForm(): void {
    this.visitForm = this.fb.group({
      patient_id: this.fb.control<string | null>(null, Validators.required),
      appointment_id: this.fb.control<string | null>(null, Validators.required),
      diagnosis: this.fb.control<string | null>(null, [
        Validators.required,
        Validators.minLength(3),
      ]),
      treatment_notes: this.fb.control<string | null>(null, [
        Validators.required,
        Validators.minLength(5),
      ]),
      recommendationsInput: this.fb.control<string | null>(''),
    });

    if (!this.authService.isActive()) {
      this.visitForm.disable();
    }
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

  public loadData(apptId: string): void {
    this.doctorService.getAppointmentDetai(apptId).subscribe({
      next: (appt: FullAppointment) => {
        this.appointment.set(appt);

        this.visitForm.patchValue({
          appointment_id: appt.id,
          patient_id: appt.patient_id,
        });

        if (appt.status === 'completed') {
          this.visitForm.disable();
        }

        this.doctorService.getPatientHistory(appt.patient_id).subscribe((h: MedicalHistory[]) => {
          this.history.set(h);
        });
      },
      error: () => {
        const msg = this.getNotificationMsg('errorDefault', 'Error');
        this.toastService.show(msg, 'error');
      },
    });
  }

  public toggleHistory(id: string): void {
    this.expandedHistoryId.set(this.expandedHistoryId() === id ? null : id);
  }

  public onFinishVisitClick(): void {
    if (this.visitForm.invalid) {
      this.visitForm.markAllAsTouched();
      this.toastService.show(
        this.langService.translate(
          'Proszę poprawnie wypełnić kartę badania',
          'Please fill the exam card correctly',
        ),
        'warning',
      );

      return;
    }
    this.isConfirmModalOpen.set(true);
  }

  public submitVisit(): void {
    const formValue = this.visitForm.getRawValue();

    const recommendationsArray: string[] = formValue.recommendationsInput
      ? formValue.recommendationsInput
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s)
      : [];

    const payload = {
      patient_id: formValue.patient_id ?? '',
      appointment_id: formValue.appointment_id ?? '',
      diagnosis: formValue.diagnosis ?? '',
      treatment_notes: formValue.treatment_notes ?? '',
      recommendations: recommendationsArray,
    };

    this.doctorService.addMedicalHistory(payload).subscribe({
      next: () => {
        const msg = this.getNotificationMsg('visitSaveSuccess', 'Success');
        this.toastService.show(msg, 'success');
        this.isConfirmModalOpen.set(false);
        void this.router.navigate(['/doctor/schedule']);
      },
      error: (err: { error?: { detail?: string } }) => {
        const defaultErr = this.getNotificationMsg('visitSaveError', 'Error');
        const errorMsg: string = err.error?.detail || defaultErr;
        this.toastService.show(errorMsg, 'error');
        this.isConfirmModalOpen.set(false);
      },
    });
  }
}
