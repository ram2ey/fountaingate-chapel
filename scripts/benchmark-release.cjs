// Development-only, isolated SQL measurements. Never connects to configured databases.
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
async function main(){const db=new PGlite({extensions:{pg_trgm:require('@electric-sql/pglite/contrib/pg_trgm').pg_trgm}});try{
 await db.exec('CREATE ROLE fgc_owner;CREATE ROLE fgc_runtime;CREATE ROLE fgc_auth;CREATE ROLE fgc_messaging;');
 const name=(await db.query('SELECT current_database() AS name')).rows[0].name;
 await db.exec('GRANT CREATE ON DATABASE "'+name+'" TO fgc_owner;ALTER SCHEMA public OWNER TO fgc_owner;SET ROLE fgc_owner;');
 for(const file of fs.readdirSync('db/migrations').filter(n=>n.endsWith('.sql')).sort())await db.exec(fs.readFileSync('db/migrations/'+file,'utf8'));
 await db.exec('RESET ROLE');const branch=(await db.query("INSERT INTO public.branches(name) VALUES('Isolated benchmark') RETURNING id")).rows[0].id;
 const user=(await db.query("INSERT INTO identity.users(phone,password_hash,phone_verified_at) VALUES('+233241234599','unusable-test-only',now()) RETURNING id")).rows[0].id;
 await db.query("INSERT INTO public.profiles(id,full_name) VALUES($1,'Isolated synthetic operator')",[user]);
 await db.query("INSERT INTO identity.memberships(user_id,branch_id,role) VALUES($1,$2,'admin')",[user,branch]);
 const token='isolated-benchmark-only';await db.query("INSERT INTO identity.sessions(token_hash,user_id,branch_id,expires_at,mfa_verified_at) VALUES($1,$2,$3,now()+interval '1 hour',now())",[createHash('sha256').update(token).digest('hex'),user,branch]);
 await db.query("INSERT INTO public.members(branch_id,first_name,last_name) SELECT $1,'Member '||n,'Synthetic' FROM generate_series(1,10000)n",[branch]);
 const member=(await db.query('SELECT id FROM public.members LIMIT 1')).rows[0].id;
 await db.query("INSERT INTO public.care_notes(branch_id,member_id,author_id,body,confidential) SELECT $1,$2,$3,'Synthetic follow-up '||n,false FROM generate_series(1,5000)n",[branch,member,user]);
 await db.query("INSERT INTO public.ledger_entries(branch_id,recorded_by,operation_id,fingerprint,kind,amount_minor,currency,fund,method,reference,reason,given_at) SELECT $1,$2,gen_random_uuid(),'test-only','credit',100,'GHS','offering','cash','benchmark-'||n,'synthetic',now()-n*interval '1 minute' FROM generate_series(1,10000)n",[branch,user]);
 await db.exec('ANALYZE public.members;ANALYZE public.care_notes;ANALYZE public.ledger_entries;BEGIN;SET LOCAL ROLE fgc_runtime;');await db.query("SELECT set_config('fgc.session_token',$1,true)",[token]);
 const queries={directory:"SELECT id FROM public.members WHERE archived_at IS NULL AND (first_name||' '||last_name) ILIKE '%Member 999%' ORDER BY created_at DESC,id DESC LIMIT 26",care:"SELECT id FROM public.care_notes WHERE archived_at IS NULL AND body ILIKE '%follow-up%' AND EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.archived_at IS NULL) ORDER BY created_at DESC,id DESC LIMIT 26",ledger:"SELECT id FROM public.ledger_entries WHERE given_at>=now()-interval '1 year' ORDER BY given_at,id LIMIT 101"};
 const results={engine:'PGlite PostgreSQL WASM; not Hetzner latency',role:'fgc_runtime',rows:{members:10000,care:5000,ledger:10000},queries:{}};
 for(const [key,sql]of Object.entries(queries)){const value=(await db.query('EXPLAIN (ANALYZE,FORMAT JSON) '+sql)).rows[0]['QUERY PLAN'][0];if(!value.Plan['Actual Rows'])throw Error('Benchmark denied or empty');const indexes=[];function walk(plan){if(plan['Index Name'])indexes.push(plan['Index Name']);for(const child of plan.Plans||[])walk(child);}walk(value.Plan);results.queries[key]={execution_ms:value['Execution Time'],returned_rows:value.Plan['Actual Rows'],indexes:[...new Set(indexes)]};}
 await db.exec('ROLLBACK');console.log(JSON.stringify(results,null,2));
 }finally{await db.close();}}
main().catch(()=>{console.error('Isolated performance benchmark failed.');process.exitCode=1;});
