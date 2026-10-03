const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const Module=require('node:module');
const queueModule=new Module('kiosk-queue',module);
queueModule._compile(ts.transpileModule(fs.readFileSync('lib/kiosk/queue.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,'kiosk-queue');
const {drainQueue}=queueModule.exports;
test('attendance page does not render staff controls when the server capability check denies access',async()=>{
 const pageModule=new Module('attendance-page',module);pageModule.require=name=>{
  if(name.endsWith('/page-access'))return {requirePageAccess:async()=>false};
  if(name.endsWith('/AttendanceWorkspace'))return {AttendanceWorkspace:()=>{throw Error('Unauthorized controls rendered');}};
  return require(name);
 };
 pageModule._compile(ts.transpileModule(fs.readFileSync('app/attendance/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,'attendance-page');
 const denied=await pageModule.exports.default();const html=require('react-dom/server').renderToStaticMarkup(denied);assert.match(html,/requires staff access/);assert.doesNotMatch(html,/<form/);
});
test('IndexedDB transactions bound the queue, preserve scopes and redact expired proofs',async()=>{
 const {IDBFactory}=require('fake-indexeddb');global.indexedDB=new IDBFactory();
 const {enqueue,listQueue,removeQueued}=queueModule.exports;
 const now=new Date().toISOString();
 for(let i=0;i<200;i++)await enqueue({operation_id:String(i),device_scope:i===0?'another-device':'scope',service_id:'service',recorded_at:i===1?'2020-01-01T10:00:00Z':now,token:'fixture-only-proof'});
 await assert.rejects(enqueue({operation_id:'overflow',device_scope:'scope',service_id:'service',recorded_at:now,token:'proof'}));
 const read=await listQueue('scope');assert.equal(read.length,199);assert.equal(read.find(row=>row.operation_id==='1').token,undefined);assert.match(read.find(row=>row.operation_id==='1').error,/expired/);
 assert.equal((await listQueue('another-device')).length,1);
 await removeQueued('2');await enqueue({operation_id:'replacement',device_scope:'scope',service_id:'service',recorded_at:now,token:'proof'});assert.equal((await listQueue('scope')).length,199);
 // Reopening connections retains the unacknowledged records.
 assert.equal((await listQueue('scope')).find(row=>row.operation_id==='replacement').token,'proof');
 delete global.indexedDB;
});
test('QR parser accepts only check-in proof and exact service identifier',()=>{
 const qrModule=new Module('kiosk-qr',module);qrModule._compile(ts.transpileModule(fs.readFileSync('lib/kiosk/qr.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,'kiosk-qr');
 const decode=qrModule.exports.decodeCheckInPayload,valid={service_id:'00000000-0000-4000-8000-000000000001',token:'x'.repeat(43)};assert.deepEqual(decode(JSON.stringify(valid)),valid);
 for(const input of ['https://evil.test/',JSON.stringify({...valid,role:'admin'}),JSON.stringify({...valid,token:'short'})])assert.throws(()=>decode(input));
});
function fixture(){const rows=[{operation_id:'original-operation',device_scope:'scope',service_id:'original-service',recorded_at:'2026-01-01T10:00:00Z',token:'proof'}];return {rows,store:{list:async()=>rows.slice(),remove:async id=>rows.splice(rows.findIndex(r=>r.operation_id===id),1),reject:async(row,message,redact)=>{row.error=message;if(redact)delete row.token;}}};}
test('offline drain retains entries on unreachable server, 5xx and mismatched acknowledgement',async()=>{
 for(const failure of ['unreachable','server','ack']){const {rows,store}=fixture();let calls=0;
  const transport=async()=>{if(failure==='unreachable')throw Error('offline');if(++calls===1)return Response.json({ok:true});return failure==='server'?Response.json({}, {status:503}):Response.json({ok:true,operation_id:'wrong-operation'});};
  await assert.rejects(drainQueue('device','scope',transport,store));assert.equal(rows.length,1);assert.equal(rows[0].recorded_at,'2026-01-01T10:00:00Z');
 }
});
test('offline drain removes only matching receipts and retains rejected operations for resolution',async()=>{
 for(const rejected of [false,true]){const {rows,store}=fixture();let calls=0;const transport=async(url,request)=>{if(++calls===1)return Response.json({ok:true});const body=JSON.parse(request.body);assert.equal(body.service_id,'original-service');assert.equal(body.recorded_at,'2026-01-01T10:00:00Z');return rejected?Response.json({}, {status:422}):Response.json({ok:true,operation_id:body.operation_id});};
  const result=await drainQueue('device','scope',transport,store);assert.equal(result.saved,rejected?0:1);assert.equal(rows.length,rejected?1:0);if(rejected)assert.match(rows[0].error,/rejected/);
 }
});
test('device revocation stops uploads and redacts sensitive queued proofs',async()=>{
 const {rows,store}=fixture();let calls=0;const result=await drainQueue('device','scope',async()=>{calls++;return Response.json({}, {status:401});},store);assert.equal(result.revoked,true);assert.equal(calls,1);assert.equal(rows.length,1);assert.equal(rows[0].token,undefined);assert.match(rows[0].error,/revoked/);
});
