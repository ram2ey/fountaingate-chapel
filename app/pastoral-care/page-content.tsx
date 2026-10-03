import { CoreWorkspace } from '../../components/core/CoreWorkspace';
import { AttendanceOverview } from '../../components/attendance/AttendanceOverview';
export default function PageContent(){return <><AttendanceOverview view="risk"/><CoreWorkspace resource="care"/></>;}
