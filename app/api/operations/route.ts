import {readOperations} from '../../../lib/server/operations-service';
import {logFailure} from '../../../lib/server/operational-log.cjs';
export async function GET(){try{return Response.json(await readOperations(),{headers:{'Cache-Control':'no-store'}});}catch(error){const id=logFailure('operations_check_failed',error);return Response.json({error:'Operational status unavailable or access denied.',request_id:id},{status:403,headers:{'Cache-Control':'no-store','X-Request-Id':id}});}}
