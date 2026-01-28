import { Component, OnInit, inject, signal, computed, Signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PatientService } from '../../../services/patient/patient.service';
import { Router } from '@angular/router';
import { User } from '../../../models/user';
import {
  LanguageService,
  TranslationLanguage,
  TranslationSection,
  TranslationValue,
} from '../../../services/language/language-service.service';
import { AuthService } from '../../../services/auth/auth.service';
import { ToastService } from '../../../services/toast/toast-service.service';
import { forkJoin, map, switchMap, of, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../../models/appointment';

type DoctorWithTerm = User & { nextTerm?: string };

@Component({
  selector: 'mg-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-list.component.html',
  styleUrl: './doctor-list.component.scss',
})
export class DoctorListComponent implements OnInit {
  private patientService: PatientService = inject(PatientService);
  private router: Router = inject(Router);
  private toastService: ToastService = inject(ToastService);
  public langService: LanguageService = inject(LanguageService);
  public authService: AuthService = inject(AuthService);

  private rawDoctors: WritableSignal<DoctorWithTerm[]> = signal<DoctorWithTerm[]>([]);

  public searchTerm: WritableSignal<string> = signal('');
  public sortBy: WritableSignal<'name' | 'date'> = signal<'name' | 'date'>('name');
  public sortDirection: WritableSignal<'asc' | 'desc'> = signal<'asc' | 'desc'>('asc');
  public onlyAvailable: WritableSignal<boolean> = signal(false);

  public filteredDoctors: Signal<DoctorWithTerm[]> = computed(() => {
    let list: DoctorWithTerm[] = [...this.rawDoctors()];

    const term: string = this.searchTerm().toLowerCase().trim();
    if (term) {
      list = list.filter((d: DoctorWithTerm) => d.full_name.toLowerCase().includes(term));
    }

    if (this.onlyAvailable()) {
      list = list.filter((d: DoctorWithTerm) => d.nextTerm);
    }

    list.sort((a: DoctorWithTerm, b: DoctorWithTerm) => {
      let result: number = 0;
      if (this.sortBy() === 'name') {
        result = a.full_name.localeCompare(b.full_name);
      } else {
        if (!a.nextTerm) {
          return 1;
        }
        if (!b.nextTerm) {
          return -1;
        }
        result = new Date(a.nextTerm).getTime() - new Date(b.nextTerm).getTime();
      }

      return this.sortDirection() === 'asc' ? result : -result;
    });

    return list;
  });

  public ngOnInit(): void {
    this.loadData();
  }

  private getTranslation(sectionKey: string, valueKey: string, fallback: string): string {
    const trans: TranslationLanguage = this.langService.t();
    const section: TranslationSection = trans[sectionKey];

    // Usunięto niepotrzebny warunek if (section)
    const val: TranslationValue = section[valueKey];
    if (typeof val === 'string') {
      return val;
    }

    return fallback;
  }

  public loadData(): void {
    this.patientService
      .getDoctors()
      .pipe(
        switchMap((docs: User[]): Observable<{ doctor: User; appointments: Appointment[] }[]> => {
          if (docs.length === 0) {
            return of([]);
          }
          const requests: Observable<{ doctor: User; appointments: Appointment[] }>[] = docs.map(
            (d: User) =>
              this.patientService
                .getDoctorAppointments(d._id)
                .pipe(map((appts: Appointment[]) => ({ doctor: d, appointments: appts }))),
          );

          return forkJoin(requests);
        }),
        map((results: { doctor: User; appointments: Appointment[] }[]): DoctorWithTerm[] => {
          return results.map(
            (res: { doctor: User; appointments: Appointment[] }): DoctorWithTerm => {
              const available: Appointment[] = res.appointments
                .filter(
                  (a: Appointment) =>
                    a.status === 'available' && new Date(a.start_time) > new Date(),
                )
                .sort(
                  (a: Appointment, b: Appointment) =>
                    new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
                );

              return {
                ...res.doctor,
                nextTerm: available.length > 0 ? available[0].start_time : undefined,
              };
            },
          );
        }),
      )
      .subscribe({
        next: (combinedData: DoctorWithTerm[]) => this.rawDoctors.set(combinedData),
        error: () => {
          const errorMsg: string = this.getTranslation('notifications', 'errorDefault', 'Error');
          this.toastService.show(errorMsg, 'error');
        },
      });
  }

  public toggleSortDirection(): void {
    this.sortDirection.update((dir: 'asc' | 'desc') => (dir === 'asc' ? 'desc' : 'asc'));
  }

  public goToBooking(doctorId: string): void {
    void this.router.navigate(['/user/book', doctorId]);
  }
}
