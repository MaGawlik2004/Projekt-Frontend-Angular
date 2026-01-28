import { Component, OnInit, inject, signal, computed, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin/admin.service';
import { User } from '../../../models/user';
import { Router } from '@angular/router';
import {
  LanguageService,
  TranslationLanguage,
  TranslationSection,
  TranslationValue,
} from '../../../services/language/language-service.service';
import { ToastService } from '../../../services/toast/toast-service.service';

@Component({
  selector: 'mg-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss',
})
export class AdminPanelComponent implements OnInit {
  private adminService: AdminService = inject(AdminService);
  private router: Router = inject(Router);
  private toastService: ToastService = inject(ToastService);
  public langService: LanguageService = inject(LanguageService);

  public allDoctors: WritableSignal<User[]> = signal<User[]>([]);
  public searchTerm: WritableSignal<string> = signal('');
  public sortDirection: WritableSignal<'asc' | 'desc'> = signal<'asc' | 'desc'>('asc');
  public currentPage: WritableSignal<number> = signal(1);
  public pageSize: number = 10;

  public filteredDoctors: Signal<User[]> = computed(() => {
    let list: User[] = [...this.allDoctors()];

    const term: string = this.searchTerm().toLocaleLowerCase().trim();
    if (term) {
      list = list.filter((doc: User) => doc.email.toLocaleLowerCase().includes(term));
    }

    list.sort((a: User, b: User) => {
      const emailA: string = a.email.toLocaleLowerCase();
      const emailB: string = b.email.toLocaleLowerCase();

      if (this.sortDirection() === 'asc') {
        return emailA.localeCompare(emailB);
      }

      return emailB.localeCompare(emailA);
    });

    return list;
  });

  public paginatedDoctors: Signal<User[]> = computed(() => {
    const start: number = (this.currentPage() - 1) * this.pageSize;

    return this.filteredDoctors().slice(start, start + this.pageSize);
  });

  public totalPages: Signal<number> = computed(() => {
    const count: number = this.filteredDoctors().length;

    return Math.ceil(count / this.pageSize);
  });

  public ngOnInit(): void {
    this.fetchDoctors();
  }

  /**
   * Pomocnicza metoda do bezpiecznego pobierania tłumaczeń
   */
  private getTranslation(sectionKey: string, key: string, fallback: string): string {
    const trans: TranslationLanguage = this.langService.t();
    const section: TranslationSection = trans[sectionKey];
    const value: TranslationValue = section[key];

    return typeof value === 'string' ? value : fallback;
  }

  public fetchDoctors(): void {
    this.adminService.getDoctors().subscribe({
      next: (data: User[]) => this.allDoctors.set(data),
      error: () => {
        const errorMsg: string = this.getTranslation('notifications', 'fetchDoctorsError', 'Error');
        this.toastService.show(errorMsg, 'error');
      },
    });
  }

  public onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  public toggleSort(): void {
    this.sortDirection.update((val: 'asc' | 'desc') => (val === 'asc' ? 'desc' : 'asc'));
  }

  public nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v: number) => v + 1);
    }
  }

  public prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((v: number) => v - 1);
    }
  }

  public goToDetails(id: string): void {
    void this.router.navigate(['/admin/doctor', id]);
  }

  public createNewDoctor(): void {
    void this.router.navigate(['/admin/doctor/new']);
  }

  public goToEdit(id: string): void {
    void this.router.navigate(['/admin/doctor/edit', id]);
  }
}
