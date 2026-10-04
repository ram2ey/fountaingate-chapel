import 'server-only';
import { createHash } from 'node:crypto';
import { authorizedTransaction } from './auth';
import { allowedFields,date,identifier,InputError,text } from './core-validation';
import { amountMinor,CHURCH_TIMEZONE,currencyCode,financeWindow,givingFund } from './finance-validation';
export type LedgerRow={id:string;member_id:string|null;donor:string;kind:string;amount_minor:string;currency:string;fund:string;method:string;reference:string;given_at:Date;reversal_of:string|null};
export async function readFinance(url:URL,exporting=false){
 const own=url.searchParams.get('scope')==='own',window=financeWindow(url),currency=url.searchParams.get('currency')?currencyCode(url.searchParams.get('currency')):null;
 const member=url.searchParams.get('member_id')?identifier(url.searchParams.get('member_id')):null,receipt=url.searchParams.get('receipt')?identifier(url.searchParams.get('receipt')):null;
 const after=url.searchParams.get('after')?identifier(url.searchParams.get('after')):null;
 return authorizedTransaction(own?'self':'finance',async client=>{
  const condition=`WHERE ($6::uuid IS NOT NULL OR (e.given_at AT TIME ZONE $1)::date BETWEEN $2::date AND $3::date) AND ($4::text IS NULL OR e.currency=$4) AND ($5::uuid IS NULL OR e.member_id=$5) AND ($6::uuid IS NULL OR e.id=$6 OR e.reversal_of=$6) ${own?'AND m.profile_id=identity.actor()':''}`;
  const values=[CHURCH_TIMEZONE,window.from,window.to,currency,member,receipt];
  const totals=(await client.query(`SELECT e.currency,e.fund,sum(e.amount_minor)::text AS net_minor,sum(e.amount_minor) FILTER(WHERE e.kind='credit')::text AS credited_minor,sum(e.amount_minor) FILTER(WHERE e.kind<>'credit')::text AS adjusted_minor FROM public.ledger_entries e LEFT JOIN public.members m ON m.id=e.member_id ${condition} GROUP BY e.currency,e.fund ORDER BY e.currency,e.fund`,values)).rows;
  const monthly=(await client.query(`SELECT to_char(e.given_at AT TIME ZONE $1,'YYYY-MM') AS month,e.currency,sum(e.amount_minor)::text AS net_minor FROM public.ledger_entries e LEFT JOIN public.members m ON m.id=e.member_id ${condition} GROUP BY month,e.currency ORDER BY month,e.currency`,values)).rows;
  const rows=(await client.query<LedgerRow>(`SELECT e.id,e.member_id,coalesce(m.first_name||' '||m.last_name,'Anonymous') AS donor,e.kind,e.amount_minor::text,e.currency,e.fund,e.method,e.reference,e.given_at,e.reversal_of FROM public.ledger_entries e LEFT JOIN public.members m ON m.id=e.member_id ${condition} AND ($7::uuid IS NULL OR (e.given_at,e.id)>(SELECT given_at,id FROM public.ledger_entries WHERE id=$7)) ORDER BY e.given_at,e.id LIMIT $8`,[...values,exporting?null:after,exporting?10001:101])).rows;
  if(receipt&&!rows.length)throw new InputError('Receipt unavailable for this selection.');
  if(exporting&&rows.length>10000)throw new InputError('Export exceeds 10,000 entries. Choose a narrower interval.');
  const attempts=(await client.query('SELECT id,reference,amount_minor::text,currency,fund,status,refunded_minor::text,created_at FROM public.payment_attempts WHERE ($1::boolean=false OR actor_id=identity.actor()) AND (created_at AT TIME ZONE $2)::date BETWEEN $3::date AND $4::date AND ($5::text IS NULL OR currency=$5) AND ($6::uuid IS NULL OR member_id=$6) ORDER BY created_at DESC,id DESC LIMIT 50',[own,CHURCH_TIMEZONE,window.from,window.to,currency,member])).rows;
  const church=(await client.query('SELECT name FROM public.branches WHERE id=identity.branch()')).rows[0]?.name||'Fountain Gate Chapel';
  await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),$1,'finance', $2)",[exporting?'export':'read',receipt||member]);
  const more=!exporting&&rows.length>100,items=exporting?rows:rows.slice(0,100);
  return {church,timezone:CHURCH_TIMEZONE,...window,items,totals,monthly,attempts,next_cursor:more?items.at(-1)?.id:null};
 });
}
export async function writeFinance(body:Record<string,unknown>){
 return authorizedTransaction('finance',async client=>{
  const operation=identifier(body.operation_id);const fingerprint=createHash('sha256').update(JSON.stringify(Object.entries(body).filter(([key])=>key!=='operation_id').sort(([a],[b])=>a.localeCompare(b)))).digest('hex');
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,501))',[operation]);
  const prior=await client.query('SELECT id,fingerprint FROM public.ledger_entries WHERE operation_id=$1',[operation]);if(prior.rowCount){if(prior.rows[0].fingerprint!==fingerprint)throw new InputError('Operation conflicts with a previous submission.');return {ok:true,id:prior.rows[0].id};}
  let id:string;
  if(body.action==='manual'){
   allowedFields(body,['action','operation_id','amount','currency','fund','method','reference','member_id','given_at','reason']);
   const amount=amountMinor(body.amount),currency=currencyCode(body.currency),fund=givingFund(body.fund),reference=text(body.reference,'reference',160),reason=text(body.reason,'reason',300);
   if(body.method!=='cash'&&body.method!=='bank')throw new InputError('Manual entries must be cash or bank.');
   const member=body.member_id?identifier(body.member_id):null;if(member&&!(await client.query('SELECT id FROM public.members WHERE id=$1',[member])).rowCount)throw new InputError('Member unavailable.');
   if(typeof body.given_at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.test(body.given_at)||!Number.isFinite(Date.parse(body.given_at))||Date.parse(body.given_at)>Date.now()+30000)throw new InputError('Invalid giving date and timezone.');
   date(body.given_at.slice(0,10));
   id=(await client.query("INSERT INTO public.ledger_entries(branch_id,member_id,recorded_by,operation_id,fingerprint,kind,amount_minor,currency,fund,method,reference,reason,given_at) VALUES(identity.branch(),$1,identity.actor(),$2,$3,'credit',$4,$5,$6,$7,$8,$9,$10) RETURNING id",[member,operation,fingerprint,amount,currency,fund,body.method,reference,reason,body.given_at])).rows[0].id;
  }else if(body.action==='reverse'){
   allowedFields(body,['action','operation_id','id','amount','reason']);const original=(await client.query("SELECT * FROM public.ledger_entries WHERE id=$1 AND kind='credit'",[identifier(body.id)])).rows[0];if(!original||original.payment_id)throw new InputError('Only manual contributions can be reversed here. Provider payments require verified refunds.');
   id=(await client.query("INSERT INTO public.ledger_entries(branch_id,member_id,recorded_by,operation_id,fingerprint,kind,amount_minor,currency,fund,method,reference,reversal_of,reason,given_at) VALUES(identity.branch(),$1,identity.actor(),$2,$3,'reversal',-$4::bigint,$5,$6,'adjustment',$7,$8,$9,now()) RETURNING id",[original.member_id,operation,fingerprint,amountMinor(body.amount),original.currency,original.fund,'reversal-'+operation,original.id,text(body.reason,'reason',300)])).rows[0].id;
  }else if(body.action==='refund'){
   allowedFields(body,['action','operation_id','id','amount','reference','reason','document_id']);
   id=(await client.query('SELECT identity.record_confirmed_refund($1,$2,$3,$4,$5,$6,$7) AS id',[identifier(body.id),operation,fingerprint,amountMinor(body.amount),text(body.reference,'refund reference',160),text(body.reason,'reason',300),identifier(body.document_id)])).rows[0].id;
  }else throw new InputError('Invalid financial operation.');
  await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),$1,'ledger',$2)",[String(body.action),id]);return {ok:true,id};
 });
}
