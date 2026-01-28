import { MedicalHistory } from './medical-history';
import { FormControl } from '@angular/forms';

export interface AppointmentDetails {
  reason_for_visit: string;
  previous_treatment: boolean;
  additional_notes?: string;
}

export interface Appointment {
  _id: string;
  doctor_id: string;
  patient_id?: string;
  start_time: string;
  status: 'available' | 'booked' | 'completed';
  details: AppointmentDetails;
  created_at: string;
  medical_history?: MedicalHistory | null;
}

export interface FullAppointment {
  _id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  status: string;
  patient_id: string;
  created_at: string;
  details: {
    reason_for_visit: string;
    previous_treatment: boolean;
    additional_notes: string;
  };
  id: string;
  patient_data: {
    full_name: string;
    email: string;
  };
}

export interface BreakForm {
  start: FormControl<string | null>;
  end: FormControl<string | null>;
}
