import { readCommunications,writeCommunications } from '../../../lib/server/communications-service';
import { assertOrigin,requestBody } from '../../../lib/server/auth-input';
import { InputError } from '../../../lib/server/core-validation';
import { logFailure } from '../../../lib/server/operational-log.cjs';
const respond=(data:object,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){try{return respond(await readCommunications(new URL(request.url)));}catch(e){const id=logFailure('communications_api_failed',e);return respond({error:e instanceof InputError?e.message:'Communications unavailable or access denied.',request_id:id},e instanceof InputError?400:403);}}
export async function POST(request:Request){try{assertOrigin(request);return respond(await writeCommunications(await requestBody(request)));}catch(e){const id=logFailure('communications_api_failed',e);return respond({error:e instanceof InputError?e.message:'Operation could not be saved. Check recipients, current permissions and retry state.',request_id:id},e instanceof InputError?400:403);}}
