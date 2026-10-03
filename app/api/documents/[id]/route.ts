import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import path from 'node:path';
import { authorizedTransaction } from '../../../../lib/server/auth';
import { uuid } from '../../../../lib/server/auth-input';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
 try {
  const {id}=await params;if(!uuid(id))return new Response(null,{status:404});
  const record=await authorizedTransaction('documents',async client=>{
   const result=await client.query<{storage_key:string;byte_size:string}>(`SELECT v.storage_key,v.byte_size FROM public.document_versions v JOIN public.documents d ON d.id=v.document_id
    WHERE d.id=$1 AND d.archived_at IS NULL ORDER BY v.version DESC LIMIT 1`,[id]);
   if(!result.rows[0])return null;
   await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),'download','document',$1)",[id]);return result.rows[0];
  });
  const directory=process.env.UPLOAD_DIRECTORY;if(!record||!uuid(record.storage_key)||!directory||!path.isAbsolute(directory))return new Response(null,{status:404});
  const file=await open(path.join(directory,record.storage_key),constants.O_RDONLY | (constants.O_NOFOLLOW||0));
  try {
   const stat=await file.stat();if(!stat.isFile()||stat.size>10*1024*1024||stat.size!==Number(record.byte_size))throw Error('Invalid file');
   const bytes=await file.readFile();
   return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="document.pdf"','Content-Length':String(bytes.length),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox"}});
  }finally{await file.close();}
 }catch{return new Response(null,{status:404});}
}
