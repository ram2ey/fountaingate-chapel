import { readAttendance,writeAttendance } from '../../../lib/server/attendance-service';
import { assertOrigin,requestBody } from '../../../lib/server/auth-input';
import { InputError } from '../../../lib/server/core-validation';
const respond=(data:object,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){try{const url=new URL(request.url);return respond(await readAttendance(url.searchParams.get('view')||'services',url.searchParams.get('service_id')));}catch(e){return respond({error:e instanceof InputError?e.message:'Attendance unavailable or access denied.'},e instanceof InputError?400:403);}}
export async function POST(request:Request){try{assertOrigin(request);return respond(await writeAttendance(await requestBody(request)));}catch(e){return respond({error:e instanceof InputError?e.message:'Attendance could not be saved or access denied.'},e instanceof InputError?400:403);}}
