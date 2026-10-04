const {Pool}=require('pg');
const fs=require('node:fs/promises');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {databaseConfig}=require('../lib/server/database-config.cjs');
const {localStorage}=require('../lib/server/file-storage.cjs');
const {logEvent}=require('../lib/server/operational-log.cjs');
async function verifyFiles(database,storage=localStorage()){
 let after=null,count=0;for(;;){const rows=(await database.query("SELECT id,storage_key,byte_size,digest FROM public.stored_files WHERE state='ready' AND ($1::uuid IS NULL OR id>$1) ORDER BY id LIMIT 100",[after])).rows;if(!rows.length)break;
  for(const file of rows){const handle=await storage.open(file.storage_key,file.byte_size),hash=createHash('sha256');try{for await(const chunk of handle.createReadStream({autoClose:false}))hash.update(chunk);}finally{await handle.close();}if(hash.digest('hex')!==file.digest)throw Error('Restored bytes do not match metadata');count++;after=file.id;}
 }return count;
}
async function main(){const pool=new Pool(databaseConfig(process.env,'migration'));try{const role=(await pool.query('SELECT current_user AS name')).rows[0];if(role.name!=='fgc_owner')throw Error('Owner role required');
 const migrations=(await fs.readdir(path.resolve(__dirname,'../db/migrations'))).filter(n=>n.endsWith('.sql')).sort();if(Number((await pool.query('SELECT count(*) AS total FROM public.schema_migrations')).rows[0].total)!==migrations.length)throw Error('Migration inventory mismatch');for(const name of migrations){const checksum=createHash('sha256').update(await fs.readFile(path.resolve(__dirname,'../db/migrations',name))).digest('hex'),row=(await pool.query('SELECT checksum FROM public.schema_migrations WHERE name=$1',[name])).rows[0];if(!row||row.checksum!==checksum)throw Error('Migration inventory mismatch');}
 console.log(JSON.stringify({event:'restore_files_verified',checked_at:new Date().toISOString(),ready_files:await verifyFiles(pool)}));
 }finally{await pool.end();}}
if(require.main===module)main().catch(()=>{logEvent('restore_check_failed',{role:'maintenance'});process.exitCode=1;});
module.exports={verifyFiles};
