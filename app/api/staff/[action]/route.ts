import { cookies } from 'next/headers';
import { authTransaction } from '../../../../lib/server/auth-database';
import { newToken, SESSION_COOKIE, tokenDigest } from '../../../../lib/server/auth';
import { assertOrigin, normalizedPhone, requestBody, uuid } from '../../../../lib/server/auth-input';
import { sendAuthMessage, smsConfigured } from '../../../../lib/server/mnotify';

export async function POST(request:Request,{params}:{params:Promise<{action:string}>}) {
 try {
  assertOrigin(request);const body=await requestBody(request),{action}=await params;
  const token=(await cookies()).get(SESSION_COOKIE)?.value;if(!token)return Response.json({error:'Access denied.'},{status:401});
  const invitation=newToken();
  const outcome=await authTransaction(async client=>{
   await client.query("SELECT set_config('fgc.session_token',$1,true)",[token]);
   const permission=(await client.query("SELECT identity.has_capability('staff') AS allowed,identity.branch() AS branch,identity.actor() AS actor")).rows[0];
   if(!permission.allowed)return null;
   if(action==='invite') {
    if(!smsConfigured()||!['admin','pastor'].includes(String(body.role)))return null;
    const phone=normalizedPhone(body.phone);
    const user=(await client.query('SELECT id FROM identity.users WHERE phone=$1 AND phone_verified_at IS NOT NULL AND disabled_at IS NULL',[phone])).rows[0];
    if(!user)return null;
    await client.query("UPDATE identity.tokens SET consumed_at=now(),enrollment_secret=NULL WHERE user_id=$1 AND branch_id=$2 AND purpose='staff_invite' AND consumed_at IS NULL",[user.id,permission.branch]);
    await client.query("INSERT INTO identity.tokens(token_hash,user_id,phone,purpose,branch_id,invited_role,expires_at) VALUES($1,$2,$3,'staff_invite',$4,$5,now()+interval '24 hours')",[tokenDigest(invitation),user.id,phone,permission.branch,body.role]);
    await client.query("INSERT INTO identity.audit_events(user_id,branch_id,action) VALUES($1,$2,'staff_invitation_created')",[permission.actor,permission.branch]);
    return {phone};
   }
   if(action==='revoke'&&uuid(body.user_id)) {
    // Demotion only; elevation always requires an expiring invitation and proven TOTP enrollment.
    if(body.user_id===permission.actor)return null;
    const removed=await client.query("UPDATE identity.memberships SET role='member' WHERE user_id=$1 AND branch_id=$2 RETURNING user_id",[body.user_id,permission.branch]);
    if(!removed.rowCount)return null;
    await client.query('UPDATE identity.sessions SET revoked_at=now() WHERE user_id=$1 AND branch_id=$2',[body.user_id,permission.branch]);
    await client.query("UPDATE identity.tokens SET consumed_at=now(),enrollment_secret=NULL WHERE user_id=$1 AND branch_id=$2 AND purpose='staff_invite'",[body.user_id,permission.branch]);
    await client.query("INSERT INTO identity.audit_events(user_id,branch_id,action) VALUES($1,$2,'staff_revocation')",[permission.actor,permission.branch]);
    return {ok:true};
   }
   return null;
  });
  if(!outcome)return Response.json({error:'Access denied or invalid request.'},{status:403});
  if('phone' in outcome)await sendAuthMessage(outcome.phone!,'invite',invitation);
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 } catch { return Response.json({error:'Request unavailable.'},{status:400}); }
}
