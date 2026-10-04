const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {localStorage,range}=require('../lib/server/file-storage.cjs');
const {cleanup}=require('../scripts/cleanup-files.cjs');
async function temporary(run){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'fgc-file-test-'));try{await run(directory);}finally{await fs.rm(directory,{recursive:true,force:true});}}
test('storage validates contents, preserves bytes and rejects traversal, oversized and interrupted files',async()=>temporary(async directory=>{
 const storage=localStorage(directory),key=randomUUID(),bytes=Buffer.from('Original UTF-8 text: Ghana 🇬🇭');
 const result=await storage.write(key,new Request('https://test',{method:'POST',body:bytes}),'text/plain');assert.equal(result.size,bytes.length);assert.match(result.digest,/^[a-f0-9]{64}$/);
 const opened=await storage.open(key,bytes.length);assert.deepEqual(await opened.readFile(),bytes);await opened.close();
 await assert.rejects(storage.open('../escape',1),/storage key/);await assert.rejects(storage.open(key,1),/incomplete/);
 for(const [type,body]of [['application/pdf','%PDF-1.4 broken'],['text/plain',Buffer.from([255])],['audio/mpeg',Buffer.from([255,251,144,0])],['audio/wav','RIFFmalformed']]){const bad=randomUUID();await assert.rejects(storage.write(bad,new Request('https://test',{method:'POST',body}),type));await storage.remove(bad);}
 await assert.rejects(storage.write(randomUUID(),new Request('https://test',{method:'POST',headers:{'content-length':String(10*1024*1024+1)},body:'x'}),'text/plain'),/limit/);
 const partial=randomUUID(),stream=new ReadableStream({start(controller){controller.enqueue(Buffer.from('partial'));controller.error(Error('connection lost'));}});await assert.rejects(storage.write(partial,new Request('https://test',{method:'POST',body:stream,duplex:'half'}),'text/plain'),/connection lost/);await storage.remove(partial);
 const wav=Buffer.alloc(48);wav.write('RIFF');wav.writeUInt32LE(40,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(4,40);
 const audio=randomUUID();assert.equal((await storage.write(audio,new Request('https://test',{method:'POST',body:wav}),'audio/wav')).size,48);
 const mp3=Buffer.alloc(834);mp3.set([255,251,144,0],0);mp3.set([255,251,144,0],417);assert.equal((await storage.write(randomUUID(),new Request('https://test',{method:'POST',body:mp3}),'audio/mpeg')).size,834);
}));
test('byte ranges support seeking and suffixes while rejecting invalid and multi-range requests',()=>{
 assert.deepEqual(range('bytes=2-4',10),{start:2,end:4});assert.deepEqual(range('bytes=5-',10),{start:5,end:9});assert.deepEqual(range('bytes=-3',10),{start:7,end:9});assert.deepEqual(range('bytes=0-99',10),{start:0,end:9});assert.equal(range(null,10),null);
 for(const header of ['bytes=10-','bytes=8-2','bytes=-0','bytes=0-1,3-4','garbage','bytes=-'])assert.throws(()=>range(header,10),/range/i);
});
test('cleanup removes expired/untracked bytes and records purge only after filesystem success',async()=>temporary(async directory=>{
 const expired=randomUUID(),orphan=randomUUID(),fresh=randomUUID();for(const key of [expired,orphan,fresh])await fs.writeFile(path.join(directory,key),'fixture');await fs.utimes(path.join(directory,orphan),new Date(0),new Date(0));
 const calls=[],pool={query:async(sql)=>{calls.push(sql);if(sql.includes('LEFT JOIN'))return {rows:[{id:expired,storage_key:expired}]};if(sql.startsWith('SELECT state'))return {rows:[]};return {rows:[]};}};
 assert.equal(await cleanup(pool,localStorage(directory),directory),1);assert.deepEqual(await fs.readdir(directory),[fresh]);assert.ok(calls.some(sql=>sql.includes("state='purged'")));
 const failureCalls=[],failedPool={query:async(sql)=>{failureCalls.push(sql);return {rows:[{id:expired,storage_key:expired}]};}};await assert.rejects(cleanup(failedPool,{remove:async()=>{throw Error('disk unavailable');}},directory),/disk unavailable/);assert.equal(failureCalls.length,1);
}));
test('audio controls use the authorized original and duration comes from browser metadata',()=>{
 const Module=require('node:module'),ts=require('typescript'),source=require('node:fs').readFileSync('components/media/AudioLibraryPlayer.tsx','utf8'),calls=[];
 const loaded=new Module('audio-player',module);loaded.require=name=>name==='react'?{useState:initial=>[initial,value=>calls.push(value)]}:require(name);
 loaded._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,'audio-player');
 const tree=loaded.exports.AudioLibraryPlayer({sermon:{id:'persisted-id',title:'Stored sermon',preacher:'Preacher',preached_on:'2026-10-04'}}),audio=tree.props.children.find(child=>child?.type==='audio');
 assert.equal(audio.props.src,'/api/media/persisted-id');assert.equal(audio.props.controls,true);assert.equal(audio.props.preload,'metadata');
 audio.props.onLoadedMetadata({currentTarget:{duration:125.5}});assert.equal(calls[0],125.5);
 audio.props.onTimeUpdate({currentTarget:{currentTime:37.25}});assert.ok(calls.includes(37.25));audio.props.onError();assert.match(calls.at(-1),/unavailable or unsupported/);
});
test('upgrade imports existing document versions without changing storage keys or digests',async()=>{
 const {PGlite}=require('@electric-sql/pglite'),legacy=new PGlite(),read=require('node:fs');try{
  await legacy.exec('CREATE ROLE fgc_runtime;CREATE ROLE fgc_auth;CREATE ROLE fgc_messaging;CREATE ROLE fgc_owner;');const name=(await legacy.query('SELECT current_database() AS name')).rows[0].name;
  await legacy.exec('GRANT CREATE ON DATABASE "'+name+'" TO fgc_owner;ALTER SCHEMA public OWNER TO fgc_owner;SET ROLE fgc_owner');
  for(const migration of read.readdirSync('db/migrations').filter(n=>n.endsWith('.sql')&&n<'0013').sort())await legacy.exec(read.readFileSync('db/migrations/'+migration,'utf8'));
  await legacy.exec('RESET ROLE');
  const branch=(await legacy.query("INSERT INTO public.branches(name) VALUES('Legacy files') RETURNING id")).rows[0].id;
  const user=(await legacy.query("INSERT INTO identity.users(phone,password_hash) VALUES('+233241234596','unusable-fixture') RETURNING id")).rows[0].id;
  const document=(await legacy.query("INSERT INTO public.documents(branch_id,owner_id,title) VALUES($1,$2,'Legacy original') RETURNING id",[branch,user])).rows[0].id;
  const key=randomUUID(),digest='a'.repeat(64);await legacy.query("INSERT INTO public.document_versions(branch_id,document_id,version,storage_key,media_type,byte_size,digest) VALUES($1,$2,2,$3,'application/pdf',123,$4)",[branch,document,key,digest]);
  await legacy.exec('SET ROLE fgc_owner');await legacy.exec(read.readFileSync('db/migrations/0013_documents_media.sql','utf8'));await legacy.exec('RESET ROLE');
  const actual=(await legacy.query('SELECT storage_key,digest,version,state,byte_size FROM public.stored_files WHERE document_id=$1',[document])).rows[0];assert.equal(actual.storage_key,key);assert.equal(actual.digest,digest);assert.equal(actual.version,2);assert.equal(actual.state,'ready');assert.equal(Number(actual.byte_size),123);
 }finally{await legacy.close();}
});
