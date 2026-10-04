const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {messagingConfig,sendMessage,readReport}=require('../lib/server/messaging-provider.cjs');
const {processOne}=require('../scripts/messaging-worker.cjs');
const config={key:'fixture-only',sender:'FGC'},job={id:'fixture',lease_token:'fixture',work:'send',phone:'+233241234567',body:'Fixture announcement',provider_sender:'FGC',provider_campaign_id:'campaign-fixture'};
test('SMS transport distinguishes acceptance, rejection and uncertain sends without OTP or invented idempotency',async()=>{
 assert.throws(()=>messagingConfig({}),/not configured/);
 const accepted=await sendMessage(job,config,async(url,options)=>{assert.equal(url.hostname,'api.mnotify.com');assert.equal(url.pathname,'/api/sms/quick');assert.equal(options.redirect,'error');const body=JSON.parse(options.body);assert.deepEqual(body.recipient,['233241234567']);assert.equal(body.message,job.body);assert.equal(body.is_schedule,false);assert.equal(body.sms_type,undefined);return Response.json({status:'success',code:'2000',summary:{total_sent:1,total_rejected:0,_id:'campaign-fixture'}});});
 assert.equal(accepted.result,'accepted');
 assert.equal((await sendMessage(job,config,async()=>{throw new Error('Fixture timeout');})).result,'uncertain');
 assert.equal((await sendMessage(job,config,async()=>Response.json({summary:{total_sent:0,total_rejected:1}}))).result,'rejected');
 assert.equal((await sendMessage(job,config,async()=>Response.json({status:'success',code:'2000',summary:{total_sent:1,total_rejected:0}}))).result,'uncertain');
 assert.equal((await sendMessage(job,config,async()=>new Response('not JSON',{status:502}))).result,'uncertain');
});
test('authenticated reports must match campaign, recipient, sender and message before claiming delivery',async()=>{
 const row={campaign_id:job.provider_campaign_id,recipient:job.phone.slice(1),sender:job.provider_sender,message:job.body,status:'DELIVERED'};
 const report=override=>async(url,options)=>{assert.equal(url.pathname,'/api/campaign/campaign-fixture');assert.equal(options.method,'GET');return Response.json({status:'success',report:[{...row,...override}]});};
 assert.equal((await readReport(job,config,report({}))).result,'delivered');assert.equal((await readReport(job,config,report({status:'SUBMITTED'}))).result,'accepted');assert.equal((await readReport(job,config,report({status:'UNDELIVERED'}))).result,'failed');
 for(const override of [{campaign_id:'forged'},{recipient:'233999999999'},{sender:'OTHER'},{message:'wrong'},{status:'UNKNOWN'}])assert.equal((await readReport(job,config,report(override))).result,'unknown');
 assert.equal((await readReport(job,config,async()=>{throw Error('Unreachable');})).result,'unknown');
 assert.equal((await readReport(job,config,async()=>Response.json({status:'success',report:[row,row]}))).result,'unknown');
});
test('worker shutdown and pre-send rejection prevent HTTP; post-start errors preserve uncertainty',async()=>{
 let requests=0;const stopped=new AbortController();stopped.abort();assert.equal(await processOne({query:()=>{throw Error('Must not claim');}},{config,signal:stopped.signal}),false);
 const queries=[];const database={query:async(sql,params)=>{queries.push([sql,params]);if(sql.includes('claim_message'))return {rows:[job]};if(sql.includes('begin_message'))return {rows:[{ok:true}]};return {rows:[{ok:true}]};}};
 await processOne(database,{config,fetcher:async()=>{requests++;throw Error('Connection lost');}});assert.equal(requests,1);assert.equal(queries.at(-1)[1][2],'uncertain');
 await processOne({query:async sql=>sql.includes('claim_message')?{rows:[job]}:{rows:[{ok:false}]}},{config,fetcher:async()=>{throw Error('Must not send');}});
 const {databaseConfig}=require('../lib/server/database-config.cjs');assert.throws(()=>databaseConfig({DATABASE_URL:'postgresql://x:y@db/app'},'messaging'),/MESSAGING_DATABASE_URL/);
});
test('PostgreSQL outbox enforces consent, leases, crash recovery, bounded retries and role separation',async()=>{
 const {PGlite}=require('@electric-sql/pglite'),{createHash,randomUUID}=require('node:crypto');const db=new PGlite({extensions:{pg_trgm:require('@electric-sql/pglite/contrib/pg_trgm').pg_trgm}});try{
  await db.exec('CREATE ROLE fgc_owner;CREATE ROLE fgc_runtime;CREATE ROLE fgc_auth;CREATE ROLE fgc_messaging;');const databaseName=(await db.query('SELECT current_database() AS name')).rows[0].name;
  await db.exec('GRANT CREATE ON DATABASE "'+databaseName+'" TO fgc_owner;ALTER SCHEMA public OWNER TO fgc_owner;SET ROLE fgc_owner;CREATE TABLE public.schema_migrations(name text PRIMARY KEY,checksum text NOT NULL)');
  for(const file of fs.readdirSync('db/migrations').filter(n=>n.endsWith('.sql')).sort())await db.exec(fs.readFileSync('db/migrations/'+file,'utf8'));
  const branch=(await db.query("INSERT INTO public.branches(name,registration_enabled) VALUES('Queue fixture',true) RETURNING id")).rows[0].id,other=(await db.query("INSERT INTO public.branches(name,registration_enabled) VALUES('Other fixture',true) RETURNING id")).rows[0].id;
  async function actor(phone,name,role,scope=branch,consent=true){const uid=(await db.query('SELECT identity.register_member($1,$2,$3,$4) AS id',[phone,'unused',name,scope])).rows[0].id;await db.query('SELECT identity.finalize_member($1,$2,$3,$4)',[uid,scope,name,'unused']);await db.query('UPDATE identity.memberships SET role=$1 WHERE user_id=$2',[role,uid]);await db.query('INSERT INTO public.notification_preferences(user_id,sms) VALUES($1,$2)',[uid,consent]);await db.query("INSERT INTO identity.sessions(token_hash,user_id,branch_id,expires_at,mfa_verified_at) VALUES($1,$2,$3,now()+interval '1 hour',now())",[createHash('sha256').update(name).digest('hex'),uid,scope]);return uid;}
  const sender=await actor('+233241234561','staff','pastor',branch,false),recipient=await actor('+233241234562','recipient','member'),optout=await actor('+233241234563','optout','member',branch,false);
  await actor('+233241234564','foreign','member',other,true);
  await db.query("INSERT INTO public.members(branch_id,first_name,last_name,phone) VALUES($1,'Unlinked','Guest','+233241234565')",[branch]);
  async function role(name,operation,token){await db.exec('BEGIN;SET LOCAL ROLE '+name);try{if(token)await db.query("SELECT set_config('fgc.session_token',$1,true)",[token]);const result=await operation();await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
  const staff=operation=>role('fgc_runtime',operation,'staff'),worker=operation=>role('fgc_messaging',operation);
  assert.equal((await staff(()=>db.query('SELECT * FROM identity.broadcast_recipients(NULL)'))).rows.length,1);
  await assert.rejects(role('fgc_runtime',()=>db.query("SELECT identity.queue_broadcast(gen_random_uuid(),'fixture','body',NULL,'FGC')"),'recipient'),/Access denied/);
  await assert.rejects(staff(()=>db.query('SELECT identity.claim_message()')),/permission denied/);await assert.rejects(worker(()=>db.query('SELECT * FROM identity.users')),/permission denied/);
  async function queue(operation=randomUUID(),message='Fixture message'){return (await staff(()=>db.query('SELECT identity.queue_broadcast($1,$2,$3,NULL,$4) AS id',[operation,message,message,'FGC']))).rows[0].id;}
  const operation=randomUUID(),campaign=await queue(operation);assert.equal(await queue(operation),campaign);await assert.rejects(queue(operation,'Different message'),/conflict/);
  assert.equal((await db.query('SELECT recipient_count FROM public.broadcasts WHERE id=$1',[campaign])).rows[0].recipient_count,1);
  await assert.rejects(staff(()=>db.query("UPDATE public.message_deliveries SET state='delivered'")),/permission denied/);
  let lease=(await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows[0];assert.ok(lease);assert.equal((await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows.length,0);
  // Crash before the durable HTTP checkpoint: safely reclaim the same job.
  await db.query("UPDATE public.message_deliveries SET lease_until=now()-interval '1 second' WHERE id=$1",[lease.id]);const priorLease=lease.lease_token;
  lease=(await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows[0];assert.notEqual(lease.lease_token,priorLease);assert.equal(lease.work,'send');
  assert.equal((await worker(()=>db.query('SELECT identity.begin_message($1,$2,$3) AS ok',[lease.id,priorLease,'FGC']))).rows[0].ok,false);
  assert.equal((await worker(()=>db.query('SELECT identity.begin_message($1,$2,$3) AS ok',[lease.id,lease.lease_token,'FGC']))).rows[0].ok,true);
  assert.equal((await worker(()=>db.query('SELECT identity.begin_message($1,$2,$3) AS ok',[lease.id,lease.lease_token,'FGC']))).rows[0].ok,false);
  // Crash after checkpoint: uncertain, never another automatic HTTP send.
  await db.query("UPDATE public.message_deliveries SET lease_until=now()-interval '1 second' WHERE id=$1",[lease.id]);assert.equal((await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows.length,0);
  assert.equal((await db.query('SELECT state FROM public.message_deliveries WHERE id=$1',[lease.id])).rows[0].state,'uncertain');
  await assert.rejects(staff(()=>db.query("SELECT identity.retry_message($1,'blind retry',NULL)",[lease.id])),/reference is required/);
  await staff(()=>db.query("SELECT identity.retry_message($1,'Matched portal campaign','history-fixture')",[lease.id]));
  lease=(await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows[0];assert.equal(lease.work,'report');
  await worker(()=>db.query("SELECT identity.finish_message($1,$2,'delivered',NULL)",[lease.id,lease.lease_token]));
  assert.equal((await db.query('SELECT state,attempts FROM public.message_deliveries WHERE id=$1',[lease.id])).rows[0].state,'delivered');
  assert.equal((await worker(()=>db.query("SELECT identity.finish_message($1,$2,'failed',NULL) AS ok",[lease.id,lease.lease_token]))).rows[0].ok,false);
  // Opting out after queueing suppresses dispatch even with a stored snapshot.
  const pending=await queue();await db.query('UPDATE public.notification_preferences SET sms=false WHERE user_id=$1',[recipient]);assert.equal((await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows.length,0);
  assert.equal((await db.query('SELECT state FROM public.message_deliveries WHERE broadcast_id=$1',[pending])).rows[0].state,'suppressed');
  await db.query('UPDATE public.notification_preferences SET sms=true WHERE user_id=$1',[recipient]);
  const retryCampaign=await queue();lease=(await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows[0];
  for(let attempt=1;attempt<=3;attempt++){
   await worker(()=>db.query('SELECT identity.begin_message($1,$2,$3)',[lease.id,lease.lease_token,'FGC']));await worker(()=>db.query("SELECT identity.finish_message($1,$2,'rejected',NULL)",[lease.id,lease.lease_token]));
   await assert.rejects(staff(()=>db.query("SELECT identity.retry_message($1,'Reconciliation cannot resend',NULL,true)",[lease.id])),/Only failed/);
   if(attempt<3){await staff(()=>db.query("SELECT identity.retry_message($1,'Corrected confirmed rejection',NULL)",[lease.id]));assert.equal((await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows.length,0);await db.query('UPDATE public.message_deliveries SET next_attempt_at=now() WHERE id=$1',[lease.id]);lease=(await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows[0];}
  }
  const exhausted=(await db.query('SELECT id,attempts,state FROM public.message_deliveries WHERE broadcast_id=$1',[retryCampaign])).rows[0];assert.equal(exhausted.attempts,3);await assert.rejects(staff(()=>db.query("SELECT identity.retry_message($1,'Fourth send',NULL)",[exhausted.id])),/Only failed/);
  assert.equal((await db.query('SELECT * FROM public.message_deliveries WHERE user_id=$1',[optout])).rows.length,0);
  // Consent changes between claiming and the durable checkpoint also prevent sending.
  await queue();lease=(await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows[0];
  await db.query('UPDATE public.notification_preferences SET sms=false WHERE user_id=$1',[recipient]);
  assert.equal((await worker(()=>db.query('SELECT identity.begin_message($1,$2,$3) AS ok',[lease.id,lease.lease_token,'FGC']))).rows[0].ok,false);
  await db.query('UPDATE public.notification_preferences SET sms=true WHERE user_id=$1',[recipient]);
  // Unavailable reports exhaust their budget without upgrading acceptance to delivery.
  await queue();lease=(await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows[0];
  await worker(()=>db.query('SELECT identity.begin_message($1,$2,$3)',[lease.id,lease.lease_token,'FGC']));
  await worker(()=>db.query("SELECT identity.finish_message($1,$2,'accepted','report-budget')",[lease.id,lease.lease_token]));
  for(let report=0;report<12;report++){
   await db.query('UPDATE public.message_deliveries SET next_attempt_at=now() WHERE id=$1',[lease.id]);
   lease=(await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows[0];assert.equal(lease.work,'report');
   await worker(()=>db.query("SELECT identity.finish_message($1,$2,'unknown',NULL)",[lease.id,lease.lease_token]));
  }
  const reportBudget=(await db.query('SELECT state,report_attempts,next_attempt_at FROM public.message_deliveries WHERE id=$1',[lease.id])).rows[0];
  assert.equal(reportBudget.state,'accepted');assert.equal(reportBudget.report_attempts,12);assert.equal(reportBudget.next_attempt_at,null);
  assert.equal((await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows.length,0);
  const revoked=await queue();await db.query("UPDATE identity.memberships SET role='member' WHERE user_id=$1",[sender]);assert.equal((await worker(()=>db.query('SELECT * FROM identity.claim_message()'))).rows.length,0);assert.equal((await db.query('SELECT state FROM public.message_deliveries WHERE broadcast_id=$1',[revoked])).rows[0].state,'suppressed');
 }finally{await db.close();}
});
