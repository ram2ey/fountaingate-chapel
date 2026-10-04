import { resources, readCore, mutateCore, type Resource } from '../../../../lib/server/core-service';
import { assertOrigin, requestBody } from '../../../../lib/server/auth-input';
import { InputError } from '../../../../lib/server/core-validation';
import { logFailure } from '../../../../lib/server/operational-log.cjs';
const respond=(body:object,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request,{params}:{params:Promise<{resource:string}>}){
 try{const {resource}=await params;if(!resources.includes(resource as Resource))return respond({error:'Not found.'},404);return respond(await readCore(resource as Resource,new URL(request.url)));}
 catch(error){const id=logFailure('core_api_failed',error);return respond({error:error instanceof InputError?error.message:'Data unavailable or access denied.',request_id:id},error instanceof InputError?400:403);}
}
export async function POST(request:Request,{params}:{params:Promise<{resource:string}>}){
 try{assertOrigin(request);const {resource}=await params;if(!resources.includes(resource as Resource))return respond({error:'Not found.'},404);return respond(await mutateCore(resource as Resource,await requestBody(request)));}
 catch(error){const id=logFailure('core_api_failed',error);return respond({error:error instanceof InputError?error.message:'Save failed or access denied.',request_id:id},error instanceof InputError?400:403);}
}
