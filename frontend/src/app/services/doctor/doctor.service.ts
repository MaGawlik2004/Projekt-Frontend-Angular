import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, FullAppointment } from '../../models/appointment';
import { MedicalHistory, MedicalHistoryCreate } from '../../models/medical-history';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private http: HttpClient = inject(HttpClient);
  private apiUrl: string = 'http://localhost:8000/doctor';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
  }

  public getSchedule(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/my-schedule`, {
      headers: this.getHeaders(),
    });
  }

  public getPatientHistory(patientId: string): Observable<MedicalHistory[]> {
    return this.http.get<MedicalHistory[]>(`${this.apiUrl}/patient-history/${patientId}`, {
      headers: this.getHeaders(),
    });
  }

  public addMedicalHistory(historyData: MedicalHistoryCreate): Observable<MedicalHistoryCreate> {
    return this.http.post<MedicalHistoryCreate>(`${this.apiUrl}/add-history`, historyData, {
      headers: this.getHeaders(),
    });
  }

  public getAppointmentDetai(appointmentId: string): Observable<FullAppointment> {
    return this.http.get<FullAppointment>(`${this.apiUrl}/appointment-detail/${appointmentId}`, {
      headers: this.getHeaders(),
    });
  }
}
