import 'server-only';
import type { PoolClient } from 'pg';
import { authorizedTransaction } from './auth';
import { allowedFields, boolean, date, identifier, InputError, nextBirthday, text } from './core-validation';
import { normalizedPhone } from './auth-input';
import type { Capability } from '../auth/permissions';

export const resources=['members','profile','care','guests','prayers','birthdays','audit'] as const;
export type Resource=typeof resources[number];
const scope:Record<Resource,Capability>={members:'directory',profile:'self',care:'care',guests:'directory',prayers:'self',birthdays:'directory',audit:'staff'};
async function audit(client:PoolClient,action:string,entity:string,id:string|null=null){await client.query('INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),$1,$2,$3)',[action,entity,id]);}
function cursor(value:string|null):[string,string]|null {if(!value)return null;try{const pair=JSON.parse(Buffer.from(value,'base64url').toString('utf8'));if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string'||!Number.isFinite(Date.parse(pair[0])))throw Error();identifier(pair[1]);return [pair[0],pair[1]];}catch{throw new InputError('Invalid cursor.');}}
export async function readCore(resource:Resource,url:URL){
 const limit=Number(url.searchParams.get('limit')||25);if(!Number.isInteger(limit)||limit<1||limit>100)throw new InputError('Invalid page size.');
 const search=(url.searchParams.get('search')||'').trim();if(search.length>100)throw new InputError('Search too long.');
 const after=cursor(url.searchParams.get('cursor'));
 return authorizedTransaction(scope[resource],async client=>{
  if(resource==='profile'){
   const profile=await client.query('SELECT id,full_name FROM public.profiles WHERE id=identity.actor()');
   const prefs=await client.query('SELECT sms,email FROM public.notification_preferences WHERE user_id=identity.actor()');return {profile:profile.rows[0],preferences:prefs.rows[0]||{sms:false,email:false}};
  }
  if(resource==='prayers'&&url.searchParams.has('thread')){
   const id=identifier(url.searchParams.get('thread'));
   const available=await client.query('SELECT id FROM public.prayers WHERE id=$1 AND archived_at IS NULL',[id]);if(!available.rowCount)throw new InputError('Prayer unavailable.');
   const result=await client.query("SELECT id,author_id,body,created_at,'comment' AS kind FROM public.prayer_comments WHERE prayer_id=$1 AND archived_at IS NULL UNION ALL SELECT id,author_id,body,created_at,'update' AS kind FROM public.prayer_updates WHERE prayer_id=$1 AND archived_at IS NULL ORDER BY created_at,id LIMIT 100",[id]);return {thread:result.rows};
  }
  if(resource==='birthdays'){
   const today=new Date().toISOString().slice(0,10);const rows=await client.query<{id:string;first_name:string;last_name:string;dob:string}>('SELECT id,first_name,last_name,to_char(dob,\'YYYY-MM-DD\') AS dob FROM public.members WHERE archived_at IS NULL AND dob IS NOT NULL');
   await audit(client,'read','birthdays');return {items:rows.rows.map(row=>({id:row.id,first_name:row.first_name,last_name:row.last_name,next_birthday:nextBirthday(row.dob,today)})).sort((a,b)=>a.next_birthday.localeCompare(b.next_birthday)||a.id.localeCompare(b.id)).slice(0,limit)};
  }
  const archived=url.searchParams.get('archived')==='true';
  let sql='';
  const pattern='%'+search.replace(/[\\%_]/g,'\\$&')+'%';
  const values:unknown[]=[pattern,after?.[0]||null,after?.[1]||null,limit+1];
  const paging=" AND ($2::timestamptz IS NULL OR (created_at,id)<($2::timestamptz,$3::uuid)) ORDER BY created_at DESC,id DESC LIMIT $4";
  if(resource==='members')sql=`SELECT id,first_name,last_name,phone,email,to_char(dob,'YYYY-MM-DD') AS dob,address,cell_group,status,archived_at,created_at FROM public.members WHERE ${archived?'archived_at IS NOT NULL':'archived_at IS NULL'} AND (first_name||' '||last_name) ILIKE $1`+paging;
  if(resource==='care')sql=`SELECT id,member_id,author_id,body,confidential,follow_up_at,created_at FROM public.care_notes WHERE archived_at IS NULL AND body ILIKE $1 AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.archived_at IS NULL)`+paging;
  if(resource==='guests')sql=`SELECT id,member_id,stage,assigned_to,consent_to_contact,created_at FROM public.guest_followups WHERE archived_at IS NULL AND stage ILIKE $1 AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.archived_at IS NULL)`+paging;
  if(resource==='audit')sql='SELECT id,actor_id,action,entity_type,entity_id,created_at FROM public.audit_events WHERE action ILIKE $1'+paging;
  if(resource==='prayers')sql=`SELECT id,author_id,title,body,visibility,status,created_at,
   (SELECT count(*)::integer FROM public.prayer_reactions r WHERE r.prayer_id=public.prayers.id) AS reaction_count,
   EXISTS(SELECT 1 FROM public.prayer_reactions r WHERE r.prayer_id=public.prayers.id AND r.user_id=identity.actor()) AS reacted
   FROM public.prayers WHERE archived_at IS NULL AND title ILIKE $1`+paging;
  const result=await client.query(sql,values);const more=result.rows.length>limit,items=result.rows.slice(0,limit);
  if(resource==='care'){
   const guestPrayers=await client.query('SELECT id,member_id,body,created_at FROM public.guest_prayers WHERE archived_at IS NULL AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.archived_at IS NULL) ORDER BY created_at DESC,id DESC LIMIT $1',[limit]);
   await audit(client,'read','care');return {items,guest_prayers:guestPrayers.rows,next_cursor:more?Buffer.from(JSON.stringify([items.at(-1).created_at,items.at(-1).id])).toString('base64url'):null};
  }
  if(resource==='members')await audit(client,'read','directory');
  return {items,next_cursor:more?Buffer.from(JSON.stringify([items.at(-1).created_at,items.at(-1).id])).toString('base64url'):null};
 });
}
export async function mutateCore(resource:Resource,body:Record<string,unknown>){
 return authorizedTransaction(scope[resource],async client=>{
  let id:string|null=null;
  if(resource==='profile'){
   allowedFields(body,['full_name','sms','email']);const name=text(body.full_name,'name',160);const sms=boolean(body.sms),email=boolean(body.email);
   await client.query('UPDATE public.profiles SET full_name=$1,updated_at=now() WHERE id=identity.actor()',[name]);
   await client.query('INSERT INTO public.notification_preferences(user_id,sms,email) VALUES(identity.actor(),$1,$2) ON CONFLICT(user_id) DO UPDATE SET sms=excluded.sms,email=excluded.email,updated_at=now()',[sms,email]);
  }else if(resource==='members'){
   if(body.action==='archive'||body.action==='restore'){
    allowedFields(body,['id','action']);id=identifier(body.id);
    const result=await client.query(`UPDATE public.members SET archived_at=${body.action==='archive'?'now()':'NULL'},updated_at=now() WHERE id=$1 RETURNING id`,[id]);if(!result.rowCount)throw new InputError('Member unavailable.');
    await client.query(`UPDATE public.guest_followups SET archived_at=${body.action==='archive'?'now()':'NULL'},updated_at=now() WHERE member_id=$1`,[id]);
   }else{
    allowedFields(body,['id','first_name','last_name','phone','email','dob','address','cell_group']);const first=text(body.first_name,'first name',80),last=text(body.last_name,'last name',80,false),phone=normalizedPhone(body.phone);
    const email=body.email?text(body.email,'email',254):null;if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new InputError('Invalid email.');
    const values=[first,last,phone,email,date(body.dob),text(body.address||'','address',500,false),text(body.cell_group||'','group',100,false)];
    const result=body.id?await client.query('UPDATE public.members SET first_name=$1,last_name=$2,phone=$3,email=$4,dob=$5,address=$6,cell_group=$7,updated_at=now() WHERE id=$8 AND archived_at IS NULL RETURNING id',[...values,identifier(body.id)]):await client.query('INSERT INTO public.members(branch_id,first_name,last_name,phone,email,dob,address,cell_group) VALUES(identity.branch(),$1,$2,$3,$4,$5,$6,$7) RETURNING id',values);
    if(!result.rowCount)throw new InputError('Member unavailable.');id=result.rows[0].id;
   }
  }else if(resource==='care'){
   allowedFields(body,['member_id','body','confidential','follow_up_date']);const member=identifier(body.member_id),note=text(body.body,'note',3000),confidential=boolean(body.confidential);
   const active=await client.query('SELECT id FROM public.members WHERE id=$1 AND archived_at IS NULL',[member]);if(!active.rowCount)throw new InputError('Member unavailable.');
   const result=await client.query('INSERT INTO public.care_notes(branch_id,member_id,author_id,body,confidential,follow_up_at) VALUES(identity.branch(),$1,identity.actor(),$2,$3,$4) RETURNING id',[member,note,confidential,date(body.follow_up_date)]);id=result.rows[0].id;
  }else if(resource==='guests'){
   allowedFields(body,['id','stage','assigned_to']);id=identifier(body.id);const stages=['new','welcomed','contacted','invited','completed'];if(!stages.includes(String(body.stage)))throw new InputError('Invalid stage.');
   const current=await client.query('SELECT member_id,stage,consent_to_contact FROM public.guest_followups WHERE id=$1 AND archived_at IS NULL FOR UPDATE',[id]);if(!current.rowCount)throw new InputError('Guest unavailable.');
   const previous=stages.indexOf(current.rows[0].stage),next=stages.indexOf(String(body.stage));if(next!==previous&&next!==previous+1)throw new InputError('Advance one stage at a time.');
   if(next>0&&!current.rows[0].consent_to_contact)throw new InputError('Contact consent is required.');
   const assigned=body.assigned_to?identifier(body.assigned_to):null;
   if(assigned){const eligible=await client.query('SELECT identity.assignable_user($1) AS allowed',[assigned]);if(!eligible.rows[0]?.allowed)throw new InputError('Assignee must be active branch staff.');}
   await client.query('UPDATE public.guest_followups SET stage=$1,assigned_to=$2,updated_at=now() WHERE id=$3',[body.stage,assigned,id]);
   await client.query('UPDATE public.followup_tasks SET completed_at=now() WHERE member_id=$1 AND stage=$2 AND completed_at IS NULL',[current.rows[0].member_id,current.rows[0].stage]);
   if(next<stages.length-1)await client.query("INSERT INTO public.followup_tasks(branch_id,member_id,assigned_to,due_at,stage) VALUES(identity.branch(),$1,$2,now()+interval '3 days',$3) ON CONFLICT(member_id,stage) DO UPDATE SET assigned_to=excluded.assigned_to",[current.rows[0].member_id,assigned,stages[next+1]]);
  }else if(resource==='prayers'){
   const action=body.action||'create';
   if(action==='create'){
    allowedFields(body,['title','body','visibility']);const title=text(body.title,'title',160),content=text(body.body,'prayer',3000);if(!['private','branch'].includes(String(body.visibility)))throw new InputError('Invalid visibility.');
    id=(await client.query('INSERT INTO public.prayers(branch_id,author_id,title,body,visibility) VALUES(identity.branch(),identity.actor(),$1,$2,$3) RETURNING id',[title,content,body.visibility])).rows[0].id;
   }else{
    id=identifier(body.id);const prayer=await client.query('SELECT id,author_id,archived_at FROM public.prayers WHERE id=$1 FOR UPDATE',[id]);if(!prayer.rowCount||prayer.rows[0].archived_at)throw new InputError('Prayer unavailable.');
    if(action==='react'){
     allowedFields(body,['id','action','reacted']);if(boolean(body.reacted))await client.query('INSERT INTO public.prayer_reactions(branch_id,prayer_id,user_id) VALUES(identity.branch(),$1,identity.actor()) ON CONFLICT(prayer_id,user_id) DO NOTHING',[id]);
     else await client.query('DELETE FROM public.prayer_reactions WHERE prayer_id=$1 AND user_id=identity.actor()',[id]);
    }else if(action==='comment'||action==='update'){
     allowedFields(body,['id','action','body']);const content=text(body.body,'text',3000);
     if(action==='update') {const permitted=await client.query('SELECT author_id=identity.actor() OR identity.has_capability(\'confidential_care\') AS allowed FROM public.prayers WHERE id=$1',[id]);if(!permitted.rows[0]?.allowed)throw new InputError('Access denied.');}
     await client.query(`INSERT INTO public.${action==='comment'?'prayer_comments':'prayer_updates'}(branch_id,prayer_id,author_id,body) VALUES(identity.branch(),$1,identity.actor(),$2)`,[id,content]);
    }else if(action==='status'||action==='archive'){
     allowedFields(body,['id','action','status']);if(action==='status'&&!['active','answered'].includes(String(body.status)))throw new InputError('Invalid status.');
     const result=await client.query(action==='archive'?"UPDATE public.prayers SET archived_at=now(),status='archived',updated_at=now() WHERE id=$1 RETURNING id":'UPDATE public.prayers SET status=$2,updated_at=now() WHERE id=$1 RETURNING id',action==='archive'?[id]:[id,body.status]);if(!result.rowCount)throw new InputError('Access denied.');
    }else throw new InputError('Invalid action.');
   }
  }else throw new InputError('Unsupported operation.');
  await audit(client,String(body.action||'save'),resource,id);return {ok:true,id};
 });
}
