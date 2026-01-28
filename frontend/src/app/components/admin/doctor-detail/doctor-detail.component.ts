import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../services/admin/admin.service';
import { User } from '../../../models/user';
import { Appointment, BreakForm } from '../../../models/appointment';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormControl,
} from '@angular/forms';
import { CalendarComponentComponent } from '../../shared/calendar-component/calendar-component.component';
import {
  LanguageService,
  TranslationLanguage,
  TranslationSection,
  TranslationValue,
} from '../../../services/language/language-service.service';
import { ToastService } from '../../../services/toast/toast-service.service';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';

@Component({
  selector: 'mg-doctor-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CalendarComponentComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './doctor-detail.component.html',
  styleUrl: './doctor-detail.component.scss',
})
export class DoctorDetailComponent implements OnInit {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private adminService: AdminService = inject(AdminService);
  private fb: FormBuilder = inject(FormBuilder);
  public langService: LanguageService = inject(LanguageService);
  private toastService: ToastService = inject(ToastService);

  public doctor: WritableSignal<User | null> = signal<User | null>(null);
  public appointments: WritableSignal<Appointment[]> = signal<Appointment[]>([]);
  public activeModel: WritableSignal<'password' | 'activity' | 'schedule' | 'edit-appt' | null> =
    signal<'password' | 'activity' | 'schedule' | 'edit-appt' | null>(null);
  public selectedAppointment: WritableSignal<Appointment | null> = signal<Appointment | null>(null);
  public currentStep: WritableSignal<1 | 2> = signal<1 | 2>(1);

  public scheduleForm!: FormGroup<{
    start_time: FormControl<string | null>;
    end_time: FormControl<string | null>;
    interval_minutes: FormControl<number | null>;
    breaks: FormArray<FormGroup<BreakForm>>;
  }>;

  public passwordForm!: FormGroup<{
    newPassword: FormControl<string | null>;
  }>;

  public editApptForm!: FormGroup<{
    start: FormControl<string | null>;
    end: FormControl<string | null>;
  }>;

  public isConfirmModalOpen: WritableSignal<boolean> = signal(false);
  public confirmModalTitle: WritableSignal<string> = signal('');
  public confirmModalMessage: WritableSignal<string> = signal('');
  private activeConfirmAction: string = '';

