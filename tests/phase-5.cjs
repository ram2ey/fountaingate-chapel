const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),Module=require('node:module'),ts=require('typescript');
function load(){const original=Module._load,extension=require.extensions['.ts'];Module._load=function(name,parent,isMain){return name==='server-only'?{}:original.call(this,name,parent,isMain);};require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);return()=>{Module._load=original;require.extensions['.ts']=extension;};}
test('financial amounts and CSV preserve precision and neutralize spreadsheet formulas',()=>{const restore=load();try{
 const {amountMinor,money,csvCell,financeWindow,currencyCode,givingFund}=require('../lib/server/finance-validation.ts');
 assert.equal(amountMinor('0.01'),'1');assert.equal(amountMinor('123456789.99'),'12345678999');assert.equal(money('-12345'),'-123.45');
 for(const value of ['0','-1','NaN','Infinity','1e2','01.00','1.001','1.',1,null])assert.throws(()=>amountMinor(value));
 for(const value of ['=SUM(1,2)',' +cmd','\t@x','\nformula','-unsafe'])assert.ok(csvCell(value).startsWith('"\''));
 assert.equal(csvCell('quoted "value",\nnext'),'"quoted ""value"",\nnext"');
 assert.throws(()=>financeWindow(new URL('https://church.test?from=2026-02-31')));assert.throws(()=>financeWindow(new URL('https://church.test?from=2026-04-02&to=2026-04-01')));
 assert.throws(()=>currencyCode('EUR'));assert.throws(()=>givingFund('invented'));
}finally{restore();}});
test('checkout URLs cannot carry credentials or escape the provider host',()=>{const restore=load();try{
 const {checkoutUrl}=require('../lib/server/hubtel.ts');assert.equal(checkoutUrl('https://pay.hubtel.com/123'),'https://pay.hubtel.com/123');
 for(const url of ['http://pay.hubtel.com/x','https://hubtel.com.evil.test/x','https://user:secret@pay.hubtel.com/x','https://pay.hubtel.com:444/x','https://pay.hubtel.com/x?basicAuth=secret','https://evil.test/x'])assert.throws(()=>checkoutUrl(url));
}finally{restore();}});
test('PDF statements are real, paginated, Unicode capable and reject missing glyphs',async()=>{const restore=load();try{
 const {financePdf}=require('../lib/server/finance-pdf.ts'),{PDFDocument}=require('pdf-lib');
 const report={church:'Fountain Gate Chapel — fixture',timezone:'Africa/Accra',year:2026,from:'2026-01-01',to:'2026-12-31',totals:[{currency:'GHS',fund:'offering',net_minor:'48000',credited_minor:'48000',adjusted_minor:'0'}],items:Array.from({length:48},(_,i)=>({id:'12345678-1234-4123-8123-'+String(i).padStart(12,'0'),member_id:'fixture',donor:'José Adzo Ŋku · '+i,kind:'credit',amount_minor:'1000',currency:'GHS',fund:'offering',method:'cash',reference:'Fixture-only reference '+i+' — long text '.repeat(7),given_at:new Date('2026-01-01T12:00:00Z'),reversal_of:null}))};
 const bytes=await financePdf(report),pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>=5);assert.equal(Buffer.from(bytes).subarray(0,4).toString(),'%PDF');
 if(process.env.PDF_QA_OUTPUT){fs.mkdirSync(require('node:path').dirname(process.env.PDF_QA_OUTPUT),{recursive:true});fs.writeFileSync(process.env.PDF_QA_OUTPUT,bytes);}
 await assert.rejects(financePdf({...report,items:[{...report.items[0],donor:'🙂'}]}),/cannot render/);
}finally{restore();}});

test('ledger migration preserves legacy IDs, amounts, dates and archived donor history',async()=>{
 const {PGlite}=require('@electric-sql/pglite'),{createHash}=require('node:crypto');const db=new PGlite();try{
  await db.exec('CREATE ROLE fgc_owner;CREATE ROLE fgc_runtime;CREATE ROLE fgc_auth;');const name=(await db.query('SELECT current_database() AS name')).rows[0].name;
  await db.exec('GRANT CREATE ON DATABASE "'+name+'" TO fgc_owner;ALTER SCHEMA public OWNER TO fgc_owner;SET ROLE fgc_owner;');
  await db.exec('CREATE TABLE public.schema_migrations(name text PRIMARY KEY,checksum text NOT NULL)');
  for(const file of fs.readdirSync('db/migrations').filter(n=>n.endsWith('.sql')&&n<'0011').sort())await db.exec(fs.readFileSync('db/migrations/'+file,'utf8'));
  const branch=(await db.query("INSERT INTO public.branches(name,registration_enabled) VALUES('Migration fixture',true) RETURNING id")).rows[0].id;
  const uid=(await db.query("SELECT identity.register_member('+233241234567','fixture','Legacy donor',$1) AS id",[branch])).rows[0].id;
  await db.query("SELECT identity.finalize_member($1,$2,'Legacy donor','fixture')",[uid,branch]);
  const member=(await db.query('SELECT id FROM public.members WHERE profile_id=$1',[uid])).rows[0].id;
  const legacy=(await db.query("INSERT INTO public.contributions(branch_id,member_id,amount_minor,currency,fund,method,recorded_by,given_at) VALUES($1,$2,12345,'GHS','historic fund','cash',$3,'2025-12-31T23:59:59Z') RETURNING id",[branch,member,uid])).rows[0].id;
  await db.query('UPDATE public.members SET archived_at=now() WHERE id=$1',[member]);
  await db.exec(fs.readFileSync('db/migrations/0011_financial_ledger.sql','utf8'));
  const retained=(await db.query('SELECT id,member_id,amount_minor::text,currency,fund,reason,given_at FROM public.ledger_entries')).rows[0];
  assert.equal(retained.id,legacy);assert.equal(retained.member_id,member);assert.equal(retained.amount_minor,'12345');assert.equal(retained.fund,'historic fund');assert.equal(retained.given_at.toISOString(),'2025-12-31T23:59:59.000Z');
  assert.match(retained.reason,/original method: cash/);
  await db.query("INSERT INTO identity.sessions(token_hash,user_id,branch_id,expires_at) VALUES($1,$2,$3,now()+interval '1 hour')",[createHash('sha256').update('fixture-token').digest('hex'),uid,branch]);
  await db.exec('BEGIN;SET LOCAL ROLE fgc_runtime');await db.query("SELECT set_config('fgc.session_token','fixture-token',true)");
  assert.equal((await db.query('SELECT id FROM public.ledger_entries')).rows[0].id,legacy);await db.exec('ROLLBACK');
  await db.exec('BEGIN;SET LOCAL ROLE fgc_runtime');await db.query("SELECT set_config('fgc.session_token','fixture-token',true)");
  await assert.rejects(db.query("INSERT INTO public.payment_attempts(branch_id,actor_id,operation_id,fingerprint,provider,reference,amount_minor,currency,fund,status) VALUES($1,$2,gen_random_uuid(),'fixture','hubtel','forged',100,'GHS','offering','paid')",[branch,uid]),/row-level security/);await db.exec('ROLLBACK');
 }finally{await db.close();}
});
