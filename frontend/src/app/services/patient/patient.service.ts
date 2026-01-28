import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../../models/appointment';
import { User } from '../../models/user';
import { MedicalHistory } from '../../models/medical-history';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private http: HttpClient = inject(HttpClient);
  private apiUrl: string = 'http://localhost:8000/user';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
  }

  public getDoctors(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/doctors`);
  }

  public getDoctorAppointments(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(
      `http://localhost:8000/admin/doctor/${doctorId}/appointments`,
    );
  }

  public bookVisit(appointmentId: string, bookingDetails: Partial<Appointment>): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/book/${appointmentId}`, bookingDetails, {
      headers: this.getHeaders(),
    });
  }

  public getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/my-appointments`, {
      headers: this.getHeaders(),
    });
  }

  public cancelVisit(appointmentId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/cancel-appointment/${appointmentId}`,
      {},
      { headers: this.getHeaders() },
    );
  }

  public getFullHistory(): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.apiUrl}/my-medical-history`, {
      headers: this.getHeaders(),
    });
  }
}
