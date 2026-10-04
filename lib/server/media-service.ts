import 'server-only';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { authorizedTransaction } from './auth';
import { identifier,text,date,boolean,allowedFields,InputError } from './core-validation';
import { localStorage,limit,range,FileInputError } from './file-storage.cjs';

export async function uploadFile(request:Request,kind:'document'|'audio'){
 if(!process.env.APP_ORIGIN||request.headers.get('origin')!==new URL(process.env.APP_ORIGIN).origin)throw new FileInputError('Access denied.',403);
 const type=request.headers.get('content-type')?.split(';')[0]||'';limit(type);
 if(kind==='document'&&!['application/pdf','text/plain'].includes(type)||kind==='audio'&&!['audio/mpeg','audio/wav'].includes(type))throw new FileInputError('Unsupported file type.',415);
 function header(name:string){const value=request.headers.get(name);if(value===null)return null;try{return decodeURIComponent(value);}catch{throw new InputError('Invalid file metadata.');}}
 const extension=type==='application/pdf'?'pdf':type==='text/plain'?'txt':type==='audio/mpeg'?'mp3':'wav';
 const title=text(header('x-document-title'),'title',160),name=text(header('x-file-name')||`${kind==='audio'?'sermon':'document'}.${extension}`,'file name',180);
 if(!name.toLowerCase().endsWith('.'+extension))throw new InputError('File name extension must match the uploaded format.');
 const documentId=request.headers.get('x-document-id')?identifier(request.headers.get('x-document-id')):null;
 const expected=request.headers.get('x-document-revision')?Number(request.headers.get('x-document-revision')):null;
 const preacher=kind==='audio'?text(header('x-preacher'),'preacher',120):null;
 const preached=kind==='audio'?date(request.headers.get('x-preached-on')):null;if(kind==='audio'&&!preached)throw new InputError('A sermon date is required.');
 const storage=localStorage(),key=randomUUID();
 // Commit the staged intent before filesystem work. A crash leaves a recoverable row.
 const staged=await authorizedTransaction('documents',async client=>{
  if(!(await client.query('SELECT identity.upload_allowed() AS allowed')).rows[0]?.allowed)throw new InputError('Upload limit reached. Wait for pending uploads or try later.');
  let id=documentId;
  if(kind==='document'){
   if(id){const found=await client.query('SELECT id,revision,owner_id=identity.actor() AS own FROM public.documents WHERE id=$1 AND archived_at IS NULL FOR UPDATE',[id]);if(!found.rows[0]?.own||found.rows[0].revision!==expected)throw new InputError('Document changed or is unavailable. Refresh first.');}
   else id=(await client.query('INSERT INTO public.documents(branch_id,owner_id,title) VALUES(identity.branch(),identity.actor(),$1) RETURNING id',[title])).rows[0].id;
  }
  const version=id?(await client.query('SELECT coalesce(max(version),0)+1 AS n FROM public.stored_files WHERE document_id=$1',[id])).rows[0].n:1;
  const file=(await client.query("INSERT INTO public.stored_files(branch_id,owner_id,document_id,version,kind,storage_key,original_name,media_type) VALUES(identity.branch(),identity.actor(),$1,$2,$3,$4,$5,$6) RETURNING id",[id,version,kind,key,name,type])).rows[0];
  return {id,file_id:file.id,version};
 });
 try{
  const bytes=await storage.write(key,request,type);
  return await authorizedTransaction('documents',async client=>{
   if(staged.id){const doc=await client.query('SELECT id,revision FROM public.documents WHERE id=$1 AND owner_id=identity.actor() AND archived_at IS NULL FOR UPDATE',[staged.id]);if(!doc.rowCount||documentId&&doc.rows[0].revision!==expected)throw new InputError('Document changed during upload. Refresh first.');}
   const ready=await client.query("UPDATE public.stored_files SET state='ready',byte_size=$1,digest=$2,updated_at=now() WHERE id=$3 AND state='staged' AND owner_id=identity.actor() RETURNING id",[bytes.size,bytes.digest,staged.file_id]);if(!ready.rowCount)throw new InputError('Upload no longer available.');
   let id=staged.id;
   if(kind==='document'){
    await client.query('INSERT INTO public.document_versions(branch_id,document_id,version,storage_key,media_type,byte_size,digest) VALUES(identity.branch(),$1,$2,$3,$4,$5,$6)',[id,staged.version,key,type,bytes.size,bytes.digest]);
    await client.query('UPDATE public.documents SET revision=revision+1,updated_at=now() WHERE id=$1',[id]);
   }else id=(await client.query('INSERT INTO public.sermons(branch_id,owner_id,file_id,title,preacher,preached_on) VALUES(identity.branch(),identity.actor(),$1,$2,$3,$4) RETURNING id',[staged.file_id,title,preacher,preached])).rows[0].id;
   await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),'upload',$1,$2)",[kind,id]);
   return {id,file_id:staged.file_id,version:staged.version,byte_size:bytes.size};
  });
 }catch(error){
  // A lost COMMIT acknowledgement may mean success: never delete a ready file blindly.
  try{const row=await authorizedTransaction('documents',async client=>{const file=(await client.query('SELECT f.state,f.document_id,f.version,f.byte_size,s.id AS sermon_id FROM public.stored_files f LEFT JOIN public.sermons s ON s.file_id=f.id WHERE f.id=$1',[staged.file_id])).rows[0];if(file?.state==='staged')await client.query("UPDATE public.stored_files SET state='failed',updated_at=now() WHERE id=$1",[staged.file_id]);return file;});if(row?.state==='ready'&&(row.document_id||row.sermon_id))return {id:row.document_id||row.sermon_id,file_id:staged.file_id,version:row.version,byte_size:Number(row.byte_size)};if(row?.state==='staged')await storage.remove(key);}catch{/* Owner cleanup reconciles unavailable/uncertain transactions. */}
  throw error;
 }
}
export async function readDocuments(url:URL){return authorizedTransaction('documents',async client=>{
 if(url.searchParams.has('id')){const id=identifier(url.searchParams.get('id')),before=url.searchParams.get('before')?Number(url.searchParams.get('before')):null;if(before!==null&&(!Number.isSafeInteger(before)||before<1))throw new InputError('Invalid version cursor.');const doc=(await client.query('SELECT id,title,revision,owner_id=identity.actor() AS can_edit FROM public.documents WHERE id=$1 AND archived_at IS NULL',[id])).rows[0];if(!doc)throw new InputError('Document unavailable.');const rows=(await client.query("SELECT id,version,original_name,media_type,byte_size,created_at FROM public.stored_files WHERE document_id=$1 AND state='ready' AND ($2::integer IS NULL OR version<$2) ORDER BY version DESC LIMIT 101",[id,before])).rows;return {document:doc,versions:rows.slice(0,100),next_version:rows.length>100?rows[99].version:null};}
 const after=url.searchParams.get('after')?identifier(url.searchParams.get('after')):null;
 const rows=(await client.query("SELECT d.id,d.title,d.revision,d.owner_id=identity.actor() AS can_edit,d.updated_at FROM public.documents d WHERE d.archived_at IS NULL AND ($1::uuid IS NULL OR d.id>$1) AND EXISTS(SELECT 1 FROM public.stored_files f WHERE f.document_id=d.id AND f.state='ready') ORDER BY d.id LIMIT 51",[after])).rows;return {items:rows.slice(0,50),next_cursor:rows.length>50?rows[49].id:null};
 });}
