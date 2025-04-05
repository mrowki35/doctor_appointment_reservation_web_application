import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'register-doctor',
    loadComponent: () =>
      import('./components/register-doctor/register-doctor.component').then(
        (m) => m.RegisterDoctorComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin'] },
  },

  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin/admin.component').then(
        (m) => m.AdminComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin'] },
  },
  // Harmonogram Lekarzy dostępny dla Lekarzy i Pacjentów
  {
    path: 'calendar',
    loadComponent: () =>
      import('./components/kalendarz/kalendarz.component').then(
        (m) => m.KalendarzComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Pacjent'] },
  },

  {
    path: 'koszyk',
    loadComponent: () =>
      import('./components/koszyk/koszyk.component').then(
        (m) => m.KoszykComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Pacjent'] },
  },
  {
    path: 'rezerwacje',
    loadComponent: () =>
      import('./components/moje-rezerwacje/moje-rezerwacje.component').then(
        (m) => m.MojeRezerwacjeComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Pacjent'] },
  },
  // Formularz Rezerwacji dostępny dla Pacjentów
  {
    path: 'patient-form',
    loadComponent: () =>
      import('./components/patient-form/patient-form.component').then(
        (m) => m.PatientFormComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Pacjent'] },
  },
  // Komentarze dostępne dla Pacjentów
  {
    path: 'comments',
    loadComponent: () =>
      import('./components/comments-list/comments-list.component').then(
        (m) => m.CommentsListComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Pacjent', 'Admin'] },
  },

  {
    path: 'doctorlist',
    loadComponent: () =>
      import('./components/doctor-list/doctor-list.component').then(
        (m) => m.DoctorListComponent
      ),
  },
  {
    path: 'edit-harmonogram',
    loadComponent: () =>
      import(
        './components/schedule-management/schedule-management.component'
      ).then((m) => m.ScheduleManagementComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Lekarz'] },
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./components/users-list/users-list.component').then(
        (m) => m.UsersListComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin'] },
  },

  {
    path: 'absencje',
    loadComponent: () =>
      import(
        './components/doctor-absence-form/doctor-absence-form.component'
      ).then((m) => m.DoctorAbsenceFormComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Lekarz'] },
  },

  {
    path: 'doctorform',
    loadComponent: () =>
      import('./components/doctor-form/doctor-form.component').then(
        (m) => m.DoctorFormComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Lekarz'] },
  },
  {
    path: 'harmonogram',
    loadComponent: () =>
      import('./components/harmonogram/harmonogram.component').then(
        (m) => m.HarmonogramComponent
      ),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Lekarz'] }, // Tylko Admin może dodawać lekarzy
  },
  // Inne ścieżki...
  { path: '**', redirectTo: '', pathMatch: 'full' }, // Przekierowanie na główną stronę w przypadku nieznanej ścieżki
];
