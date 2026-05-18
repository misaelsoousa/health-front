import { Routes } from '@angular/router';

import { AppLayout } from './shared/layouts/app-layout/app-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Patients } from './pages/patients/patients';
import { Exams } from './pages/exams/exams';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'patients',
        component: Patients,
      },
      {
        path: 'exams',
        component: Exams,
      },
    ],
  },
];
