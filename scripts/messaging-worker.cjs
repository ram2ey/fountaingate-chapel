const {Pool}=require('pg');
const {databaseConfig}=require('../lib/server/database-config.cjs');
const {messagingConfig,sendMessage,readReport}=require('../lib/server/messaging-provider.cjs');
const {logEvent}=require('../lib/server/operational-log.cjs');
async function processOne(database,{config,fetcher=fetch,signal}={}){
 if(signal?.aborted)return false;
 const job=(await database.query('SELECT * FROM identity.claim_message()')).rows[0];if(!job)return false;
 if(job.work==='send'){
  // Durable checkpoint before HTTP: a crash after this point must never blindly resend.
  const begun=(await database.query('SELECT identity.begin_message($1,$2,$3) AS ok',[job.id,job.lease_token,config.sender])).rows[0].ok;
  if(!begun)return true;
 }
 const result=job.work==='send'?await sendMessage(job,config,fetcher,signal):await readReport(job,config,fetcher,signal);
 const saved=(await database.query('SELECT identity.finish_message($1,$2,$3,$4) AS ok',[job.id,job.lease_token,result.result,result.campaign])).rows[0].ok;
 if(!saved)logEvent('messaging_lease_expired',{role:'messaging'});
 return true;
}
async function main(){
 // Disabled workers exit before connecting or making any provider request.
 const config=messagingConfig();const pool=new Pool(databaseConfig(process.env,'messaging'));pool.on('error',()=>logEvent('database_connection_failed',{role:'messaging'}));
 const shutdown=new AbortController();const stop=()=>shutdown.abort();process.once('SIGTERM',stop);process.once('SIGINT',stop);
 try{
  const role=(await pool.query('SELECT current_user AS name,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];
  if(role?.name!=='fgc_messaging'||role.rolsuper||role.rolbypassrls||(await pool.query("SELECT 1 FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') AND tableowner=current_user LIMIT 1")).rows.length)throw new Error('Unsafe messaging role');
  do{
   try{const worked=await processOne(pool,{config,signal:shutdown.signal});if(!worked&&!process.argv.includes('--once')&&!shutdown.signal.aborted)await new Promise(resolve=>{const timer=setTimeout(done,2000);function done(){clearTimeout(timer);shutdown.signal.removeEventListener('abort',done);resolve();}shutdown.signal.addEventListener('abort',done,{once:true});});}
   catch{logEvent('messaging_worker_failed',{role:'messaging'});if(!process.argv.includes('--once'))await new Promise(resolve=>setTimeout(resolve,2000));else throw new Error('Worker check failed');}
  }while(!shutdown.signal.aborted&&!process.argv.includes('--once'));
 }finally{process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);await pool.end();}
}
if(require.main===module)main().catch(()=>{logEvent('messaging_worker_failed',{role:'messaging'});process.exitCode=1;});
module.exports={processOne};
