import { randomUUID, createHash } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { authorizedTransaction } from '../../../lib/server/auth';

export async function POST(request:Request) {
 let filename:string|undefined;
 try {
  if(!process.env.APP_ORIGIN||request.headers.get('origin')!==new URL(process.env.APP_ORIGIN).origin)return Response.json({error:'Access denied.'},{status:403});
  if(request.headers.get('content-type')!=='application/pdf')return Response.json({error:'Only PDF uploads are supported.'},{status:415});
  const title=request.headers.get('x-document-title');if(!title||title.length>160)return Response.json({error:'A title is required.'},{status:400});
  const length=Number(request.headers.get('content-length'));if(length>10*1024*1024)return Response.json({error:'File too large.'},{status:413});
  const directory=process.env.UPLOAD_DIRECTORY;if(!directory||!path.isAbsolute(directory))throw Error('Storage unavailable');
  const result=await authorizedTransaction('documents',async client=>{
   if(!request.body)throw Error('Empty file');
   const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;
   try { for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>10*1024*1024){await reader.cancel();throw Error('File too large');}chunks.push(value);} }
   finally {reader.releaseLock();}
   const bytes=Buffer.concat(chunks);if(size<5||bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Invalid PDF');
   const storageKey=randomUUID();filename=path.join(directory,storageKey);await mkdir(directory,{recursive:true,mode:0o700});await writeFile(filename,bytes,{flag:'wx',mode:0o600});
   const doc=await client.query<{id:string}>(`INSERT INTO public.documents(branch_id,owner_id,title) VALUES(identity.branch(),identity.actor(),$1) RETURNING id`,[title]);
   await client.query(`INSERT INTO public.document_versions(branch_id,document_id,version,storage_key,media_type,byte_size,digest) VALUES(identity.branch(),$1,1,$2,'application/pdf',$3,$4)`,[doc.rows[0].id,storageKey,size,createHash('sha256').update(bytes).digest('hex')]);
   await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),'upload','document',$1)",[doc.rows[0].id]);return doc.rows[0];
  });
  return Response.json(result,{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{if(filename)await unlink(filename).catch(()=>{});return Response.json({error:'Upload unavailable or access denied.'},{status:400});}
}
