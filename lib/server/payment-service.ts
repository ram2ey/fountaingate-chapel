import 'server-only';
import { createHash,randomUUID } from 'node:crypto';
import { authorizedTransaction } from './auth';
import { authTransaction } from './auth-database';
import { allowedFields,identifier,InputError } from './core-validation';
import { amountMinor,givingFund } from './finance-validation';
import { initiateHubtel,paymentConfig,paymentReference,PaymentUnavailable,verifyHubtel } from './hubtel';
export async function createPayment(body:Record<string,unknown>){
 paymentConfig();allowedFields(body,['operation_id','amount','fund','anonymous']);
 const operation=identifier(body.operation_id),amount=amountMinor(body.amount),fund=givingFund(body.fund);
 if(typeof body.anonymous!=='boolean')throw new InputError('Invalid anonymous selection.');
 const fingerprint=createHash('sha256').update(JSON.stringify([amount,fund,body.anonymous])).digest('hex');
 const result=await authorizedTransaction('self',async client=>{
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,502))',[operation]);
  const existing=(await client.query('SELECT * FROM public.payment_attempts WHERE operation_id=$1',[operation])).rows[0];
  if(existing){if(existing.fingerprint!==fingerprint)throw new InputError('Payment operation conflicts with an earlier submission.');return {attempt:existing,created:false};}
  const member=body.anonymous?null:(await client.query('SELECT id FROM public.members WHERE profile_id=identity.actor() AND archived_at IS NULL')).rows[0]?.id;
  if(!body.anonymous&&!member)throw new InputError('An active linked member record is required.');
  const pending=(await client.query("SELECT count(*)::int AS count FROM public.payment_attempts WHERE actor_id=identity.actor() AND created_at>now()-interval '1 hour'")).rows[0].count;
  if(pending>=10)throw new InputError('Please reconcile existing payments before creating more.');
  const attempt=(await client.query("INSERT INTO public.payment_attempts(branch_id,actor_id,member_id,operation_id,fingerprint,provider,reference,amount_minor,currency,fund) VALUES(identity.branch(),identity.actor(),$1,$2,$3,'hubtel',$4,$5,'GHS',$6) RETURNING *",[member,operation,fingerprint,randomUUID().replaceAll('-',''),amount,fund])).rows[0];return {attempt,created:true};
 });
 if(!result.created){if(!result.attempt.checkout_url)throw new PaymentUnavailable('The initialization outcome is uncertain. Check this reference before starting another payment: '+result.attempt.reference);return {reference:result.attempt.reference,status:result.attempt.status,checkout_url:result.attempt.status==='pending'?result.attempt.checkout_url:null};}
 const url=await initiateHubtel(result.attempt.reference,amount,fund);
 await authTransaction(client=>client.query('SELECT identity.save_checkout($1,$2)',[result.attempt.id,url]));
 return {reference:result.attempt.reference,status:'pending',checkout_url:url};
}
export async function reconcilePayment(value:unknown,callback=false){
 const reference=paymentReference(value);
 if(!callback)await authorizedTransaction('self',async client=>{if(!(await client.query("SELECT id FROM public.payment_attempts WHERE reference=$1 AND (actor_id=identity.actor() OR identity.has_capability('finance'))",[reference])).rowCount)throw new InputError('Payment unavailable.');});
 return authTransaction(async client=>{
  const attempt=(await client.query('SELECT * FROM identity.lock_payment($1)',[reference])).rows[0];if(!attempt)throw new InputError('Payment unavailable.');
  // Serialize verification across app replicas and prevent callback bursts from amplifying traffic.
  if(attempt.verified_at&&Date.now()-new Date(attempt.verified_at).getTime()<30000)return {reference,status:attempt.status};
  const outcome=await verifyHubtel(reference,String(attempt.amount_minor));
  const event=createHash('sha256').update(JSON.stringify([reference,outcome])).digest('hex');
  await client.query('SELECT identity.post_verified_payment($1,$2,$3,$4,$5,$6,$7,$8)',[reference,outcome.transaction,outcome.amount,outcome.currency,outcome.state,new Date(),outcome.refunded,event]);
  const updated=(await client.query('SELECT status FROM public.payment_attempts WHERE reference=$1',[reference])).rows[0];return {reference,status:updated.status};
 });
}
