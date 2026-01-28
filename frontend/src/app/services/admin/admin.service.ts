import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/user';
import { Appointment } from '../../models/appointment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http: HttpClient = inject(HttpClient);
  private apiUrl: string = 'http://localhost:8000/admin';

  private getHeaders(): HttpHeaders {
    const token: string | null = localStorage.getItem('token');

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  public getDoctors(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/all-doctors-full`, { headers: this.getHeaders() });
  }

  public createDoctor(doctorData: Partial<User>): Observable<User> {
    const headers: HttpHeaders = this.getHeaders();
    const payload: Partial<User> = { ...doctorData, role: 'doctor', is_active: true };

    return this.http.post<User>(`${this.apiUrl}/register-doctor`, payload, { headers });
  }

  public getDoctorById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/doctor/${id}`, { headers: this.getHeaders() });
  }

  public getDoctorAppointments(id: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${id}/appointments`);
  }

  public toggleDoctorActivity(id: string): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/doctor/${id}/toggle-activity`,
      {},
      { headers: this.getHeaders() },
    );
  }

  public changeDoctorPassword(userId: string, password: string): Observable<void> {
    const body: Record<string, string> = {
      user_id: userId,
      new_password: password,
    };

    return this.http.post<void>(`${this.apiUrl}/admin-reset-password`, body, {
      headers: this.getHeaders(),
    });
  }

  public generateBulkSchedule(payload: {
    doctor_id: string;
    start_time: string;
    end_time: string;
    interval_minutes: number;
    breaks: { start: string; end: string }[];
  }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/generate-bulk-schedule`, payload, {
      headers: this.getHeaders(),
    });
  }

  public updateAppointment(id: string, data: Partial<Appointment>): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/appointment/${id}`, data, {
      headers: this.getHeaders(),
    });
  }

  public deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/appointment/${id}`, {
      headers: this.getHeaders(),
    });
  }

  public updateDoctor(id: string, data: { full_name: string; email: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/doctor/${id}`, data, { headers: this.getHeaders() });
  }
}
