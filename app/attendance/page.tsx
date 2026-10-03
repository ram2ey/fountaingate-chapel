import { requirePageAccess } from '../../lib/server/page-access';
import { AttendanceWorkspace } from '../../components/attendance/AttendanceWorkspace';
export default async function Page(){if(!await requirePageAccess('attendance'))return <p role="alert">Attendance administration requires staff access.</p>;return <AttendanceWorkspace/>;}
