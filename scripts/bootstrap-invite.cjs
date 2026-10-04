// Controlled first-administrator provisioning. No password or token is printed.
const {Client}=require('pg');
const {randomBytes,createHash}=require('node:crypto');
const {parsePhoneNumberFromString}=require('libphonenumber-js/max');
const {databaseConfig}=require('../lib/server/database-config.cjs');
async function main(){
 const phone=parsePhoneNumberFromString(process.env.BOOTSTRAP_PHONE||'');
 const branch=process.env.BOOTSTRAP_BRANCH_ID;
 if(!phone?.isValid()||!branch||!process.env.MNOTIFY_API_KEY||!process.env.MNOTIFY_SENDER_ID||!process.env.APP_ORIGIN)throw Error('Missing configuration');
 const origin=new URL(process.env.APP_ORIGIN);if(origin.protocol!=='https:')throw Error('HTTPS required');
 const sender=process.env.MNOTIFY_SENDER_ID;if(sender.length>11)throw Error('Invalid sender');
 const client=new Client(databaseConfig(process.env,'migration'));await client.connect();
 const token=randomBytes(32).toString('base64url'),hash=createHash('sha256').update(token).digest('hex');
 try{
  await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(74120302)');
  const existing=await client.query("SELECT 1 FROM identity.memberships WHERE role='admin' LIMIT 1");if(existing.rowCount)throw Error('Administrator already exists');
  const user=await client.query('SELECT id FROM identity.users WHERE phone=$1 AND phone_verified_at IS NOT NULL AND disabled_at IS NULL',[phone.number]);if(!user.rowCount)throw Error('Verified user required');
  const available=await client.query('SELECT id FROM public.branches WHERE id=$1 AND archived_at IS NULL',[branch]);if(!available.rowCount)throw Error('Unknown branch');
  await client.query("UPDATE identity.tokens SET consumed_at=now(),enrollment_secret=NULL WHERE purpose='staff_invite' AND invited_role='admin' AND consumed_at IS NULL");
  await client.query("INSERT INTO identity.tokens(token_hash,user_id,phone,purpose,branch_id,invited_role,expires_at) VALUES($1,$2,$3,'staff_invite',$4,'admin',now()+interval '24 hours')",[hash,user.rows[0].id,phone.number,branch]);
  await client.query("INSERT INTO identity.audit_events(user_id,branch_id,action) VALUES($1,$2,'bootstrap_invitation')",[user.rows[0].id,branch]);await client.query('COMMIT');
  const url=new URL('https://api.mnotify.com/api/sms/quick');url.searchParams.set('key',process.env.MNOTIFY_API_KEY);
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(10000),body:JSON.stringify({recipient:[phone.number.slice(1)],sender,message:`Fountain Gate staff invitation: ${origin.origin}/login#invite=${token} . Expires in 24 hours.`,is_schedule:false,sms_type:'otp'})});
  const data=await response.json();if(!response.ok||data.status!=='success'||String(data.code)!=='2000'||Number(data.summary?.total_sent)!==1||Number(data.summary?.total_rejected)>0)throw Error('Provider rejected invitation');
  console.log('Bootstrap invitation accepted by SMS provider. Accept the invitation using your existing password before sign-in.');
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{await client.end();}
}
main().catch(()=>{console.error('Bootstrap invitation failed. Verify configuration, verified account, branch and provider balance. A provider timeout may still deliver; avoid automatic retries.');process.exitCode=1;});
