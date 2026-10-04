import 'server-only';
import {authorizedTransaction} from './auth';
export async function readOperations(){return authorizedTransaction('care',async client=>{
 const messages=(await client.query(`SELECT count(*) FILTER(WHERE state='queued')::int AS queued,count(*) FILTER(WHERE state='sending')::int AS sending,count(*) FILTER(WHERE state='uncertain')::int AS uncertain,count(*) FILTER(WHERE state='failed')::int AS failed,count(*) FILTER(WHERE state='accepted' AND report_attempts>=12)::int AS exhausted_reports,coalesce(extract(epoch FROM now()-min(created_at) FILTER(WHERE state='queued')),0)::int AS oldest_queued_seconds FROM public.message_deliveries`)).rows[0];
 const files=(await client.query("SELECT count(*) FILTER(WHERE state='failed')::int AS failed,count(*) FILTER(WHERE state='staged' AND created_at<now()-interval '10 minutes')::int AS stale_uploads FROM public.stored_files")).rows[0];
 const finance=(await client.query("SELECT identity.has_capability('finance') AS allowed")).rows[0].allowed;
 const payments=finance?(await client.query("SELECT count(*) FILTER(WHERE status='pending')::int AS unsettled,count(*) FILTER(WHERE status='failed')::int AS failed FROM public.payment_attempts")).rows[0]:null;
 await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type) VALUES(identity.branch(),identity.actor(),'read_operational_status','operations')");
 return {checked_at:new Date().toISOString(),messages,files,payments,sms_enabled:process.env.SMS_BROADCAST_ENABLED==='true',payments_enabled:process.env.PAYMENTS_ENABLED==='true'&&process.env.HUBTEL_CONTRACT_CONFIRMED==='true'};
 });}
