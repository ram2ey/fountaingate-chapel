import { cookies } from 'next/headers';
import { authTransaction } from '../../../../lib/server/auth-database';
import { assertOrigin, rateLimit, requestBody, uuid } from '../../../../lib/server/auth-input';
import { authorizedTransaction, currentSession, newToken, SESSION_COOKIE, tokenDigest } from '../../../../lib/server/auth';

export async function POST(request:Request,{params}:{params:Promise<{action:string}>}) {
 try {
  assertOrigin(request);const body=await requestBody(request),{action}=await params;
  if(action==='checkin') {
   const device=request.headers.get('authorization')?.replace(/^Bearer /,'');
   if(!device||!/^[A-Za-z0-9_-]{43}$/.test(device)||typeof body.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.token))return Response.json({error:'Access denied.'},{status:401});
   const allowed=await authTransaction(client=>rateLimit(client,'kiosk',tokenDigest(device),30));
   if(!allowed)return Response.json({error:'Try again later.'},{status:429});
   const result=await authTransaction(client=>client.query('SELECT identity.kiosk_checkin($1,$2) AS ok',[device,body.token]));
   return result.rows[0]?.ok?Response.json({ok:true}):Response.json({error:'Invalid or expired check-in token.'},{status:400});
  }
  const user=await currentSession();if(!user)return Response.json({error:'Access denied.'},{status:401});
  const token=newToken();
  if(action==='qr'&&uuid(body.service_id)) {
   const service=await authorizedTransaction('self',client=>client.query('SELECT id FROM public.services WHERE id=$1 AND branch_id=identity.branch() AND completed_at IS NULL AND archived_at IS NULL',[body.service_id]));
   if(!service.rowCount)return Response.json({error:'Service unavailable.'},{status:400});
   await authTransaction(client=>client.query("INSERT INTO identity.tokens(token_hash,user_id,purpose,branch_id,service_id,expires_at) VALUES($1,$2,'kiosk_lookup',$3,$4,now()+interval '5 minutes')",[tokenDigest(token),user.id,user.branch_id,body.service_id]));
   return Response.json({token,expires_in:300},{headers:{'Cache-Control':'no-store'}});
  }
  if(action==='device'||action==='revoke') {
   const session=(await cookies()).get(SESSION_COOKIE)?.value;
   const result=await authTransaction(async client=>{
    await client.query("SELECT set_config('fgc.session_token',$1,true)",[session]);
    const p=(await client.query("SELECT identity.has_capability('kiosk') AS allowed,identity.branch() AS branch")).rows[0];if(!p.allowed)return null;
    if(action==='revoke'&&uuid(body.device_id))return client.query('UPDATE identity.kiosk_devices SET revoked_at=now() WHERE id=$1 AND branch_id=$2 RETURNING id',[body.device_id,p.branch]);
    if(action==='device'&&typeof body.name==='string'&&body.name.trim().length>0&&body.name.length<=80)return client.query("INSERT INTO identity.kiosk_devices(branch_id,token_hash,name,expires_at) VALUES($1,$2,$3,now()+interval '30 days') RETURNING id",[p.branch,tokenDigest(token),body.name.trim()]);
    return null;
   });
   if(!result?.rowCount)return Response.json({error:'Access denied.'},{status:403});
   return Response.json(action==='device'?{id:result.rows[0].id,token,expires_in:2592000}:{ok:true},{headers:{'Cache-Control':'no-store'}});
  }
  return Response.json({error:'Not found.'},{status:404});
 } catch {return Response.json({error:'Request unavailable.'},{status:400});}
}
