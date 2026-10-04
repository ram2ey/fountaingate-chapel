import {requirePageAccess} from '../../lib/server/page-access';
import {UnavailableState} from '../../components/common/UnavailableState';
import {OperationsWorkspace} from '../../components/operations/OperationsWorkspace';
export default async function Page(){if(!await requirePageAccess('care'))return <UnavailableState title="Access denied" description="Operational status requires staff access."/>;return <OperationsWorkspace/>;}
