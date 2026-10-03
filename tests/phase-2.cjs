const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {PGlite}=require('@electric-sql/pglite');const {createHash}=require('node:crypto');
const digest=t=>createHash('sha256').update(t).digest('hex');
test('clean PostgreSQL migrations and runtime RLS enforce branch, identity and confidentiality',async()=>{
 const db=new PGlite();try{
 await db.exec('CREATE ROLE fgc_runtime; CREATE ROLE fgc_auth; CREATE ROLE fgc_owner;');
 const dbname=(await db.query('SELECT current_database() AS name')).rows[0].name;
 await db.exec('GRANT CREATE ON DATABASE "'+dbname+'" TO fgc_owner;ALTER SCHEMA public OWNER TO fgc_owner;SET ROLE fgc_owner;');
 await db.exec('CREATE TABLE public.schema_migrations(name text PRIMARY KEY,checksum text NOT NULL)');
 for(const name of fs.readdirSync('db/migrations').filter(n=>n.endsWith('.sql')).sort())await db.exec(fs.readFileSync('db/migrations/'+name,'utf8'));
 await db.exec('RESET ROLE');
 const branch=(await db.query("INSERT INTO public.branches(name,registration_enabled) VALUES('Main',true) RETURNING id")).rows[0].id;
 const other=(await db.query("INSERT INTO public.branches(name) VALUES('Other') RETURNING id")).rows[0].id;
 const actors={};
 for(const role of ['member','pastor','admin']){
  const phone={member:'+233241234567',pastor:'+233241234568',admin:'+233241234569'}[role];
  const uid=(await db.query('SELECT identity.register_member($1,$2,$3,$4) AS id',[phone,'not-used',role,branch])).rows[0].id;
  actors[role]=uid;await db.query('SELECT identity.finalize_member($1,$2,$3,$4)',[uid,branch,role,'not-used']);
  await db.query('UPDATE identity.memberships SET role=$1 WHERE user_id=$2',[role,uid]);
  await db.query("INSERT INTO identity.sessions(token_hash,user_id,branch_id,expires_at,mfa_verified_at) VALUES($1,$2,$3,now()+interval '1 hour',now())",[digest(role),uid,branch]);
 }
 const member=(await db.query('SELECT id FROM public.members WHERE profile_id=$1',[actors.member])).rows[0].id;
 await db.query("INSERT INTO public.care_notes(branch_id,member_id,author_id,body,confidential) VALUES($1,$2,$3,'secret',true),($1,$2,$3,'ordinary',false)",[branch,member,actors.pastor]);
 await db.query("INSERT INTO public.members(branch_id,first_name,last_name) VALUES($1,'Other','Branch')",[other]);
 const asActor=async(token,operation)=>{await db.exec('BEGIN;SET LOCAL ROLE fgc_runtime;');try{await db.query("SELECT set_config('fgc.session_token',$1,true)",[token]);return await operation();}finally{await db.exec('ROLLBACK');}};
 assert.equal((await asActor('',()=>db.query('SELECT * FROM public.members'))).rows.length,0);
 assert.equal((await asActor('member',()=>db.query('SELECT * FROM public.members'))).rows.length,1);
 assert.equal((await asActor('admin',()=>db.query('SELECT * FROM public.care_notes'))).rows.length,1);
 assert.equal((await asActor('pastor',()=>db.query('SELECT * FROM public.care_notes'))).rows.length,2);
 assert.equal((await asActor('member',()=>db.query('SELECT * FROM public.care_notes'))).rows.length,0);
 assert.equal((await asActor('pastor',()=>db.query('SELECT * FROM public.members'))).rows.length,3);
 await assert.rejects(asActor('admin',()=>db.query('UPDATE public.members SET branch_id=$1 WHERE id=$2',[other,member])),/permission denied/);
 await assert.rejects(asActor('member',()=>db.query("UPDATE identity.memberships SET role='admin'")),/permission denied/);
 await assert.rejects(asActor('admin',()=>db.query('DELETE FROM public.members WHERE id=$1',[member])),/permission denied/);
 await assert.rejects(asActor('pastor',()=>db.query("INSERT INTO public.care_notes(branch_id,member_id,author_id,body) VALUES($1,$2,$3,'cross branch')",[other,member,actors.pastor])),/row-level security/);

 const privateDoc=(await db.query("INSERT INTO public.documents(branch_id,owner_id,title,confidential) VALUES($1,$2,'Private',true) RETURNING id",[branch,actors.pastor])).rows[0].id;
 assert.equal((await asActor('pastor',()=>db.query('SELECT * FROM public.documents WHERE id=$1',[privateDoc]))).rows.length,1);
 assert.equal((await asActor('admin',()=>db.query('SELECT * FROM public.documents WHERE id=$1',[privateDoc]))).rows.length,0);
 assert.equal((await asActor('member',()=>db.query('SELECT * FROM public.documents WHERE id=$1',[privateDoc]))).rows.length,0);
 // Missing context cannot select any sensitive domain rows or modify migration history.
 for(const table of ['profiles','households','services','attendance','service_expectations','attendance_operations','care_notes','prayers','prayer_comments','prayer_updates','prayer_reactions','guest_followups','followup_tasks','documents','document_versions','notification_preferences','audit_events','contributions']) {
  assert.equal((await asActor('',()=>db.query('SELECT * FROM public.'+table))).rows.length,0,table);
 }
 await assert.rejects(asActor('admin',()=>db.query("INSERT INTO public.schema_migrations VALUES('fake','checksum')")),/permission denied/);
 await assert.rejects(asActor('admin',()=>db.query('SELECT token_hash FROM identity.sessions')),/permission denied/);
 await assert.rejects(asActor('pastor',()=>db.query('UPDATE public.members SET profile_id=$1 WHERE id=$2',[actors.pastor,member])),/permission denied/);
 await assert.rejects(asActor('member',()=>db.query("INSERT INTO public.care_notes(branch_id,member_id,author_id,body) VALUES($1,$2,$3,'denied')",[branch,member,actors.member])),/row-level security/);
 await asActor('pastor',()=>db.query("UPDATE public.care_notes SET body='updated' WHERE author_id=$1",[actors.pastor]));
 await assert.rejects(asActor('pastor',()=>db.query('DELETE FROM public.care_notes')),/permission denied/);
 await asActor('member',()=>db.query('INSERT INTO public.notification_preferences(user_id) VALUES(identity.actor())'));
 await asActor('member',()=>db.query('UPDATE public.notification_preferences SET sms=true WHERE user_id=identity.actor()'));
 await assert.rejects(asActor('member',()=>db.query('INSERT INTO public.notification_preferences(user_id) VALUES($1)',[actors.admin])),/row-level security/);
 const prayer=(await db.query("INSERT INTO public.prayers(branch_id,author_id,title,body) VALUES($1,$2,'Private','secret') RETURNING id",[branch,actors.member])).rows[0].id;
 assert.equal((await asActor('admin',()=>db.query('SELECT * FROM public.prayers'))).rows.length,0);
 await asActor('member',async()=>{await db.query('INSERT INTO public.prayer_reactions(branch_id,prayer_id,user_id) VALUES($1,$2,identity.actor())',[branch,prayer]);assert.equal((await db.query('DELETE FROM public.prayer_reactions WHERE prayer_id=$1 RETURNING user_id',[prayer])).rows.length,1);});
 await assert.rejects(asActor('member',()=>db.query('UPDATE public.prayers SET author_id=$1 WHERE id=$2',[actors.admin,prayer])),/permission denied/);
 await asActor('admin',()=>db.query("INSERT INTO public.contributions(branch_id,member_id,amount_minor,currency,fund,method,recorded_by) VALUES($1,$2,100,'GHS','offering','cash',identity.actor())",[branch,member]));
 await db.query("INSERT INTO public.contributions(branch_id,member_id,amount_minor,currency,fund,method,recorded_by) VALUES($1,$2,100,'GHS','offering','cash',$3)",[branch,member,actors.admin]);
 assert.equal((await asActor('member',()=>db.query('SELECT * FROM public.contributions'))).rows.length,1);
 assert.equal((await asActor('pastor',()=>db.query('SELECT * FROM public.contributions'))).rows.length,0);
 await assert.rejects(asActor('pastor',()=>db.query("INSERT INTO public.contributions(branch_id,amount_minor,currency,fund,method,recorded_by) VALUES($1,100,'GHS','offering','cash',identity.actor())",[branch])),/row-level security/);
 await asActor('admin',()=>db.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type) VALUES(identity.branch(),identity.actor(),'tested','test')"));
 await assert.rejects(asActor('admin',()=>db.query("UPDATE public.audit_events SET action='forged'")),/permission denied/);
 await assert.rejects(asActor('admin',()=>db.query('DELETE FROM public.audit_events')),/permission denied/);
 await db.query("UPDATE identity.memberships SET role='member' WHERE user_id=$1",[actors.pastor]);
 assert.equal((await asActor('pastor',()=>db.query('SELECT * FROM public.care_notes'))).rows.length,0);
 await db.query('UPDATE identity.sessions SET revoked_at=now() WHERE user_id=$1',[actors.member]);
 assert.equal((await asActor('member',()=>db.query('SELECT * FROM public.members'))).rows.length,0);
 await db.exec('SET ROLE fgc_runtime');assert.equal((await db.query('SELECT * FROM public.members')).rows.length,0);await db.exec('RESET ROLE');
 }finally{await db.close();}
});
