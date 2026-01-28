export interface User {
  _id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'patient';
  is_active: boolean;
  password?: string;
}

export interface DoctorListResponse {
  doctors: User[];
  totalCount: number;
}

export interface UserState {
  email: string;
  full_name: string;
  role: string;
}
