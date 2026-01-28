import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  Signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../models/appointment';
import { LanguageService } from '../../../services/language/language-service.service';

@Component({
  selector: 'mg-calendar-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-component.component.html',
  styleUrl: './calendar-component.component.scss',
})
export class CalendarComponentComponent {
  public langService: LanguageService = inject(LanguageService);

  @Input() public set appointments(value: Appointment[]) {
    this._appointments.set(value);
  }

  private _appointments: WritableSignal<Appointment[]> = signal<Appointment[]>([]);
  @Output() public appointmentClicked: EventEmitter<Appointment> = new EventEmitter<Appointment>();

  public mondayDate: WritableSignal<Date> = signal<Date>(this.getMonday(new Date()));

  public timeSlots: string[] = [
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
  ];

  public weekDaysNames: Signal<string[]> = computed(() => {
    const lang = this.langService.currentLang();
    const locale = lang === 'pl' ? 'pl-PL' : 'en-US';
    const baseDate = new Date(2024, 0, 1);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      return d.toLocaleDateString(locale, { weekday: 'long' });
    });
  });

  public weekDates: Signal<Date[]> = computed(() => {
    const dates = [];
    const start = new Date(this.mondayDate());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }

    return dates;
  });

  private getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    return monday;
  }

  public onDateSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const selected = target.value;
    if (selected) {
      const newDate = new Date(selected);
      this.mondayDate.set(this.getMonday(newDate));
    }
  }

  public changeWeek(offset: number): void {
    const newDate = new Date(this.mondayDate());
    newDate.setDate(newDate.getDate() + offset * 7);
    this.mondayDate.set(newDate);
  }

  public getAppointmentForSlot(date: Date, time: string): Appointment | undefined {
    return this._appointments().find((appt) => {
      const apptDate = new Date(appt.start_time);
      const isSameDay = apptDate.toDateString() === date.toDateString();
      const apptTime = apptDate.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return isSameDay && apptTime === time;
    });
  }

  public onSlotClick(appt: Appointment): void {
    this.appointmentClicked.emit(appt);
  }
}
