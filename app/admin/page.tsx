import PageContent from './page-content';
import { requirePageAccess } from '../../lib/server/page-access';
import { UnavailableState } from '../../components/common/UnavailableState';
export default async function Page(){
 let status: 'ready'|'denied'|'unavailable'='unavailable';
 try { status=await requirePageAccess('staff')?'ready':'denied'; }
 catch(error) { if(error instanceof Error && 'digest' in error)throw error; }
 if(status==='denied')return <UnavailableState title="Access denied" description="Your account does not have permission to view this page."/>;
 if(status==='unavailable')return <UnavailableState title="Portal temporarily unavailable" description="Please try again later."/>;
 return <PageContent/>;
}
