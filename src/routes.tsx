import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientFormPage from './pages/PatientFormPage';
import PatientDetailPage from './pages/PatientDetailPage';
import VisitFormPage from './pages/VisitFormPage';
import VisitDetailPage from './pages/VisitDetailPage';
import TodaysVisitsPage from './pages/TodaysVisitsPage';
import FollowUpsDuePage from './pages/FollowUpsDuePage';
import PendingPrescriptionsPage from './pages/PendingPrescriptionsPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    visible: false
  },
  {
    name: 'Dashboard',
    path: '/',
    element: <DashboardPage />
  },
  {
    name: 'Patients',
    path: '/patients',
    element: <PatientsPage />
  },
  {
    name: 'Add Patient',
    path: '/patients/new',
    element: <PatientFormPage />,
    visible: false
  },
  {
    name: 'Edit Patient',
    path: '/patients/:id/edit',
    element: <PatientFormPage />,
    visible: false
  },
  {
    name: 'Patient Detail',
    path: '/patients/:id',
    element: <PatientDetailPage />,
    visible: false
  },
  {
    name: 'Add Visit',
    path: '/patients/:patientId/visits/new',
    element: <VisitFormPage />,
    visible: false
  },
  {
    name: 'Visit Detail',
    path: '/patients/:patientId/visits/:visitId',
    element: <VisitDetailPage />,
    visible: false
  },
  {
    name: "Today's Visits",
    path: '/visits/today',
    element: <TodaysVisitsPage />,
    visible: false
  },
  {
    name: 'Follow-ups Due',
    path: '/visits/follow-ups',
    element: <FollowUpsDuePage />,
    visible: false
  },
  {
    name: 'Pending Prescriptions',
    path: '/prescriptions/pending',
    element: <PendingPrescriptionsPage />,
    visible: false
  }
];

export default routes;