export async function mutateDocument(body:Record<string,unknown>){allowedFields(body,['id','action','title','revision']);return authorizedTransaction('documents',async client=>{
 const id=identifier(body.id);if(!Number.isInteger(body.revision))throw new InputError('Invalid revision.');if(!['rename','archive'].includes(String(body.action)))throw new InputError('Unsupported action.');
 const result=await client.query("UPDATE public.documents SET title=CASE WHEN $2='rename' THEN $3 ELSE title END,archived_at=CASE WHEN $2='archive' THEN now() ELSE archived_at END,revision=revision+1,updated_at=now() WHERE id=$1 AND revision=$4 AND owner_id=identity.actor() AND archived_at IS NULL RETURNING id",[id,body.action,body.action==='rename'?text(body.title,'title',160):null,body.revision]);if(!result.rowCount)throw new InputError('Document changed or is unavailable.');
 await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),$1,'document',$2)",[body.action,id]);return {ok:true};
 });}
export async function downloadFile(request:Request,id:string,kind:'document'|'audio'){
 const file=await authorizedTransaction(kind==='document'?'documents':'self',async client=>{
  const specific=new URL(request.url).searchParams.get('version');if(specific)identifier(specific);
  const result=kind==='document'?await client.query("SELECT f.* FROM public.stored_files f JOIN public.documents d ON d.id=f.document_id WHERE d.id=$1 AND d.archived_at IS NULL AND f.state='ready' AND ($2::uuid IS NULL OR f.id=$2) ORDER BY f.version DESC LIMIT 1",[identifier(id),specific]):await client.query("SELECT f.* FROM public.stored_files f JOIN public.sermons s ON s.file_id=f.id WHERE s.id=$1 AND s.archived_at IS NULL AND f.state='ready'",[identifier(id)]);
  const row=result.rows[0];if(row)await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),'download',$1,$2)",[kind,id]);return row;
 });if(!file)return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
 const size=Number(file.byte_size);let slice;try{slice=range(request.headers.get('range'),size);}catch{return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`,'Cache-Control':'no-store'}});}
 const handle=await localStorage().open(file.storage_key,size);
 const originalName=String(file.original_name).replace(/[\\/\r\n]/g,'_'),encodedName=encodeURIComponent(originalName).replace(/['()*]/g,char=>'%'+char.charCodeAt(0).toString(16).toUpperCase());
 const headers:Record<string,string>={'Content-Type':file.media_type,'Content-Length':String(slice?slice.end-slice.start+1:size),'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'",'Content-Disposition':`${kind==='audio'||new URL(request.url).searchParams.get('inline')==='true'?'inline':'attachment'}; filename="${kind==='audio'?'sermon':'document'}${file.media_type==='application/pdf'?'.pdf':file.media_type==='text/plain'?'.txt':file.media_type==='audio/wav'?'.wav':'.mp3'}"`};
 if(slice)headers['Content-Range']=`bytes ${slice.start}-${slice.end}/${size}`;
 headers['Content-Disposition']+=`; filename*=UTF-8''${encodedName}`;
 if(request.method==='HEAD'){await handle.close();return new Response(null,{status:slice?206:200,headers});}
 const stream=handle.createReadStream({start:slice?.start||0,end:slice?.end??size-1,autoClose:true});
 return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>,{status:slice?206:200,headers});
}
export function liveUrl(value:unknown){if(value===null||value==='')return null;const url=new URL(text(value,'live URL',500));if(url.protocol!=='https:'||url.username||url.password||url.port||!['www.facebook.com','facebook.com','www.youtube.com','youtube.com','youtu.be'].includes(url.hostname))throw new InputError('Use a direct HTTPS Facebook or YouTube URL.');return url.href;}
export async function readMedia(url:URL){return authorizedTransaction('self',async client=>{
 const settings=(await client.query('SELECT live,live_url,schedules,revision FROM public.media_settings WHERE branch_id=identity.branch()')).rows[0]||{live:false,live_url:null,schedules:[],revision:0};
 if(url.searchParams.get('view')==='settings')return {settings,items:[],next_cursor:null};
 const after=url.searchParams.get('after')?identifier(url.searchParams.get('after')):null;
 const id=url.searchParams.get('id')?identifier(url.searchParams.get('id')):null;
 const rows=(await client.query("SELECT s.id,s.title,s.preacher,s.preached_on,s.published,s.revision,s.owner_id=identity.actor() AS can_edit,f.byte_size,f.media_type FROM public.sermons s JOIN public.stored_files f ON f.id=s.file_id WHERE s.archived_at IS NULL AND f.state='ready' AND ($1::uuid IS NULL OR s.id>$1) AND ($2::uuid IS NULL OR s.id=$2) ORDER BY s.id LIMIT 51",[after,id])).rows;return {settings,items:rows.slice(0,50),next_cursor:rows.length>50?rows[49].id:null};
 });}
export async function mutateMedia(body:Record<string,unknown>){return authorizedTransaction('documents',async client=>{
 if(body.action==='settings'){
  allowedFields(body,['action','revision','live','live_url','schedules']);const live=boolean(body.live),url=liveUrl(body.live_url);if(live&&!url)throw new InputError('Live broadcasts require a URL.');if(!Number.isInteger(body.revision))throw new InputError('Invalid revision.');
  if(!Array.isArray(body.schedules)||body.schedules.length>12)throw new InputError('Invalid schedules.');
  const schedules=body.schedules.map(item=>{if(!item||typeof item!=='object')throw new InputError('Invalid schedule.');allowedFields(item,['name','day','time']);if(!Number.isInteger(item.day)||item.day<0||item.day>6||typeof item.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time))throw new InputError('Invalid service time.');return {name:text(item.name,'service name',100),day:item.day,time:item.time};});
  const result=await client.query('INSERT INTO public.media_settings(branch_id,live,live_url,schedules) SELECT identity.branch(),$1,$2,$3::jsonb WHERE $4=0 ON CONFLICT(branch_id) DO NOTHING RETURNING branch_id',[live,url,JSON.stringify(schedules),body.revision]);
  if(!result.rowCount){const update=await client.query('UPDATE public.media_settings SET live=$1,live_url=$2,schedules=$3::jsonb,revision=revision+1,updated_at=now() WHERE branch_id=identity.branch() AND revision=$4 RETURNING branch_id',[live,url,JSON.stringify(schedules),body.revision]);if(!update.rowCount)throw new InputError('Settings changed. Refresh before saving.');}
 }else{
  allowedFields(body,['action','id','revision','title','preacher','preached_on','published']);if(!Number.isInteger(body.revision)||!['edit','archive'].includes(String(body.action)))throw new InputError('Invalid sermon action.');
  const result=await client.query("UPDATE public.sermons SET title=coalesce($3,title),preacher=coalesce($4,preacher),preached_on=coalesce($5::date,preached_on),published=coalesce($6,published),archived_at=CASE WHEN $2='archive' THEN now() ELSE archived_at END,revision=revision+1,updated_at=now() WHERE id=$1 AND revision=$7 AND owner_id=identity.actor() AND archived_at IS NULL RETURNING id",[identifier(body.id),body.action,body.action==='edit'?text(body.title,'title',160):null,body.action==='edit'?text(body.preacher,'preacher',120):null,body.action==='edit'?date(body.preached_on):null,body.action==='edit'?boolean(body.published):null,body.revision]);if(!result.rowCount)throw new InputError('Sermon changed or is unavailable.');
 }
 await client.query("INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) VALUES(identity.branch(),identity.actor(),$1,'media',identity.branch())",[String(body.action)]);return {ok:true};
 });}
