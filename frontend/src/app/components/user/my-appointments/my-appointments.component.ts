import { Component, OnInit, inject, signal, computed, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PatientService } from '../../../services/patient/patient.service';
import { Appointment } from '../../../models/appointment';
import { MedicalHistory } from '../../../models/medical-history';
import {
  LanguageService,
  TranslationSection,
  TranslationValue,
  TranslationLanguage,
} from '../../../services/language/language-service.service';
import { ToastService } from '../../../services/toast/toast-service.service';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';

@Component({
  selector: 'mg-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmModalComponent],
  templateUrl: './my-appointments.component.html',
  styleUrl: './my-appointments.component.scss',
})
export class MyAppointmentsComponent implements OnInit {
  private patientService: PatientService = inject(PatientService);
  public langService: LanguageService = inject(LanguageService);
  private toastService: ToastService = inject(ToastService);

  public appointments: WritableSignal<Appointment[]> = signal<Appointment[]>([]);
  public fullHistory: WritableSignal<MedicalHistory[]> = signal<MedicalHistory[]>([]);

  public isCancelModalOpen: WritableSignal<boolean> = signal(false);
  public appointmentIdToCancel: WritableSignal<string | null> = signal<string | null>(null);

  public expandedVisitIds: WritableSignal<Set<string>> = signal(new Set<string>());
  public expandedSidebarId: WritableSignal<string | null> = signal<string | null>(null);

  public t: Signal<TranslationLanguage> = computed(() => this.langService.t());

  public upcoming: Signal<Appointment[]> = computed(() =>
    this.appointments().filter((a: Appointment) => a.status === 'booked'),
  );

  public completed: Signal<Appointment[]> = computed(() =>
    this.appointments().filter((a: Appointment) => a.status === 'completed'),
  );

  public ngOnInit(): void {
    this.loadData();
  }

  private getTranslation(sectionKey: string, valueKey: string, fallback: string): string {
    const section: TranslationSection = this.t()[sectionKey];
    const val: TranslationValue = section[valueKey];

    // Usunięto 'as string', ponieważ typeof val === 'string' automatycznie zawęża typ (Type Guard)
    return typeof val === 'string' ? val : fallback;
  }

  public loadData(): void {
    this.patientService.getMyAppointments().subscribe({
      next: (data: Appointment[]) => this.appointments.set(data),
      error: () => {
        const msg: string = this.getTranslation('notifications', 'loadAppointmentsError', 'Error');
        this.toastService.show(msg, 'error');
      },
    });

    this.patientService.getFullHistory().subscribe({
      next: (data: MedicalHistory[]) => this.fullHistory.set(data),
      error: () => {
        const msg: string = this.getTranslation('notifications', 'loadHistoryError', 'Error');
        this.toastService.show(msg, 'error');
      },
    });
  }

  public toggleVisitHistory(appointmentId: string): void {
    this.expandedVisitIds.update((prev: Set<string>) => {
      const next: Set<string> = new Set<string>(prev);
      if (next.has(appointmentId)) {
        next.delete(appointmentId);
      } else {
        next.add(appointmentId);
      }

      return next;
    });
  }

  public toggleSidebarHistory(id: string): void {
    this.expandedSidebarId.set(this.expandedSidebarId() === id ? null : id);
  }

  public openCancelModal(id: string): void {
    this.appointmentIdToCancel.set(id);
    this.isCancelModalOpen.set(true);
  }

  public handleCancelConfirm(): void {
    const id: string | null = this.appointmentIdToCancel();
    if (id) {
      this.patientService.cancelVisit(id).subscribe({
        next: () => {
          const msg: string = this.getTranslation('notifications', 'cancelSuccess', 'Success');
          this.toastService.show(msg, 'success');
          this.isCancelModalOpen.set(false);
          this.loadData();
        },
        error: (err: { error?: { detail?: string } }) => {
          const defaultErr: string = this.getTranslation('notifications', 'cancelError', 'Error');
          const msg: string = err.error?.detail || defaultErr;
          this.toastService.show(msg, 'error');
          this.isCancelModalOpen.set(false);
        },
      });
    }
  }
}
