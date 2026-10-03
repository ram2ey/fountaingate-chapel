import 'server-only';
import { createHash } from 'node:crypto';
import { authorizedTransaction } from './auth';
import { allowedFields, boolean, date, identifier, InputError, text } from './core-validation';

function instant(value:unknown){if(typeof value!=='string'||value.length>40||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))throw new InputError('Enter an ISO date and time including timezone.');date(value.slice(0,10));return new Date(value).toISOString();}
export async function readAttendance(view:string,serviceId:string|null){
 return authorizedTransaction(view==='personal'||view==='services'?'self':'attendance',async client=>{
  if(view==='services')return {items:(await client.query("SELECT id,name,event_type,cell_group,starts_at,ends_at,attendance_eligible,completed_at FROM public.services WHERE archived_at IS NULL ORDER BY starts_at DESC,id DESC LIMIT 100")).rows};
  if(view==='personal')return {items:(await client.query('SELECT s.id,s.name,s.starts_at,a.present,a.excused,a.recorded_at FROM public.attendance a JOIN public.members m ON m.id=a.member_id JOIN public.services s ON s.id=a.service_id WHERE m.profile_id=identity.actor() AND s.archived_at IS NULL ORDER BY s.starts_at DESC,s.id DESC LIMIT 100')).rows};
  if(view==='roster'){
   const id=identifier(serviceId);const service=(await client.query('SELECT id FROM public.services WHERE id=$1 AND archived_at IS NULL',[id])).rows[0];if(!service)throw new InputError('Service unavailable.');
   return {items:(await client.query('SELECT m.id,m.first_name,m.last_name,m.household_id,a.present,a.excused,a.recorded_at,EXISTS(SELECT 1 FROM public.service_expectations e WHERE e.service_id=$1 AND e.member_id=m.id) AS expected FROM public.members m LEFT JOIN public.attendance a ON a.member_id=m.id AND a.service_id=$1 WHERE m.archived_at IS NULL ORDER BY m.first_name,m.last_name,m.id LIMIT 500',[id])).rows};
  }
  if(view==='analytics'){
   const services=(await client.query(`SELECT s.id,s.name,s.starts_at,s.event_type,
    (SELECT count(*)::integer FROM public.attendance a WHERE a.service_id=s.id AND a.present) AS present,
    (SELECT count(*)::integer FROM public.service_expectations e WHERE e.service_id=s.id) AS expected,
    (SELECT count(*)::integer FROM public.service_expectations e JOIN public.attendance a ON a.service_id=e.service_id AND a.member_id=e.member_id WHERE e.service_id=s.id AND a.present) AS expected_present,
    (SELECT count(*)::integer FROM public.service_expectations e JOIN public.attendance a ON a.service_id=e.service_id AND a.member_id=e.member_id WHERE e.service_id=s.id AND a.excused) AS excused
    FROM public.services s WHERE s.completed_at IS NOT NULL AND s.archived_at IS NULL ORDER BY s.starts_at DESC,s.id DESC LIMIT 24`)).rows;
   const summary=(await client.query("SELECT count(*)::integer AS members,count(*) FILTER(WHERE status='at_risk')::integer AS at_risk FROM public.members WHERE archived_at IS NULL AND status IN ('active','at_risk')")).rows[0];
   const risk=(await client.query("SELECT id,first_name,last_name,consecutive_absences FROM public.members WHERE archived_at IS NULL AND status='at_risk' ORDER BY consecutive_absences DESC,id LIMIT 100")).rows;
   const latest=services.slice(0,4);return {services,summary,risk,average:latest.length===4?latest.reduce((sum,row)=>sum+row.present,0)/4:null};
  }
  if(view==='households')return {items:(await client.query('SELECT h.id,h.name,m.id AS member_id,m.first_name,m.last_name FROM public.households h LEFT JOIN public.members m ON m.household_id=h.id AND m.archived_at IS NULL WHERE h.archived_at IS NULL ORDER BY h.name,h.id,m.id LIMIT 500')).rows};
  throw new InputError('Unknown attendance view.');
 });
}
export async function writeAttendance(body:Record<string,unknown>){
 return authorizedTransaction('attendance',async client=>{
  // Share the branch lock with kiosk uploads, corrections and the completion job.
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended(identity.branch()::text,410))");
  let entity='attendance',id:string|null=null;
  if(body.action==='service'){
   allowedFields(body,['action','name','event_type','cell_group','starts_at','ends_at','attendance_eligible']);
   const name=text(body.name,'service name',160),start=instant(body.starts_at),end=instant(body.ends_at),type=body.event_type;
   if(!['service','cell','vigil'].includes(String(type))||end<=start)throw new InputError('Invalid service type or interval.');
   const cell=type==='cell'?text(body.cell_group,'cell group',100):null;
   id=(await client.query('INSERT INTO public.services(branch_id,name,event_type,cell_group,starts_at,ends_at,attendance_eligible) VALUES(identity.branch(),$1,$2,$3,$4,$5,$6) RETURNING id',[name,type,cell,start,end,boolean(body.attendance_eligible)])).rows[0].id;entity='service';
  }else if(body.action==='record'){
   allowedFields(body,['action','operation_id','service_id','member_id','state','reason','recorded_at']);
   const operation=identifier(body.operation_id),service=identifier(body.service_id),member=identifier(body.member_id),state=String(body.state);
   if(!['present','excused','absent'].includes(state))throw new InputError('Invalid attendance state.');
   const reason=text(body.reason,'reason',300),recorded=instant(body.recorded_at);
   const fingerprint=createHash('sha256').update(JSON.stringify([service,member,state,reason,recorded])).digest('hex');
   const prior=await client.query('SELECT fingerprint,attendance_id,actor_id=identity.actor() AS mine FROM public.attendance_operations WHERE id=$1',[operation]);
   if(prior.rowCount){if(prior.rows[0].fingerprint!==fingerprint||!prior.rows[0].mine)throw new InputError('Operation conflicts with a previous submission.');return {ok:true,id:prior.rows[0].attendance_id};}
   const available=await client.query('SELECT id,starts_at,ends_at FROM public.services WHERE id=$1 AND archived_at IS NULL FOR UPDATE',[service]);
   if(!available.rowCount)throw new InputError('Service unavailable.');
   if(recorded<new Date(available.rows[0].starts_at).toISOString()||recorded>new Date(available.rows[0].ends_at).toISOString()||Date.parse(recorded)>Date.now()+30000)throw new InputError('Recorded time must belong to this service and cannot be in the future.');
   const active=await client.query('SELECT id FROM public.members WHERE id=$1 AND archived_at IS NULL',[member]);if(!active.rowCount)throw new InputError('Member unavailable.');
   id=(await client.query('INSERT INTO public.attendance(branch_id,service_id,member_id,recorded_by,present,excused,recorded_at) VALUES(identity.branch(),$1,$2,identity.actor(),$3,$4,$5) ON CONFLICT(service_id,member_id) DO UPDATE SET present=excluded.present,excused=excluded.excused,recorded_at=excluded.recorded_at,updated_at=now() RETURNING id',[service,member,state==='present',state==='excused',recorded])).rows[0].id;
   await client.query('INSERT INTO public.attendance_operations(id,branch_id,actor_id,fingerprint,attendance_id) VALUES($1,identity.branch(),identity.actor(),$2,$3)',[operation,fingerprint,id]);
   // Reason is retained in the protected audit, without importing care notes or other sensitive bodies.
   await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),$1,'attendance',$2)",['attendance_'+state+': '+reason,id]);
   await client.query('SELECT identity.refresh_branch_attendance()');return {ok:true,id};
  }else if(body.action==='eligibility'){
   allowedFields(body,['action','member_id','expected_from','expected_until','participation_status']);id=identifier(body.member_id);
   const from=instant(body.expected_from),until=body.expected_until?instant(body.expected_until):null;if(until&&until<from)throw new InputError('Invalid eligibility interval.');
   const status=body.participation_status||null;if(status&&!['active','inactive','transferred'].includes(String(status)))throw new InputError('Invalid participation status.');if((status==='inactive'||status==='transferred')&&!until)throw new InputError('Set the participation end when ending active membership.');
   const result=await client.query('UPDATE public.members SET attendance_expected_from=$2,attendance_expected_until=$3,status=coalesce($4,status),updated_at=now() WHERE id=$1 AND archived_at IS NULL RETURNING id',[id,from,until,status]);if(!result.rowCount)throw new InputError('Member unavailable.');await client.query('SELECT identity.refresh_branch_attendance()');entity='member_eligibility';
  }else if(body.action==='household'){
   allowedFields(body,['action','name']);id=(await client.query('INSERT INTO public.households(branch_id,name) VALUES(identity.branch(),$1) RETURNING id',[text(body.name,'household name',160)])).rows[0].id;entity='household';
  }else if(body.action==='household_member'){
   allowedFields(body,['action','member_id','household_id']);id=identifier(body.member_id);const household=body.household_id?identifier(body.household_id):null;
   if(household&&!(await client.query('SELECT id FROM public.households WHERE id=$1 AND archived_at IS NULL',[household])).rowCount)throw new InputError('Household unavailable.');
   if(!(await client.query('UPDATE public.members SET household_id=$2,updated_at=now() WHERE id=$1 AND archived_at IS NULL RETURNING id',[id,household])).rowCount)throw new InputError('Member unavailable.');entity='household_member';
  }else throw new InputError('Invalid attendance action.');
  await client.query('INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),$1,$2,$3)',[String(body.action),entity,id]);return {ok:true,id};
 });
}
