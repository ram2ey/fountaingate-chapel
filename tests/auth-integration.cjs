const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Module=require('node:module');
const ts=require('typescript');
const {PGlite}=require('@electric-sql/pglite');
const {TOTP,Secret}=require('otpauth');

test('real auth handlers persist accounts, verify phones, change credentials and revoke sessions',async()=>{
 const db=new PGlite();const jar=new Map();let delivered=[];
 const originalLoad=Module._load,originalTs=require.extensions['.ts'];
 const originalFetch=global.fetch;const saved={...process.env};
 try{
  process.env.APP_ORIGIN='https://church.test';process.env.AUTH_ENCRYPTION_KEY=Buffer.alloc(32,7).toString('base64');
  process.env.MNOTIFY_API_KEY='test-only';process.env.MNOTIFY_SENDER_ID='FGC';
  await db.exec('CREATE ROLE fgc_runtime;CREATE ROLE fgc_auth;CREATE ROLE fgc_owner;');
 const dbname=(await db.query('SELECT current_database() AS name')).rows[0].name;
 await db.exec('GRANT CREATE ON DATABASE "'+dbname+'" TO fgc_owner;ALTER SCHEMA public OWNER TO fgc_owner;SET ROLE fgc_owner;');
 await db.exec('CREATE TABLE public.schema_migrations(name text PRIMARY KEY,checksum text NOT NULL)');
  for(const file of fs.readdirSync('db/migrations').filter(n=>n.endsWith('.sql')).sort())await db.exec(fs.readFileSync('db/migrations/'+file,'utf8'));
 await db.exec('RESET ROLE');
  const branch=(await db.query("INSERT INTO public.branches(name,registration_enabled) VALUES('Main',true) RETURNING id")).rows[0].id;
  const query=async(text,params=[])=>{const result=await db.query(text,params);return {...result,rowCount:result.rows.length || result.affectedRows || 0};};
  const transaction=role=>async(operation)=>{
   await db.exec('BEGIN;SET LOCAL ROLE '+role);
   try{const value=await operation({query});await db.exec('COMMIT');return value;}
   catch(error){await db.exec('ROLLBACK');throw error;}
  };
  require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
  Module._load=function(name,parent,isMain){
   if(name==='server-only')return {};
   if(name==='next/headers')return {cookies:async()=>({get:key=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key,value,options)=>{assert.equal(options.httpOnly,true);assert.equal(options.sameSite,'strict');jar.set(key,value);},delete:key=>jar.delete(key)})};
   if(name.endsWith('/auth-database')||name==='./auth-database')return {authTransaction:transaction('fgc_auth')};
   if(name==='./database')return {withTransaction:transaction('fgc_runtime')};
   return originalLoad.call(this,name,parent,isMain);
  };
  global.fetch=async(url,options)=>{
   assert.equal(new URL(url).hostname,'api.mnotify.com');const body=JSON.parse(options.body);delivered.push(body);
   return Response.json({status:'success',code:'2000',summary:{_id:'fixture',total_rejected:0,total_sent:1}});
  };
  const route=require('../app/api/auth/[action]/route.ts');
  const call=(action,body,origin='https://church.test')=>route.POST(new Request('https://church.test/api/auth/'+action,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}),{params:Promise.resolve({action})});
  const phone='+233241234567',password='a long initial password';
  assert.equal((await call('register',{phone,password,branch_id:branch,full_name:'Member'},'https://evil.test')).status,400);
  assert.equal((await db.query('SELECT * FROM identity.users')).rows.length,0);
  assert.equal((await call('register',{phone,password:'pre-registration attacker password',branch_id:branch,full_name:'Member'})).status,200);
  assert.equal((await db.query('SELECT * FROM public.members')).rows.length,0);
  assert.equal(delivered.length,1);
  assert.equal((await call('login',{phone,password,branch_id:branch})).status,401);
  const linkToken=delivered[0].message.match(/#verify=([A-Za-z0-9_-]+)/)[1];
  assert.equal((await call('verify',{token:linkToken,password})).status,200);
  assert.equal((await call('verify',{token:linkToken,password})).status,400);
  assert.equal((await call('register',{phone,password:'different valid password',branch_id:branch,full_name:'Duplicate'})).status,200);
  assert.equal((await db.query('SELECT * FROM public.members')).rows.length,1);
  assert.equal((await call('login',{phone,password:'pre-registration attacker password',branch_id:branch})).status,401);
  assert.equal((await call('login',{phone,password,branch_id:branch})).status,200);
  const session=jar.get('fgc_session');assert.ok(session);
  const me=await route.GET(new Request('https://church.test/api/auth/session'),{params:Promise.resolve({action:'session'})});assert.equal((await me.json()).user.phone,phone);
  assert.equal((await call('password',{current_password:'wrong',password:'a different long password'})).status,400);
  assert.equal((await call('password',{current_password:password,password:'a different long password'})).status,200);
  assert.equal(jar.has('fgc_session'),false);
  jar.set('fgc_session',session);
  assert.equal((await (await route.GET(new Request('https://church.test'),{params:Promise.resolve({action:'session'})})).json()).user,null);
  jar.clear();
  assert.equal((await call('login',{phone,password,branch_id:branch})).status,401);
  assert.equal((await call('login',{phone,password:'a different long password',branch_id:branch})).status,200);
  assert.equal((await call('logout',{})).status,200);
  assert.equal((await call('recovery',{phone})).status,200);
  const resetToken=delivered.at(-1).message.match(/#reset=([A-Za-z0-9_-]+)/)[1];
  assert.equal((await call('reset',{token:resetToken,password:'a recovered long password'})).status,200);
  assert.equal((await call('reset',{token:resetToken,password:'replay recovered password'})).status,400);
  // Staff enrollment requires invitation possession, the existing password and proof of TOTP.
  const {newToken,tokenDigest}=require('../lib/server/auth.ts');const invitation=newToken();
  const uid=(await db.query('SELECT id FROM identity.users WHERE phone=$1',[phone])).rows[0].id;
  await db.query("INSERT INTO identity.tokens(token_hash,user_id,phone,purpose,branch_id,invited_role,expires_at) VALUES($1,$2,$3,'staff_invite',$4,'pastor',now()+interval '1 hour')",[tokenDigest(invitation),uid,phone,branch]);
  const enroll=await call('invite-enroll',{token:invitation,password:'a recovered long password'});assert.equal(enroll.status,200);const enrollment=await enroll.json();
  const totp=new TOTP({secret:Secret.fromBase32(enrollment.secret),algorithm:'SHA1',digits:6,period:30});
  assert.equal((await call('invite-accept',{token:invitation,password:'a recovered long password',totp:totp.generate()})).status,200);
  assert.equal((await call('login',{phone,password:'a recovered long password',branch_id:branch})).status,401);
  const last=await db.query('SELECT totp_last_counter FROM identity.users WHERE id=$1',[uid]);
  // Advance only the test fixture's replay marker; no production clock bypass exists.
  await db.query('UPDATE identity.users SET totp_last_counter=$1 WHERE id=$2',[Number(last.rows[0].totp_last_counter)-1,uid]);
  assert.equal((await call('login',{phone,password:'a recovered long password',branch_id:branch,totp:totp.generate()})).status,200);
  assert.equal((await call('login',{phone,password:'a recovered long password',branch_id:branch,totp:totp.generate()})).status,401);
  await db.query("UPDATE identity.memberships SET role='member' WHERE user_id=$1",[uid]);
  const {requirePageAccess}=require('../lib/server/page-access.ts');
  assert.equal(await requirePageAccess('staff'),false);
  assert.equal(await requirePageAccess('self'),true);
  const staff=require('../app/api/staff/[action]/route.ts');
  const forbiddenInvite=await staff.POST(new Request('https://church.test/api/staff/invite',{method:'POST',headers:{origin:'https://church.test','content-type':'application/json'},body:JSON.stringify({phone:'+233241234568',role:'admin'})}),{params:Promise.resolve({action:'invite'})});assert.equal(forbiddenInvite.status,403);
  const after=await route.GET(new Request('https://church.test'),{params:Promise.resolve({action:'session'})});assert.equal((await after.json()).user.role,'member');

  // Exercise narrow kiosk/device and private-file APIs with the same live session fixture.
  await db.query("UPDATE identity.memberships SET role='pastor' WHERE user_id=$1",[uid]);
  const kiosk=require('../app/api/kiosk/[action]/route.ts');
  const kioskCall=(action,body,device)=>kiosk.POST(new Request('https://church.test/api/kiosk/'+action,{method:'POST',headers:{origin:'https://church.test','content-type':'application/json',...(device?{authorization:'Bearer '+device}:{})},body:JSON.stringify(body)}),{params:Promise.resolve({action})});
  const service=(await db.query("INSERT INTO public.services(branch_id,name,starts_at,ends_at) VALUES($1,'Sunday',now()-interval '10 minutes',now()+interval '1 hour') RETURNING id",[branch])).rows[0].id;
  const deviceResponse=await kioskCall('device',{name:'Test-only device'});assert.equal(deviceResponse.status,200);const device=await deviceResponse.json();
  const qrResponse=await kioskCall('qr',{service_id:service});assert.equal(qrResponse.status,200);const qr=await qrResponse.json();
  assert.equal((await kioskCall('checkin',{token:qr.token},device.token)).status,200);
  assert.equal((await kioskCall('checkin',{token:qr.token},device.token)).status,400);
  assert.equal((await db.query('SELECT * FROM public.attendance')).rows.length,1);
  assert.equal((await kioskCall('revoke',{device_id:device.id})).status,200);
  const secondQR=await (await kioskCall('qr',{service_id:service})).json();
  assert.equal((await kioskCall('checkin',{token:secondQR.token},device.token)).status,400);
  const path=require('node:path'),os=require('node:os');const uploadDirectory=fs.mkdtempSync(path.join(os.tmpdir(),'fgc-auth-test-'));
  process.env.UPLOAD_DIRECTORY=uploadDirectory;
  try{
   const upload=require('../app/api/documents/route.ts'),download=require('../app/api/documents/[id]/route.ts');
   const file=new Request('https://church.test/api/documents',{method:'POST',headers:{origin:'https://church.test','content-type':'application/pdf','x-document-title':'Private fixture'},body:'%PDF-1.4 test fixture'});
   const uploaded=await upload.POST(file);assert.equal(uploaded.status,201);const document=await uploaded.json();
   const fetched=await download.GET(new Request('https://church.test/api/documents/'+document.id),{params:Promise.resolve({id:document.id})});assert.equal(fetched.status,200);assert.equal(await fetched.text(),'%PDF-1.4 test fixture');assert.equal(fetched.headers.get('cache-control'),'no-store');
   await db.query("UPDATE identity.memberships SET role='member' WHERE user_id=$1",[uid]);
   assert.equal((await download.GET(new Request('https://church.test'),{params:Promise.resolve({id:document.id})})).status,404);
   const forbidden=await upload.POST(new Request('https://church.test',{method:'POST',headers:{origin:'https://evil.test','content-type':'application/pdf','x-document-title':'Denied'},body:'%PDF-1.4'}));assert.equal(forbidden.status,403);
  }finally{
   // Only generated direct children of this uniquely allocated test directory are removed.
   for(const name of fs.readdirSync(uploadDirectory)){const target=path.resolve(uploadDirectory,name);assert.equal(path.dirname(target),path.resolve(uploadDirectory));fs.unlinkSync(target);}fs.rmdirSync(uploadDirectory);
  }

  const core=require('../lib/server/core-service.ts');
  await db.query("UPDATE identity.memberships SET role='pastor' WHERE user_id=$1",[uid]);
  const added=await core.mutateCore('members',{first_name:'Persisted',last_name:'Person',phone:'+233241234570',email:'',dob:'2000-02-29',address:'Private address',cell_group:'Group'});
  const directory=await core.readCore('members',new URL('https://church.test/api/core/members?search=Persisted'));assert.equal(directory.items.length,1);assert.equal(directory.items[0].id,added.id);
  await core.mutateCore('care',{member_id:added.id,body:'Confidential fixture',confidential:true,follow_up_date:'2026-12-01'});
  assert.equal((await core.readCore('care',new URL('https://church.test/api/core/care'))).items.length,1);
  await db.query("UPDATE identity.memberships SET role='admin' WHERE user_id=$1",[uid]);
  assert.equal((await core.readCore('care',new URL('https://church.test/api/core/care'))).items.length,0);
  await db.query("UPDATE identity.memberships SET role='pastor' WHERE user_id=$1",[uid]);
  await core.mutateCore('members',{id:added.id,action:'archive'});
  assert.equal((await core.readCore('care',new URL('https://church.test/api/core/care'))).items.length,0);
  await core.mutateCore('members',{id:added.id,action:'restore'});
  assert.equal((await core.readCore('care',new URL('https://church.test/api/core/care'))).items.length,1);
  await core.mutateCore('profile',{full_name:'Updated real profile',sms:true,email:false});
  const ownProfile=await core.readCore('profile',new URL('https://church.test/api/core/profile'));assert.equal(ownProfile.profile.full_name,'Updated real profile');assert.equal(ownProfile.preferences.sms,true);
  await assert.rejects(core.mutateCore('profile',{full_name:'Forbidden',sms:true,email:false,role:'admin'}),/Unsupported field/);
  const privatePrayer=await core.mutateCore('prayers',{title:'Private prayer',body:'Hidden to unrelated members',visibility:'private'});
  await core.mutateCore('prayers',{id:privatePrayer.id,action:'react',reacted:true});await core.mutateCore('prayers',{id:privatePrayer.id,action:'react',reacted:true});
  assert.equal((await core.readCore('prayers',new URL('https://church.test/api/core/prayers'))).items[0].reaction_count,1);
  await core.mutateCore('prayers',{id:privatePrayer.id,action:'comment',body:'Persisted comment'});
  await core.mutateCore('prayers',{id:privatePrayer.id,action:'update',body:'Persisted update'});
  assert.equal((await core.readCore('prayers',new URL('https://church.test/api/core/prayers?thread='+privatePrayer.id))).thread.length,2);
  const guest=require('../app/api/guest-intake/route.ts');await db.query('UPDATE public.branches SET guest_intake_enabled=true WHERE id=$1',[branch]);
  const guestBody={key:require('node:crypto').randomUUID(),branch_id:branch,first_name:'Guest',last_name:'Person',phone:'+233241234571',consent:true,prayer:'Guest confidential prayer'};
  const intake=()=>guest.POST(new Request('https://church.test/api/guest-intake',{method:'POST',headers:{origin:'https://church.test','content-type':'application/json'},body:JSON.stringify(guestBody)}));
  const firstIntake=await intake();assert.equal(firstIntake.status,201);const receipt=await firstIntake.json();const retry=await intake();assert.equal((await retry.json()).receipt,receipt.receipt);
  assert.equal((await db.query('SELECT * FROM public.guest_followups WHERE member_id=$1',[receipt.receipt])).rows.length,1);
  guestBody.first_name='Changed';assert.equal((await intake()).status,400);
  const guestRecord=(await core.readCore('guests',new URL('https://church.test/api/core/guests'))).items[0];
  await assert.rejects(core.mutateCore('guests',{id:guestRecord.id,stage:'completed',assigned_to:uid}),/one stage/);
  await core.mutateCore('guests',{id:guestRecord.id,stage:'welcomed',assigned_to:uid});
  await core.mutateCore('guests',{id:guestRecord.id,stage:'welcomed',assigned_to:uid});
  assert.equal((await db.query('SELECT * FROM public.followup_tasks WHERE member_id=$1',[receipt.receipt])).rows.length,1);
  const {nextBirthday}=require('../lib/server/core-validation.ts');assert.equal(nextBirthday('2000-02-29','2027-03-01'),'2028-02-29');assert.equal(nextBirthday('2000-02-29','2027-01-01'),'2027-02-28');
  await db.query("UPDATE identity.memberships SET role='member' WHERE user_id=$1",[uid]);
  await assert.rejects(core.readCore('members',new URL('https://church.test/api/core/members')),/Access denied/);
  // Phase 4 uses the same verified identity and actual PostgreSQL roles.
  const attendance=require('../lib/server/attendance-service.ts');
  await db.query("UPDATE identity.memberships SET role='pastor' WHERE user_id=$1",[uid]);
  await attendance.writeAttendance({action:'eligibility',member_id:added.id,expected_from:'2020-01-01T00:00:00Z',expected_until:''});
  const historic=[];
  for(let i=4;i>=1;i--){
   const end=new Date(Date.now()-i*86400000).toISOString(),start=new Date(Date.parse(end)-3600000).toISOString();
   historic.push({...(await attendance.writeAttendance({action:'service',name:'History '+i,event_type:'service',cell_group:'',starts_at:start,ends_at:end,attendance_eligible:true})),start,end});
  }
  await assert.rejects(transaction('fgc_runtime')(client=>client.query('SELECT identity.reconcile_attendance(100)')),/permission denied/);
  assert.equal((await db.query('SELECT identity.reconcile_attendance(2) AS n')).rows[0].n,2);
  assert.equal((await db.query('SELECT consecutive_absences FROM public.members WHERE id=$1',[added.id])).rows[0].consecutive_absences,2);
  assert.equal((await db.query('SELECT identity.reconcile_attendance(1) AS n')).rows[0].n,1);
  assert.equal((await db.query('SELECT status FROM public.members WHERE id=$1',[added.id])).rows[0].status,'at_risk');
  assert.equal((await db.query('SELECT identity.reconcile_attendance(100) AS n')).rows[0].n,1);
  assert.equal((await db.query('SELECT identity.reconcile_attendance(100) AS n')).rows[0].n,0);
  let riskMember=(await db.query('SELECT consecutive_absences,status FROM public.members WHERE id=$1',[added.id])).rows[0];assert.equal(riskMember.consecutive_absences,4);assert.equal(riskMember.status,'at_risk');
  const operation=require('node:crypto').randomUUID();const correction={action:'record',operation_id:operation,service_id:historic.at(-1).id,member_id:added.id,state:'excused',reason:'Test correction with real audit',recorded_at:historic.at(-1).start};
  const corrected=await attendance.writeAttendance(correction);assert.equal((await attendance.writeAttendance(correction)).id,corrected.id);
  await assert.rejects(attendance.writeAttendance({...correction,state:'present'}),/conflicts/);
  riskMember=(await db.query('SELECT consecutive_absences,status FROM public.members WHERE id=$1',[added.id])).rows[0];assert.equal(riskMember.consecutive_absences,0);assert.equal(riskMember.status,'active');
  const analytics=await attendance.readAttendance('analytics',null);assert.equal(analytics.services.length,4);assert.equal(analytics.average,0);assert.equal(analytics.services[0].excused,1);
  assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.audit_events WHERE entity_id=$1 AND actor_id=$2',[corrected.id,uid])).rows[0].n,1);
  await assert.rejects(attendance.writeAttendance({...correction,operation_id:require('node:crypto').randomUUID(),recorded_at:'2030-01-01T00:00:00Z'}),/Recorded time/);
  const household=await attendance.writeAttendance({action:'household',name:'Explicit fixture household'});await attendance.writeAttendance({action:'household_member',member_id:added.id,household_id:household.id});
  assert.equal((await attendance.readAttendance('households',null)).items[0].member_id,added.id);
  // Simulate a next-day upload using persisted token/service timestamps, not a production clock bypass.
  const liveDevice=await (await kioskCall('device',{name:'Offline fixture device'})).json();
  const offlineService=historic[0].id,offlineToken=newToken(),recorded=historic[0].start;
  await db.query("INSERT INTO identity.tokens(token_hash,user_id,purpose,branch_id,service_id,created_at,expires_at) VALUES($1,$2,'kiosk_lookup',$3,$4,$5::timestamptz-interval '1 minute',$5::timestamptz+interval '4 minutes')",[tokenDigest(offlineToken),uid,branch,offlineService,recorded]);
  const queued={operation_id:require('node:crypto').randomUUID(),service_id:offlineService,recorded_at:recorded,token:offlineToken};
  const uploaded=await kioskCall('upload',queued,liveDevice.token);assert.equal(uploaded.status,200);const ack=await uploaded.json();assert.equal(ack.operation_id,queued.operation_id);
  assert.equal((await kioskCall('upload',queued,liveDevice.token)).status,200);
  assert.equal((await kioskCall('upload',{...queued,operation_id:require('node:crypto').randomUUID()},liveDevice.token)).status,422);
  assert.equal((await db.query('SELECT recorded_at FROM public.attendance WHERE id=$1',[ack.id])).rows[0].recorded_at.toISOString(),recorded);
  await kioskCall('revoke',{device_id:liveDevice.id});assert.equal((await kioskCall('upload',queued,liveDevice.token)).status,401);
  // New accounts are not expected retrospectively, and cell membership is exact.
  const ownMember=(await db.query('SELECT id FROM public.members WHERE profile_id=$1',[uid])).rows[0].id;
  assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.service_expectations WHERE member_id=$1',[ownMember])).rows[0].n,0);
  const cellEnd=new Date(Date.now()-6*3600000).toISOString(),cellStart=new Date(Date.parse(cellEnd)-3600000).toISOString();
  const cell=await attendance.writeAttendance({action:'service',name:'Different cell',event_type:'cell',cell_group:'Unrelated',starts_at:cellStart,ends_at:cellEnd,attendance_eligible:true});
  await db.query('SELECT identity.reconcile_attendance(100)');assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.service_expectations WHERE service_id=$1',[cell.id])).rows[0].n,0);
  await assert.rejects(attendance.writeAttendance({action:'service',name:'Impossible date',event_type:'service',starts_at:'2026-02-31T10:00:00Z',ends_at:'2026-03-04T10:00:00Z',attendance_eligible:true}),/Invalid date/);
  await db.query("UPDATE identity.memberships SET role='member' WHERE user_id=$1",[uid]);await assert.rejects(attendance.readAttendance('analytics',null),/Access denied/);assert.ok((await attendance.readAttendance('personal',null)).items.length);
  // Phase 5: real ledger handlers, non-owner SQL permissions and external transport fixtures.
  const finance=require('../lib/server/finance-service.ts'),financeApi=require('../app/api/finance/route.ts');
  const crypto=require('node:crypto');
  await db.query("UPDATE identity.memberships SET role='admin' WHERE user_id=$1",[uid]);
  const manual={action:'manual',operation_id:crypto.randomUUID(),amount:'123.45',currency:'GHS',fund:'offering',method:'cash',reference:'quoted "reference", =SUM(1,2)',member_id:ownMember,given_at:'2026-01-01T00:00:00Z',reason:'Fixture only'};
  const posted=await finance.writeFinance(manual);assert.equal((await finance.writeFinance(manual)).id,posted.id);
  await assert.rejects(finance.writeFinance({...manual,amount:'123.46'}),/conflicts/);
  await assert.rejects(finance.writeFinance({...manual,operation_id:crypto.randomUUID(),amount:'-1'}),/positive/);
  await assert.rejects(finance.writeFinance({...manual,operation_id:crypto.randomUUID(),given_at:'2026-02-31T00:00:00Z'}),/Invalid date/);
  await assert.rejects(finance.writeFinance({...manual,operation_id:crypto.randomUUID(),fund:'invented'}),/supported/);
  await finance.writeFinance({...manual,operation_id:crypto.randomUUID(),currency:'USD',reference:'usd'});
  await finance.writeFinance({...manual,operation_id:crypto.randomUUID(),given_at:'2025-12-31T23:59:59Z',reference:'prior-year'});
  const reversal={action:'reverse',operation_id:crypto.randomUUID(),id:posted.id,amount:'23.45',reason:'Partial fixture reversal'};
  await finance.writeFinance(reversal);await finance.writeFinance(reversal);
  await assert.rejects(finance.writeFinance({...reversal,operation_id:crypto.randomUUID(),amount:'100.01'}),/exceeds/);
  const annual=await finance.readFinance(new URL('https://church.test/api/finance?year=2026'));assert.equal(annual.totals.find(t=>t.currency==='GHS').net_minor,'10000');assert.equal(annual.totals.find(t=>t.currency==='USD').net_minor,'12345');
  assert.equal(annual.monthly.find(t=>t.month==='2026-01'&&t.currency==='GHS').net_minor,'12345');
  const prior=await finance.readFinance(new URL('https://church.test/api/finance?year=2025'));assert.equal(prior.items.length,1);
  const {authorizedTransaction}=require('../lib/server/auth.ts');
  await assert.rejects(authorizedTransaction('finance',c=>c.query('UPDATE public.ledger_entries SET amount_minor=1')),/permission denied/);
  await assert.rejects(authorizedTransaction('finance',c=>c.query('DELETE FROM public.ledger_entries')),/permission denied/);
  await assert.rejects(authorizedTransaction('finance',c=>c.query("SELECT identity.post_verified_payment('fake','fake',1,'GHS','success',now(),0,'fake')")),/permission denied/);
  const csv=await financeApi.GET(new Request('https://church.test/api/finance?year=2026&format=csv'));assert.equal(csv.status,200);assert.match(await csv.text(),/quoted ""reference"", =SUM/);assert.equal(csv.headers.get('cache-control'),'no-store');
  const pdfResponse=await financeApi.GET(new Request('https://church.test/api/finance?year=2026&format=pdf'));assert.equal(pdfResponse.status,200);const pdfBytes=Buffer.from(await pdfResponse.arrayBuffer());assert.equal(pdfBytes.subarray(0,4).toString(),'%PDF');
  const {PDFDocument}=require('pdf-lib');assert.ok((await PDFDocument.load(pdfBytes)).getPageCount()>0);
  const givingReceipt=await finance.readFinance(new URL('https://church.test/api/finance?receipt='+posted.id+'&year=2025'));assert.equal(givingReceipt.items.length,2);assert.equal(givingReceipt.totals[0].net_minor,'10000');
  // Identical names never replace the member/profile relation.
  const duplicate=(await db.query("INSERT INTO public.members(branch_id,first_name,last_name) SELECT branch_id,first_name,last_name FROM public.members WHERE id=$1 RETURNING id",[ownMember])).rows[0].id;
  await finance.writeFinance({...manual,operation_id:crypto.randomUUID(),member_id:duplicate,reference:'same-name'});
  await db.query("UPDATE identity.memberships SET role='member' WHERE user_id=$1",[uid]);
  await assert.rejects(finance.readFinance(new URL('https://church.test/api/finance')),/Access denied/);
  assert.equal((await finance.readFinance(new URL('https://church.test/api/finance?scope=own&year=2026&member_id='+duplicate))).items.length,0);
  assert.equal((await finance.readFinance(new URL('https://church.test/api/finance?scope=own&year=2026'))).items.length,3);
  assert.equal((await financeApi.GET(new Request('https://church.test/api/finance?format=pdf'))).status,403);
  const payments=require('../lib/server/payment-service.ts'),payApi=require('../app/api/payments/[action]/route.ts'),callbackApi=require('../app/api/payments/callback/[token]/route.ts');
  await assert.rejects(payments.createPayment({}),/not configured/);
  Object.assign(process.env,{PAYMENTS_ENABLED:'true',HUBTEL_CONTRACT_CONFIRMED:'true',HUBTEL_CLIENT_ID:'fixture',HUBTEL_CLIENT_SECRET:'fixture-secret',HUBTEL_MERCHANT_ACCOUNT:'12345',HUBTEL_CALLBACK_TOKEN:Buffer.alloc(32,8).toString('base64url')});
  const smsFetch=global.fetch;let initialized=0,status='unpaid',providerAmount=50;
  global.fetch=async(url,options)=>{const address=new URL(url);assert.equal(options.headers.Authorization,'Basic '+Buffer.from('fixture:fixture-secret').toString('base64'));assert.equal(options.redirect,'error');
   if(address.hostname==='payproxyapi.hubtel.com'){initialized++;const body=JSON.parse(options.body);assert.equal(body.totalAmount,50);return Response.json({responseCode:'0000',data:{clientReference:body.clientReference,checkoutUrl:'https://pay.hubtel.com/fixture-checkout'}});}
   assert.equal(address.hostname,'checkout.hubtel.com');return Response.json({data:{clientReference:address.searchParams.get('clientReference'),transactionID:'fixture-'+address.searchParams.get('clientReference'),amount:providerAmount,currencyCode:'GHS',status}});
  };
  const paymentBody={operation_id:crypto.randomUUID(),amount:'50.00',fund:'tithe',anonymous:false};
  const attempt=await payments.createPayment(paymentBody);assert.equal((await payments.createPayment(paymentBody)).reference,attempt.reference);assert.equal(initialized,1);
  assert.equal((await db.query('SELECT * FROM public.ledger_entries WHERE reference=$1',[attempt.reference])).rows.length,0);
  assert.equal((await payApi.GET(new Request('https://church.test/api/payments/success'),{params:Promise.resolve({action:'success'})})).status,404);
  const notify=token=>callbackApi.POST(new Request('https://church.test/api/payments/callback/'+token+'?reference='+attempt.reference,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({status:'paid',amount:999999})}),{params:Promise.resolve({token})});
  assert.equal((await notify('forged')).status,404);assert.equal((await notify(process.env.HUBTEL_CALLBACK_TOKEN)).status,200);
  assert.equal((await db.query('SELECT * FROM public.ledger_entries WHERE reference=$1',[attempt.reference])).rows.length,0);
  await db.query("UPDATE public.payment_attempts SET verified_at=now()-interval '1 minute' WHERE reference=$1",[attempt.reference]);providerAmount=51;status='paid';
  await assert.rejects(payments.reconcilePayment(attempt.reference),/did not match/);
  providerAmount=50;assert.equal((await payments.reconcilePayment(attempt.reference)).status,'paid');
  await db.query("UPDATE public.payment_attempts SET verified_at=now()-interval '1 minute' WHERE reference=$1",[attempt.reference]);assert.equal((await notify(process.env.HUBTEL_CALLBACK_TOKEN)).status,200);
  assert.equal((await db.query('SELECT * FROM public.ledger_entries WHERE reference=$1',[attempt.reference])).rows.length,1);
  await db.query("UPDATE public.payment_attempts SET verified_at=now()-interval '1 minute' WHERE reference=$1",[attempt.reference]);status='failed';assert.equal((await payments.reconcilePayment(attempt.reference)).status,'paid');
  // Refund recording requires a real stored document and a finance-capable session.
  const credit=(await db.query('SELECT id FROM public.ledger_entries WHERE reference=$1',[attempt.reference])).rows[0].id;
  await db.query("UPDATE identity.memberships SET role='admin' WHERE user_id=$1",[uid]);
  const proof=(await db.query("INSERT INTO public.documents(branch_id,owner_id,title) VALUES($1,$2,'Refund fixture evidence') RETURNING id",[branch,uid])).rows[0].id;
  const confirmed={action:'refund',operation_id:crypto.randomUUID(),id:credit,amount:'20.00',reference:'refund-fixture',reason:'Confirmed in portal fixture',document_id:proof};
  await assert.rejects(finance.writeFinance(confirmed),/evidence unavailable/);
  await db.query("INSERT INTO public.document_versions(branch_id,document_id,version,storage_key,media_type,byte_size,digest) VALUES($1,$2,1,$3,'application/pdf',10,'fixture')",[branch,proof,crypto.randomUUID()]);
  const refund=await finance.writeFinance(confirmed);assert.equal((await finance.writeFinance(confirmed)).id,refund.id);
  await assert.rejects(finance.writeFinance({...confirmed,operation_id:crypto.randomUUID(),amount:'30.01',reference:'excess'}),/exceeds/);
  await finance.writeFinance({...confirmed,operation_id:crypto.randomUUID(),amount:'30.00',reference:'remaining'});
  assert.equal((await db.query('SELECT status FROM public.payment_attempts WHERE reference=$1',[attempt.reference])).rows[0].status,'refunded');
  await db.query("UPDATE public.payment_attempts SET verified_at=now()-interval '1 minute' WHERE reference=$1",[attempt.reference]);status='paid';assert.equal((await payments.reconcilePayment(attempt.reference)).status,'refunded');
  assert.equal((await db.query('SELECT sum(amount_minor)::text AS total FROM public.ledger_entries WHERE payment_id=(SELECT id FROM public.payment_attempts WHERE reference=$1)',[attempt.reference])).rows[0].total,'0');
  global.fetch=smsFetch;
  await db.exec('DELETE FROM identity.rate_limits');
  for(let i=0;i<10;i++)assert.equal((await call('login',{phone,password:'wrong',branch_id:branch})).status,401);
  assert.equal((await call('login',{phone,password:'a recovered long password',branch_id:branch})).status,429);
  const hashes=(await db.query('SELECT password_hash FROM identity.users')).rows;
  assert.match(hashes[0].password_hash,/^\$argon2id\$/);
 }finally{
  Module._load=originalLoad;require.extensions['.ts']=originalTs;global.fetch=originalFetch;
  for(const key of ['APP_ORIGIN','AUTH_ENCRYPTION_KEY','MNOTIFY_API_KEY','MNOTIFY_SENDER_ID','UPLOAD_DIRECTORY','PAYMENTS_ENABLED','HUBTEL_CONTRACT_CONFIRMED','HUBTEL_CLIENT_ID','HUBTEL_CLIENT_SECRET','HUBTEL_MERCHANT_ACCOUNT','HUBTEL_CALLBACK_TOKEN']){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}
  await db.close();
 }
});
