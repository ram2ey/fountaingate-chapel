import { assertOrigin,requestBody } from '../../../../lib/server/auth-input';
import { allowedFields,InputError } from '../../../../lib/server/core-validation';
import { paymentsEnabled,PaymentUnavailable } from '../../../../lib/server/hubtel';
import { createPayment,reconcilePayment } from '../../../../lib/server/payment-service';
const respond=(data:object,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(_request:Request,{params}:{params:Promise<{action:string}>}){return (await params).action==='configuration'?respond({enabled:paymentsEnabled(),provider:'Hubtel',currency:'GHS',methods:['mobile money','cards']}):respond({error:'Not found.'},404);}
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
 try{assertOrigin(request);const body=await requestBody(request),{action}=await params;
  if(action==='checkout')return respond(await createPayment(body));
  if(action==='verify'){allowedFields(body,['reference']);return respond(await reconcilePayment(body.reference));}
  return respond({error:'Not found.'},404);
 }catch(e){return respond({error:e instanceof InputError||e instanceof PaymentUnavailable?e.message:'Payment unavailable or access denied.'},e instanceof InputError?400:e instanceof PaymentUnavailable?503:403);}
}
