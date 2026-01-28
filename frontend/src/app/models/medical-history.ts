export interface MedicalHistory {
  _id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  recommendations: string[];
  treatment_notes: string;
  date: string;
}

export interface MedicalHistoryCreate {
  patient_id: string;
  appointment_id: string;
  diagnosis: string;
  recommendations: string[];
  treatment_notes: string;
}
