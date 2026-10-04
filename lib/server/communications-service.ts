import 'server-only';
import { createHash } from 'node:crypto';
import { authorizedTransaction } from './auth';
import { allowedFields,identifier,InputError,text } from './core-validation';
export function communicationsConfiguration(){return {sms_enabled:process.env.SMS_BROADCAST_ENABLED==='true'&&!!process.env.MNOTIFY_SENDER_ID&&process.env.MNOTIFY_SENDER_ID.length<=11,whatsapp_enabled:false,sender:process.env.MNOTIFY_SENDER_ID||null};}
export async function readCommunications(url:URL){
 return authorizedTransaction('care',async client=>{
  const view=url.searchParams.get('view')||'broadcasts';
  if(view==='preview'){
   const cell=url.searchParams.get('cell_group')?text(url.searchParams.get('cell_group'),'cell group',100):null;
   const result=await client.query('SELECT count(*)::int AS count FROM identity.broadcast_recipients($1)',[cell]);return {count:result.rows[0].count,...communicationsConfiguration()};
  }
  if(view==='templates')return {items:(await client.query('SELECT id,title,body,version FROM public.message_templates WHERE archived_at IS NULL ORDER BY updated_at DESC,id LIMIT 100')).rows};
  if(view==='deliveries'){
   const campaign=identifier(url.searchParams.get('broadcast_id')),after=url.searchParams.get('after')?identifier(url.searchParams.get('after')):null;
   if(!(await client.query('SELECT id FROM public.broadcasts WHERE id=$1',[campaign])).rowCount)throw new InputError('Broadcast unavailable.');
   const rows=(await client.query('SELECT id,phone,state,attempts,report_attempts,provider_campaign_id,last_error,next_attempt_at FROM public.message_deliveries WHERE broadcast_id=$1 AND ($2::uuid IS NULL OR id>$2) ORDER BY id LIMIT 101',[campaign,after])).rows;
   const items=rows.slice(0,100);await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),'read_delivery_report','broadcast',$1)",[campaign]);return {items,next_cursor:rows.length>100?items.at(-1).id:null};
  }
  if(view!=='broadcasts')throw new InputError('Unsupported communications view.');
  let cursor:null|{date:string;id:string}=null;
  if(url.searchParams.get('after')){try{const value=JSON.parse(Buffer.from(url.searchParams.get('after')!,'base64url').toString('utf8'));if(typeof value.date!=='string'||!Number.isFinite(Date.parse(value.date)))throw new Error();cursor={date:value.date,id:identifier(value.id)};}catch{throw new InputError('Invalid cursor.');}}
  const rows=(await client.query(`SELECT b.id,b.body,b.channel,b.provider_sender,b.sender_id,b.recipient_count,b.created_at,coalesce((SELECT jsonb_object_agg(s.state,s.n) FROM (SELECT state,count(*)::int AS n FROM public.message_deliveries WHERE broadcast_id=b.id GROUP BY state) s),'{}'::jsonb) AS counts FROM public.broadcasts b WHERE ($1::timestamptz IS NULL OR (b.created_at,b.id)<($1,$2::uuid)) ORDER BY b.created_at DESC,b.id DESC LIMIT 26`,[cursor?.date||null,cursor?.id||null])).rows;
  const items=rows.slice(0,25),last=items.at(-1);return {items,next_cursor:rows.length>25?Buffer.from(JSON.stringify({date:new Date(last.created_at).toISOString(),id:last.id})).toString('base64url'):null,...communicationsConfiguration()};
 });
}
export async function writeCommunications(body:Record<string,unknown>){
 return authorizedTransaction('care',async client=>{
  if(body.action==='queue'){
   allowedFields(body,['action','operation_id','channel','body','cell_group']);
   if(body.channel!=='sms')throw new InputError('WhatsApp is not configured.');if(!communicationsConfiguration().sms_enabled)throw new InputError('SMS broadcasting is disabled pending provider and worker configuration.');
   const message=text(body.body,'message',1600),cell=body.cell_group?text(body.cell_group,'cell group',100):null,operation=identifier(body.operation_id),sender=process.env.MNOTIFY_SENDER_ID!;
   const fingerprint=createHash('sha256').update(JSON.stringify([message,cell,sender,'sms'])).digest('hex');
   const result=await client.query('SELECT identity.queue_broadcast($1,$2,$3,$4,$5) AS id',[operation,fingerprint,message,cell,sender]);return {ok:true,id:result.rows[0].id};
  }
  if(body.action==='retry'||body.action==='reconcile'){
   allowedFields(body,['action','id','reason','provider_campaign_id']);const campaign=body.provider_campaign_id?text(body.provider_campaign_id,'provider campaign reference',128):null;
   if(body.action==='retry'&&campaign)throw new InputError('Use reconciliation to check an uncertain provider campaign.');
   await client.query('SELECT identity.retry_message($1,$2,$3,$4)',[identifier(body.id),text(body.reason,'reason',300),campaign,body.action==='reconcile']);return {ok:true};
  }
  if(body.action==='template'){
   allowedFields(body,['action','id','title','body','version']);const title=text(body.title,'title',100),message=text(body.body,'template message',1600);let id:string;
   if(body.id){if(!Number.isInteger(body.version)||Number(body.version)<1)throw new InputError('Invalid template version.');const updated=await client.query('UPDATE public.message_templates SET title=$1,body=$2,version=version+1,updated_at=now() WHERE id=$3 AND version=$4 AND archived_at IS NULL RETURNING id',[title,message,identifier(body.id),body.version]);if(!updated.rowCount)throw new InputError('Template changed or is unavailable. Refresh before editing.');id=updated.rows[0].id;}
   else{id=(await client.query('INSERT INTO public.message_templates(branch_id,created_by,title,body) VALUES(identity.branch(),identity.actor(),$1,$2) RETURNING id',[title,message])).rows[0].id;}
   await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),'save_message_template','template',$1)",[id]);return {ok:true,id};
  }
  if(body.action==='archive_template'){
   allowedFields(body,['action','id']);const id=identifier(body.id);if(!(await client.query('UPDATE public.message_templates SET archived_at=now(),updated_at=now(),version=version+1 WHERE id=$1 AND archived_at IS NULL RETURNING id',[id])).rowCount)throw new InputError('Template unavailable.');
   await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),'archive_message_template','template',$1)",[id]);return {ok:true};
  }
  throw new InputError('Unsupported communications operation.');
 });
}
