import { Component, OnInit, inject, signal, WritableSignal, Signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin/admin.service';
import { ToastService } from '../../../services/toast/toast-service.service';
import {
  LanguageService,
  TranslationLanguage,
  TranslationSection,
  TranslationValue,
} from '../../../services/language/language-service.service';
import { doctorDomainValidator } from '../../../validators/domain.validator';
import { User } from '../../../models/user';

@Component({
  selector: 'mg-doctor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './doctor-form.component.html',
  styleUrl: './doctor-form.component.scss',
})
export class DoctorFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private adminService: AdminService = inject(AdminService);
  private toast: ToastService = inject(ToastService);
  public langService: LanguageService = inject(LanguageService);

  public doctorForm!: FormGroup<{
    full_name: FormControl<string | null>;
    email: FormControl<string | null>;
    password: FormControl<string | null>;
  }>;

  public isEditMode: WritableSignal<boolean> = signal(false);
  public doctorId: WritableSignal<string | null> = signal<string | null>(null);

  public t: Signal<TranslationLanguage> = computed(() => this.langService.t());

  public ngOnInit(): void {
    const id: string | null = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.doctorId.set(id);
    }
    this.initForm();
    if (this.isEditMode()) {
      this.loadDoctorData();
    }
  }

  private initForm(): void {
    this.doctorForm = this.fb.group({
      full_name: this.fb.control<string | null>(null, [
        Validators.required,
        Validators.minLength(3),
      ]),
      email: this.fb.control<string | null>(null, [
        Validators.required,
        Validators.email,
        doctorDomainValidator,
      ]),
      password: this.fb.control<string | null>(
        null,
        this.isEditMode() ? [] : [Validators.required, Validators.minLength(6)],
      ),
    });
  }

  private loadDoctorData(): void {
    const id: string | null = this.doctorId();
    if (id) {
      this.adminService.getDoctorById(id).subscribe({
        next: (doctor: User) =>
          this.doctorForm.patchValue({
            full_name: doctor.full_name,
            email: doctor.email,
          }),
        error: () => this.toast.show('Error loading doctor', 'error'),
      });
    }
  }

  private getTranslation(sectionKey: string, valueKey: string, fallback: string): string {
    const trans: TranslationLanguage = this.langService.t();
    const section: TranslationSection = trans[sectionKey];
    const val: TranslationValue = section[valueKey];

    return typeof val === 'string' ? val : fallback;
  }

  public onSubmit(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();

      return;
    }

    if (this.isEditMode()) {
      this.handleUpdate();
    } else {
      this.handleCreate();
    }
  }

  private handleUpdate(): void {
    const id: string | null = this.doctorId();
    const formValue = this.doctorForm.getRawValue();

    if (id) {
      this.adminService
        .updateDoctor(id, {
          full_name: formValue.full_name ?? '',
          email: formValue.email ?? '',
        })
        .subscribe({
          next: () => {
            const msg: string = this.getTranslation('notifications', 'statusSuccess', 'Success');
            this.toast.show(msg, 'success');
            void this.router.navigate(['/admin']);
          },
          error: (err: { error?: { detail?: string } }) => {
            this.toast.show(err.error?.detail || 'Error', 'error');
          },
        });
    }
  }

  private handleCreate(): void {
    const formValue = this.doctorForm.getRawValue();
    const payload = {
      full_name: formValue.full_name ?? '',
      email: formValue.email ?? '',
      password: formValue.password ?? '',
    };

    this.adminService.createDoctor(payload).subscribe({
      next: () => {
        const msg: string = this.getTranslation('notifications', 'createDoctorSuccess', 'Success');
        this.toast.show(msg, 'success');
        void this.router.navigate(['/admin']);
      },
      error: (err: { error?: { detail?: string } }) => {
        this.toast.show(err.error?.detail || 'Error', 'error');
      },
    });
  }
}
