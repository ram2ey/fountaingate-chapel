import { cookies } from 'next/headers';
import { authTransaction } from '../../../../lib/server/auth-database';
import { currentSession, newToken, readSession, SESSION_COOKIE, setSessionCookie, tokenDigest } from '../../../../lib/server/auth';
import { assertOrigin, normalizedPhone, rateLimit, requestBody, uuid } from '../../../../lib/server/auth-input';
import { hashPassword, validatePassword, verifyPassword } from '../../../../lib/server/password';
import { sendAuthMessage, smsConfigured } from '../../../../lib/server/mnotify';
import { decryptSecret, encryptSecret, newTotp, totpCounter } from '../../../../lib/server/totp';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(value:object,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
let dummyHash: Promise<string>|undefined;

export async function GET(_request:Request, {params}:{params:Promise<{action:string}>}) {
  const {action}=await params;
  if(action!=='session') return reply({error:'Not found.'},404);
  try { return reply({user:await currentSession(),sms_available:smsConfigured()}); }
  catch { return reply({error:'Sign-in is temporarily unavailable.'},503); }
}

export async function POST(request:Request,{params}:{params:Promise<{action:string}>}) {
  const {action}=await params;
  try {
    assertOrigin(request);
    const body=await requestBody(request);
    if(action==='logout') {
      const token=(await cookies()).get(SESSION_COOKIE)?.value;
      if(token) await authTransaction(client=>client.query('UPDATE identity.sessions SET revoked_at=now() WHERE token_hash=$1',[tokenDigest(token)]));
      (await cookies()).delete(SESSION_COOKIE);return reply({ok:true});
    }
    if(action==='password') {
      const user=await currentSession();if(!user) return reply({error:'Access denied.'},401);
      validatePassword(body.password);
      if(typeof body.current_password!=='string'||body.current_password.length>128) return reply({error:'Invalid credentials.'},400);
      const allowed=await authTransaction(client=>rateLimit(client,'password',user.id));
      if(!allowed)return reply({error:'Try again later.'},429);
      const hash=await hashPassword(body.password);
      const changed=await authTransaction(async client=>{
        const account=(await client.query('SELECT password_hash FROM identity.users WHERE id=$1 FOR UPDATE',[user.id])).rows[0];
        if(!account||!await verifyPassword(account.password_hash,body.current_password as string))return false;
        await client.query('UPDATE identity.users SET password_hash=$1,updated_at=now() WHERE id=$2',[hash,user.id]);
        await client.query('UPDATE identity.sessions SET revoked_at=now() WHERE user_id=$1',[user.id]);await client.query("INSERT INTO identity.audit_events(user_id,branch_id,action) VALUES($1,$2,'password_change')",[user.id,user.branch_id]);return true;
      });
      if(!changed)return reply({error:'Invalid credentials.'},400);
      (await cookies()).delete(SESSION_COOKIE);return reply({ok:true});
    }
    if(action==='login') {
      const phone=normalizedPhone(body.phone);
      if(typeof body.password!=='string'||body.password.length>128||!uuid(body.branch_id))return reply({error:'Invalid credentials.'},400);
      // Commit rate-limit increments independently of any rejected authentication transaction.
      const allowed=await authTransaction(async client=>await rateLimit(client,'login',phone)&&await rateLimit(client,'global-login','all',300));
      if(!allowed)return reply({error:'Try again later.'},429);
      const token=newToken();
      const success=await authTransaction(async client=>{
        const account=(await client.query(`SELECT u.*,m.role FROM identity.users u JOIN identity.memberships m ON m.user_id=u.id
          JOIN public.branches b ON b.id=m.branch_id WHERE u.phone=$1 AND m.branch_id=$2 AND b.archived_at IS NULL FOR UPDATE OF u`,[phone,body.branch_id])).rows[0];
        dummyHash ||= hashPassword(newToken());
        const valid=await verifyPassword(account?.password_hash||await dummyHash,body.password as string);
        if(!valid||!account||account.disabled_at||!account.phone_verified_at)return false;
        let mfa=false;
        if(account.role!=='member') {
          if(!account.totp_secret_encrypted)return false;
          const counter=totpCounter(decryptSecret(account.totp_secret_encrypted),body.totp);
          if(counter===null||counter<=Number(account.totp_last_counter))return false;
          await client.query('UPDATE identity.users SET totp_last_counter=$1 WHERE id=$2',[counter,account.id]);mfa=true;
        }
        const previous=(await cookies()).get(SESSION_COOKIE)?.value;
        if(previous)await client.query('UPDATE identity.sessions SET revoked_at=now() WHERE token_hash=$1',[tokenDigest(previous)]);
        await client.query(`INSERT INTO identity.sessions(token_hash,user_id,branch_id,expires_at,mfa_verified_at) VALUES($1,$2,$3,now()+interval '8 hours',CASE WHEN $4 THEN now() END)`,[tokenDigest(token),account.id,body.branch_id,mfa]);await client.query("INSERT INTO identity.audit_events(user_id,branch_id,action) VALUES($1,$2,'sign_in')",[account.id,body.branch_id]);return true;
      });
      if(!success)return reply({error:'Invalid credentials or verification required.'},401);
      await setSessionCookie(token);return reply({user:await readSession(token)});
    }
    if(['register','recovery','resend'].includes(action)) {
      if(!smsConfigured())return reply({error:'Phone verification and recovery are unavailable.'},503);
      const phone=normalizedPhone(body.phone);
      const allowed=await authTransaction(async client=>await rateLimit(client,'sms',phone,3)&&await rateLimit(client,'global-sms','all',50));
      if(!allowed)return reply({error:'Try again later.'},429);
      let passwordHash='';
      if(action==='register') {
        validatePassword(body.password);if(!uuid(body.branch_id)||typeof body.full_name!=='string'||body.full_name.trim().length<1||body.full_name.length>160)return reply({error:'Invalid registration fields.'},400);
        passwordHash=await hashPassword(body.password);
      }
      const token=newToken(), purpose=action==='recovery'?'reset_password':'verify_phone';
      const issued=await authTransaction(async client=>{
        // Serialize provisioning for the same exact phone so retries never duplicate account/profile/member.
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[phone]);
        let account=(await client.query('SELECT u.id,u.phone_verified_at,u.disabled_at,p.full_name,m.branch_id FROM identity.users u JOIN public.profiles p ON p.id=u.id JOIN identity.memberships m ON m.user_id=u.id WHERE u.phone=$1 ORDER BY m.created_at LIMIT 1',[phone])).rows[0];
        if(!account&&action==='register') {
          const result=await client.query('SELECT identity.register_member($1,$2,$3,$4) AS id',[phone,passwordHash,(body.full_name as string).trim(),body.branch_id]);
          account={id:result.rows[0].id,phone_verified_at:null};
        }
        if(!account||account.disabled_at||(purpose==='verify_phone'&&account.phone_verified_at)||(purpose==='reset_password'&&!account.phone_verified_at))return null;
        await client.query('UPDATE identity.tokens SET consumed_at=now() WHERE user_id=$1 AND purpose=$2 AND consumed_at IS NULL',[account.id,purpose]);
        await client.query(`INSERT INTO identity.tokens(token_hash,user_id,phone,purpose,branch_id,enrollment_name,expires_at) VALUES($1,$2,$3,$4,$5,$6,now()+interval '15 minutes')`,[tokenDigest(token),account.id,phone,purpose,action==='register'?body.branch_id:account.branch_id,action==='register'?(body.full_name as string).trim():account.full_name]);
        const attempt=await client.query("INSERT INTO identity.message_attempts(token_hash,status) VALUES($1,'pending') RETURNING id",[tokenDigest(token)]);return attempt.rows[0].id;
      });
      if(issued) {
        try {
          const provider=await sendAuthMessage(phone,purpose==='verify_phone'?'verify':'reset',token);
          await authTransaction(client=>client.query("UPDATE identity.message_attempts SET status='accepted',provider_id=$1,updated_at=now() WHERE id=$2",[provider,issued]));
        } catch {
          // A timeout may still deliver: retain the expiring token, never automatically resend.
          await authTransaction(client=>client.query("UPDATE identity.message_attempts SET status='unknown',updated_at=now() WHERE id=$1",[issued]));
        }
      }
      return reply({message:'If eligible, a verification or recovery link has been requested. Check your phone; you can retry later.'});
    }
    if(['verify','reset'].includes(action)) {
      if(typeof body.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.token))return reply({error:'Invalid or expired link.'},400);
      // Set the password at proof-of-phone possession, preventing pre-registration takeover.
      validatePassword(body.password);
      const allowed=await authTransaction(async client=>await rateLimit(client,'consume',tokenDigest(body.token as string),10)&&await rateLimit(client,'global-consume','all',100));
      if(!allowed)return reply({error:'Try again later.'},429);
      const available=await authTransaction(client=>client.query(`SELECT 1 FROM identity.tokens WHERE token_hash=$1 AND purpose=$2 AND consumed_at IS NULL AND expires_at>now()`,[tokenDigest(body.token as string),action==='verify'?'verify_phone':'reset_password']));
      if(!available.rowCount)return reply({error:'Invalid or expired link.'},400);
      const hash=await hashPassword(body.password as string);
      const consumed=await authTransaction(async client=>{
        const record=(await client.query(`SELECT t.* FROM identity.tokens t JOIN identity.users u ON u.id=t.user_id WHERE t.token_hash=$1 AND t.purpose=$2 AND t.consumed_at IS NULL AND t.expires_at>now() AND u.disabled_at IS NULL FOR UPDATE OF t,u`,[tokenDigest(body.token as string),action==='verify'?'verify_phone':'reset_password'])).rows[0];
        if(!record?.user_id)return false;
        if(action==='verify') { const completion=await client.query('SELECT identity.finalize_member($1,$2,$3,$4) AS ok',[record.user_id,record.branch_id,record.enrollment_name,hash]);if(!completion.rows[0]?.ok)return false; }
        else await client.query('UPDATE identity.users SET password_hash=$1,updated_at=now() WHERE id=$2 AND disabled_at IS NULL',[hash,record.user_id]);
        await client.query('UPDATE identity.tokens SET consumed_at=now() WHERE user_id=$1 AND purpose=$2',[record.user_id,record.purpose]);
        await client.query('UPDATE identity.sessions SET revoked_at=now() WHERE user_id=$1',[record.user_id]);await client.query('INSERT INTO identity.audit_events(user_id,action) VALUES($1,$2)',[record.user_id,action]);return true;
      });return consumed?reply({ok:true}):reply({error:'Invalid or expired link.'},400);
    }
    if(action==='invite-enroll'||action==='invite-accept') {
      if(typeof body.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.token)||typeof body.password!=='string'||body.password.length>128)return reply({error:'Invalid credentials.'},400);
      const allowed=await authTransaction(client=>rateLimit(client,'invite',tokenDigest(body.token as string),10));
      if(!allowed)return reply({error:'Try again later.'},429);
      const result=await authTransaction(async client=>{
        const invitation=(await client.query(`SELECT t.*,u.password_hash,u.phone_verified_at,u.disabled_at FROM identity.tokens t JOIN identity.users u ON u.id=t.user_id
          WHERE t.token_hash=$1 AND t.purpose='staff_invite' AND t.consumed_at IS NULL AND t.expires_at>now() FOR UPDATE OF t,u`,[tokenDigest(body.token as string)])).rows[0];
        if(!invitation||invitation.disabled_at||!invitation.phone_verified_at||!await verifyPassword(invitation.password_hash,body.password as string))return null;
        if(action==='invite-enroll') {
          const totp=newTotp(invitation.phone);
          await client.query('UPDATE identity.tokens SET enrollment_secret=$1 WHERE token_hash=$2',[encryptSecret(totp.secret.base32),tokenDigest(body.token as string)]);
          return {uri:totp.toString(),secret:totp.secret.base32};
        }
        if(!invitation.enrollment_secret)return null;
        const counter=totpCounter(decryptSecret(invitation.enrollment_secret),body.totp);if(counter===null)return null;
        await client.query('UPDATE identity.users SET totp_secret_encrypted=$1,totp_last_counter=$2 WHERE id=$3',[invitation.enrollment_secret,counter,invitation.user_id]);
        await client.query(`INSERT INTO identity.memberships(user_id,branch_id,role) VALUES($1,$2,$3) ON CONFLICT(user_id,branch_id) DO UPDATE SET role=excluded.role`,[invitation.user_id,invitation.branch_id,invitation.invited_role]);
        await client.query('UPDATE identity.tokens SET consumed_at=now(),enrollment_secret=NULL WHERE token_hash=$1',[tokenDigest(body.token as string)]);
        await client.query('UPDATE identity.sessions SET revoked_at=now() WHERE user_id=$1',[invitation.user_id]);await client.query("INSERT INTO identity.audit_events(user_id,branch_id,action) VALUES($1,$2,'staff_invitation_accepted')",[invitation.user_id,invitation.branch_id]);return {ok:true};
      });return result?reply(result):reply({error:'Invalid invitation or credentials.'},400);
    }
    return reply({error:'Not found.'},404);
  } catch {
    // Never return SQL, URLs, secrets, phone existence or provider error bodies.
    return reply({error:'Request could not be completed. Check the fields or try again later.'},400);
  }
}
