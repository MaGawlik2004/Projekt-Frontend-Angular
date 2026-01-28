import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { AdminPanelComponent } from './components/admin/admin-panel/admin-panel.component';
import { DoctorPanelComponent } from './components/doctor/doctor-panel/doctor-panel.component';
import { UserPanelComponent } from './components/user/user-panel/user-panel.component';
import { PageNotFoundComponent } from './not-found/page-not-found/page-not-found.component';
import { DoctorDetailComponent } from './components/admin/doctor-detail/doctor-detail.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DoctorListComponent } from './components/user/doctor-list/doctor-list.component';
import { BookingComponent } from './components/user/booking/booking.component';
import { MyAppointmentsComponent } from './components/user/my-appointments/my-appointments.component';
import { VisitDetailComponent } from './components/doctor/visit-detail/visit-detail.component';
import { DoctorScheduleComponent } from './components/doctor/doctor-schedule/doctor-schedule.component';
import { authGuard } from './guards/auth.guard';
import { DoctorFormComponent } from './components/shared/doctor-form/doctor-form.component';

export const routes: Routes = [
  { path: '', redirectTo: 'user/doctors', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [authGuard],
    data: { expectedRoles: ['admin'] },
  },
  {
    path: 'admin/doctor/new',
    component: DoctorFormComponent,
    canActivate: [authGuard],
    data: { expectedRoles: ['admin'] },
  },
  {
    path: 'admin/doctor/edit/:id',
    component: DoctorFormComponent,
    canActivate: [authGuard],
    data: { expectedRoles: ['admin'] },
  },
  {
    path: 'admin/doctor/:id',
    component: DoctorDetailComponent,
    canActivate: [authGuard],
    data: { expectedRoles: ['admin'] },
  },
  {
    path: 'doctor',
    component: DoctorPanelComponent,
    canActivate: [authGuard],
    data: { expectedRoles: ['doctor'] },
    children: [
      { path: '', redirectTo: 'schedule', pathMatch: 'full' },
      { path: 'schedule', component: DoctorScheduleComponent },
      { path: 'visit/:id', component: VisitDetailComponent },
    ],
  },
  {
    path: 'user',
    component: UserPanelComponent,
    children: [
      { path: '', redirectTo: 'doctors', pathMatch: 'full' },
      { path: 'doctors', component: DoctorListComponent },
      {
        path: 'book/:doctorId',
        component: BookingComponent,
        canActivate: [authGuard],
        data: { expectedRoles: ['patient', 'doctor'] },
      },
      {
        path: 'my-appointments',
        component: MyAppointmentsComponent,
        canActivate: [authGuard],
        data: { expectedRoles: ['patient', 'doctor'] },
      },
    ],
  },
  { path: '**', component: PageNotFoundComponent },
];
