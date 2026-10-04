import { createRoot } from 'react-dom/client';
import { ChurchProvider } from '../../../lib/context/ChurchContext';
import { AppLayout } from '../../../components/layout/AppLayout';
import DashboardPage from '../../../app/page-content';
import { LoginForm } from '../../../components/auth/LoginForm';
import { GuestIntake } from '../../../components/core/GuestIntake';
import { DeviceCheckIn } from '../../../components/kiosk/DeviceCheckIn';
import { FinanceWorkspace } from '../../../components/financials/FinanceWorkspace';
import { CoreWorkspace } from '../../../components/core/CoreWorkspace';
import { MediaWorkspace } from '../../../components/media/MediaWorkspace';
import { OperationsWorkspace } from '../../../components/operations/OperationsWorkspace';
import { AttendanceWorkspace } from '../../../components/attendance/AttendanceWorkspace';
import type { SystemUser, UserRole } from '../../../lib/types/church';

const params = new URLSearchParams(window.location.search);
const role = (params.get('role') || 'member') as UserRole;
const user: SystemUser = {
  id: '00000000-0000-4000-8000-000000000072', full_name: 'Daniel Thomas',
  phone: '+233241234599', created_at: '2026-10-04', role,
};
const path = window.location.pathname;
const content = path === '/login' ? <LoginForm /> : path === '/guest-intake' ? <GuestIntake /> : path === '/kiosk' ? <DeviceCheckIn />
  : path === '/giving' ? <FinanceWorkspace own /> : path === '/financials' ? <FinanceWorkspace />
  : path === '/sermons' ? <MediaWorkspace /> : path === '/prayer-wall' ? <CoreWorkspace resource="prayers" />
  : path === '/settings' ? <CoreWorkspace resource="profile" /> : path === '/operations' ? <OperationsWorkspace />
  : path === '/attendance' ? <AttendanceWorkspace /> : <DashboardPage />;

createRoot(document.getElementById('root')!).render(<ChurchProvider initialUser={user}><AppLayout>{content}</AppLayout></ChurchProvider>);
