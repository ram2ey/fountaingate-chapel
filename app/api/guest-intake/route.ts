import { createHash } from 'node:crypto';
import { assertOrigin, normalizedPhone, rateLimit, requestBody } from '../../../lib/server/auth-input';
import { authTransaction } from '../../../lib/server/auth-database';
import { allowedFields, boolean, identifier, InputError, text } from '../../../lib/server/core-validation';
export async function POST(request:Request){
 try{assertOrigin(request);const body=await requestBody(request);allowedFields(body,['key','branch_id','first_name','last_name','phone','consent','prayer']);
 const key=identifier(body.key),branch=identifier(body.branch_id),first=text(body.first_name,'first name',80),last=text(body.last_name,'last name',80,false),phone=normalizedPhone(body.phone),consent=boolean(body.consent),prayer=body.prayer?text(body.prayer,'prayer',3000):null;
 const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
 const allowed=await authTransaction(async client=>await rateLimit(client,'intake-phone',phone,10)&&await rateLimit(client,'intake-branch',branch,100));if(!allowed)return Response.json({error:'Try again later.'},{status:429});
 const result=await authTransaction(client=>client.query('SELECT identity.submit_guest($1,$2,$3,$4,$5,$6,$7,$8) AS receipt',[digest(key),digest(JSON.stringify([branch,first,last,phone,consent,prayer])),branch,first,last,phone,consent,prayer]));
 return Response.json({ok:true,receipt:result.rows[0].receipt},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:error instanceof InputError?error.message:'Intake unavailable. Retry with the same details and request key.'},{status:400});}
}
