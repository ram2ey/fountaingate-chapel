const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Readable}=require('node:stream');
const {createHash}=require('node:crypto');
const {logEvent,logFailure}=require('../lib/server/operational-log.cjs');
const {verifyFiles}=require('../scripts/verify-restore.cjs');
const {snapshot}=require('../scripts/ops-check.cjs');
test('error boundaries use the installed Next.js retry callback without exposing exception details',()=>{
 const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
 for(const file of ['app/error.tsx','app/global-error.tsx']){
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const exports={};vm.runInNewContext(source,{exports,require:name=>name==='next/link'?()=>null:require(name)});
  let calls=0;const tree=exports.default({error:Error('private database details'),retry:()=>{calls++;}});
  function buttons(node){if(!node||typeof node!=='object')return [];return [...(node.type==='button'?[node]:[]),...[node.props?.children].flat().flatMap(buttons)];}
  const button=buttons(tree)[0];assert.equal(typeof button.props.onClick,'function');button.props.onClick();assert.equal(calls,1);assert.doesNotMatch(JSON.stringify(tree),/private database details/);
 }
});
test('operational logs exclude secrets, SQL, personal records and arbitrary error fields',()=>{
 let output;const record=logEvent('database_connection_failed',{role:'runtime',code:'08006',password:'secret',message:'private phone',sql:'select private',status:503},value=>{output=value;});
 assert.equal(record.code,'08006');assert.equal(record.role,'runtime');assert.equal(record.status,503);assert.doesNotMatch(output,/secret|private|password|sql/);
 assert.throws(()=>logEvent('arbitrary_event',{},()=>{}));
 assert.match(logFailure('core_api_failed',Object.assign(Error('Access denied'),{name:'InputError'})),/^[a-f0-9-]{36}$/);
});
test('restore verification reads every page, closes handles and rejects altered or missing bytes',async()=>{
 let page=0,closed=0;const bytes=Buffer.from('original bytes'),digest=createHash('sha256').update(bytes).digest('hex');
 const database={query:async()=>({rows:page++<2?[{id:String(page),storage_key:'fixture',byte_size:bytes.length,digest}]:[]})};
 const storage={open:async()=>({createReadStream:()=>Readable.from([bytes]),close:async()=>{closed++;}})};
 assert.equal(await verifyFiles(database,storage),2);assert.equal(closed,2);
 page=0;await assert.rejects(verifyFiles(database,{open:async()=>({createReadStream:()=>Readable.from(['altered']),close:async()=>{closed++;}})}),/do not match/);assert.equal(closed,3);
 page=0;await assert.rejects(verifyFiles(database,{open:async()=>{throw Error('missing');}}),/missing/);
});
test('operational snapshot flags actionable failures without exposing message contents',async()=>{
 const responses=[{uncertain:1,overdue_queue:0,exhausted_reports:0},{overdue_uploads:0},{overdue_payments:0}];
 const result=await snapshot({query:async()=>({rows:[responses.shift()]})});assert.equal(result.action_required,true);assert.equal(result.messages.uncertain,1);assert.deepEqual(Object.keys(result).sort(),['action_required','checked_at','files','messages','payments']);
});