  public ngOnInit(): void {
    const id: string | null = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDoctorData(id);
    }
    this.initForms();
  }

  private initForms(): void {
    this.scheduleForm = this.fb.group({
      start_time: this.fb.control<string | null>(null, Validators.required),
      end_time: this.fb.control<string | null>(null, Validators.required),
      interval_minutes: this.fb.control<number | null>(30, [
        Validators.required,
        Validators.min(5),
      ]),
      breaks: this.fb.array<FormGroup<BreakForm>>([]),
    });

    this.passwordForm = this.fb.group({
      newPassword: this.fb.control<string | null>(null, [
        Validators.required,
        Validators.minLength(6),
      ]),
    });

    this.editApptForm = this.fb.group({
      start: this.fb.control<string | null>(null, Validators.required),
      end: this.fb.control<string | null>(null, Validators.required),
    });
  }

  public get breaks(): FormArray<FormGroup<BreakForm>> {
    return this.scheduleForm.controls.breaks;
  }

  private getTranslation(sectionKey: string, key: string, fallback: string): string {
    const trans: TranslationLanguage = this.langService.t();
    const section: TranslationSection = trans[sectionKey];
    const value: TranslationValue = section[key];

    return typeof value === 'string' ? value : fallback;
  }

  private triggerConfirm(title: string, message: string, actionKey: string): void {
    this.confirmModalTitle.set(title);
    this.confirmModalMessage.set(message);
    this.activeConfirmAction = actionKey;
    this.isConfirmModalOpen.set(true);
  }

  public handleModalConfirmed(): void {
    this.isConfirmModalOpen.set(false);
    switch (this.activeConfirmAction) {
      case 'deleteAppointment':
        this.executeDeleteAppointment();
        break;
      case 'changePassword':
        this.executePasswordChange();
        break;
      case 'toggleActivity':
        this.executeToggleActivity();
        break;
    }
    this.activeConfirmAction = '';
  }

  public loadDoctorData(id: string): void {
    this.adminService.getDoctorById(id).subscribe({
      next: (data: User) => this.doctor.set(data),
      error: () => {
        const msg: string = this.getTranslation('notifications', 'errorDefault', 'Error');
        this.toastService.show(msg, 'error');
      },
    });
    this.adminService.getDoctorAppointments(id).subscribe({
      next: (data: Appointment[]) => this.appointments.set(data),
    });
  }

  public confirmDeleteAppointment(): void {
    const msg: string = this.getTranslation('notifications', 'confirmDeleteAppt', 'Confirm?');
    this.triggerConfirm(
      this.langService.translate('Usuwanie wizyty', 'Delete appointment'),
      msg,
      'deleteAppointment',
    );
  }

  private executeDeleteAppointment(): void {
    const appt: Appointment | null = this.selectedAppointment();
    const apptId: string | undefined = appt?._id;
    const doc: User | null = this.doctor();

    if (apptId && doc) {
      this.adminService.deleteAppointment(apptId).subscribe({
        next: () => {
          const msg: string = this.getTranslation('notifications', 'deleteApptSuccess', 'Success');
          this.toastService.show(msg, 'success');
          this.loadDoctorData(doc._id);
          this.closeModel();
        },
        error: (err: { error?: { detail?: string } }) => {
          this.toastService.show(err.error?.detail || 'Error', 'error');
        },
      });
    }
  }

  public confirmPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();

      return;
    }
    const title: string = this.getTranslation('doctorDetail', 'resetPass', 'Reset password');
    this.triggerConfirm(
      title,
      this.langService.translate('Czy na pewno chcesz zmienić hasło?', 'Are you sure?'),
      'changePassword',
    );
  }

  private executePasswordChange(): void {
    const doc: User | null = this.doctor();
    const newPass: string | null = this.passwordForm.getRawValue().newPassword;
    if (doc && newPass) {
      this.adminService.changeDoctorPassword(doc._id, newPass).subscribe({
        next: () => {
          const msg: string = this.getTranslation('notifications', 'passwordSuccess', 'Success');
          this.toastService.show(msg, 'success');
          this.closeModel();
        },
        error: (err: { error?: { detail?: string } }) => {
          this.toastService.show(err.error?.detail || 'Error', 'error');
        },
      });
    }
  }

  public confirmToggleActivity(): void {
    const title: string = this.getTranslation('doctorDetail', 'changeStatus', 'Status');
    const msg: string = this.getTranslation('doctorDetail', 'confirmStatus', 'Confirm?');
    this.triggerConfirm(title, msg, 'toggleActivity');
  }

  private executeToggleActivity(): void {
    const doc: User | null = this.doctor();
    if (doc) {
      this.adminService.toggleDoctorActivity(doc._id).subscribe({
        next: () => {
          const msg: string = this.getTranslation('notifications', 'statusSuccess', 'Success');
          this.toastService.show(msg, 'success');
          this.loadDoctorData(doc._id);
          this.closeModel();
        },
        error: () => {
          const msg: string = this.getTranslation('notifications', 'errorDefault', 'Error');
          this.toastService.show(msg, 'error');
        },
      });
    }
  }

  public goBack(): void {
    void this.router.navigate(['/admin']);
  }

  public openModel(type: 'password' | 'activity' | 'schedule'): void {
    this.activeModel.set(type);
    if (type === 'schedule') {
      this.currentStep.set(1);
      this.initForms();
    }
  }

  public closeModel(): void {
    this.activeModel.set(null);
    this.selectedAppointment.set(null);
    this.passwordForm.reset();
    this.editApptForm.reset();
    this.currentStep.set(1);
  }

  public onBulkStartTimeChange(): void {
    const startVal: string | null = this.scheduleForm.controls.start_time.value;
    if (startVal) {
      const start: Date = new Date(startVal);
      const end: Date = new Date(start.getTime() + 8 * 60 * 60 * 1000);
      this.scheduleForm.controls.end_time.setValue(this.formatToLocal(end.toISOString()));
    }
  }

  public goToStep2(): void {
    if (this.scheduleForm.controls.start_time.valid && this.scheduleForm.controls.end_time.valid) {
      this.currentStep.set(2);
    } else {
      this.scheduleForm.controls.start_time.markAsTouched();
      this.scheduleForm.controls.end_time.markAsTouched();
      const msg: string = this.getTranslation('notifications', 'fillTimeframes', 'Fill fields');
      this.toastService.show(msg, 'warning');
    }
  }

  public addBreak(): void {
    const startVal: string | null = this.scheduleForm.controls.start_time.value;
    const defaultDate: string = startVal ? startVal : this.formatToLocal(new Date().toISOString());
    const breakEnd: Date = new Date(new Date(defaultDate).getTime() + 30 * 60000);

    const breakGroup: FormGroup<BreakForm> = this.fb.group<BreakForm>({
      start: this.fb.control(defaultDate, { nonNullable: true, validators: [Validators.required] }),
      end: this.fb.control(this.formatToLocal(breakEnd.toISOString()), {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
    this.breaks.push(breakGroup);
  }

  public removeBreak(index: number): void {
    this.breaks.removeAt(index);
  }

  public onBreakStartChange(index: number): void {
    const breakGroup: FormGroup<BreakForm> = this.breaks.at(index);
    const startVal: string | null = breakGroup.controls.start.value;
    if (startVal) {
      const start: Date = new Date(startVal);
      const end: Date = new Date(start.getTime() + 30 * 60000);
      breakGroup.controls.end.setValue(this.formatToLocal(end.toISOString()));
    }
  }

  private toPersistableFormat(localDateStr: string): string {
    if (!localDateStr) {
      return '';
    }
    const date: Date = new Date(localDateStr);
    const offsetMs: number = date.getTimezoneOffset() * 60 * 1000;

    return new Date(date.getTime() - offsetMs).toISOString();
  }

  public confirmGenerateSchedule(): void {
    const doc: User | null = this.doctor();
    if (doc && this.scheduleForm.valid) {
      this.executeGenerateSchedule(doc._id);
    } else {
      this.scheduleForm.markAllAsTouched();
    }
  }

  private executeGenerateSchedule(docId: string): void {
    const formValue = this.scheduleForm.getRawValue();

    const payload = {
      doctor_id: docId,
      start_time: this.toPersistableFormat(formValue.start_time ?? ''),
      end_time: this.toPersistableFormat(formValue.end_time ?? ''),
      interval_minutes: formValue.interval_minutes ?? 30,
      breaks: formValue.breaks.map((b) => ({
        start: this.toPersistableFormat(b.start ?? ''),
        end: this.toPersistableFormat(b.end ?? ''),
      })),
    };

    this.adminService.generateBulkSchedule(payload).subscribe({
      next: () => {
        const msg: string = this.getTranslation('notifications', 'scheduleSuccess', 'Success');
        this.toastService.show(msg, 'success');
        this.loadDoctorData(docId);
        this.closeModel();
      },
      error: (err: { error?: { detail?: string } }) => {
        this.toastService.show(err.error?.detail || 'Error', 'error');
      },
    });
  }

  public handleAppointmentClick(appt: Appointment): void {
    this.selectedAppointment.set(appt);

    const apptWithEnd = appt as unknown as { start_time: string; end_time: string };

    this.editApptForm.patchValue({
      start: this.formatToLocal(appt.start_time),
      end: this.formatToLocal(apptWithEnd.end_time || appt.start_time),
    });
    this.activeModel.set('edit-appt');
  }

  public onStartTimeChange(): void {
    const startVal: string | null = this.editApptForm.controls.start.value;
    if (startVal) {
      const start: Date = new Date(startVal);
      const end: Date = new Date(start.getTime() + 30 * 60000);
      this.editApptForm.controls.end.setValue(this.formatToLocal(end.toISOString()));
    }
  }

  public confirmEditAppointment(): void {
    if (this.editApptForm.invalid) {
      this.editApptForm.markAllAsTouched();

      return;
    }

    const appt: Appointment | null = this.selectedAppointment();
    const start: string | null = this.editApptForm.controls.start.value;
    const end: string | null = this.editApptForm.controls.end.value;

    if (appt && start !== null && end !== null) {
      const payload = {
        start_time: this.toPersistableFormat(start),
        end_time: this.toPersistableFormat(end),
      };

      this.adminService.updateAppointment(appt._id, payload).subscribe({
        next: () => {
          const msg: string = this.getTranslation('notifications', 'updateApptSuccess', 'Success');
          this.toastService.show(msg, 'success');
          const doc: User | null = this.doctor();
          if (doc) {
            this.loadDoctorData(doc._id);
          }
          this.closeModel();
        },
        error: (err: { error?: { detail?: string } }) => {
          this.toastService.show(err.error?.detail || 'Error', 'error');
        },
      });
    }
  }

  private formatToLocal(dateStr: string): string {
    const d: Date = new Date(dateStr);
    const year: number = d.getFullYear();
    const month: string = String(d.getMonth() + 1).padStart(2, '0');
    const day: string = String(d.getDate()).padStart(2, '0');
    const hours: string = String(d.getHours()).padStart(2, '0');
    const minutes: string = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
