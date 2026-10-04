const fs=require('node:fs/promises');
const path=require('node:path');
const {Pool}=require('pg');
const {databaseConfig}=require('../lib/server/database-config.cjs');
const {localStorage}=require('../lib/server/file-storage.cjs');
async function cleanup(pool,storage=localStorage(),directory=process.env.UPLOAD_DIRECTORY){
 const rows=(await pool.query(`SELECT f.id,f.storage_key FROM public.stored_files f
 LEFT JOIN public.documents d ON d.id=f.document_id LEFT JOIN public.sermons s ON s.file_id=f.id
 WHERE (f.state IN ('staged','failed') AND f.created_at<now()-interval '24 hours') OR
 (f.state='ready' AND (d.archived_at<now()-interval '30 days' OR s.archived_at<now()-interval '30 days' OR f.kind='audio' AND s.id IS NULL AND f.created_at<now()-interval '24 hours')) ORDER BY f.id LIMIT 500`)).rows;
 for(const row of rows){await storage.remove(row.storage_key);await pool.query("WITH purged AS (UPDATE public.stored_files SET state='purged',updated_at=now() WHERE id=$1 RETURNING id,branch_id,owner_id) INSERT INTO public.audit_events(branch_id,actor_id,action,entity_type,entity_id) SELECT branch_id,owner_id,'automatic_file_purge','file',id FROM purged",[row.id]);}
 // Untracked files can remain if process death preceded the first durable write.
 const root=path.resolve(directory);const stat=await fs.lstat(root).catch(error=>{if(error.code==='ENOENT')return null;throw error;});if(!stat)return rows.length;if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('Unsafe storage directory');
 for(const entry of await fs.readdir(root,{withFileTypes:true})){
  const match=/^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})(\.part)?$/i.exec(entry.name);if(!match||!entry.isFile())continue;
  const filename=path.join(root,entry.name),info=await fs.lstat(filename);if(info.mtimeMs>Date.now()-86400000)continue;
  const row=(await pool.query('SELECT state FROM public.stored_files WHERE storage_key=$1',[match[1]])).rows[0];
  if(!row||row.state==='purged')await fs.unlink(filename);
 }
 return rows.length;
}
async function main(){const pool=new Pool(databaseConfig(process.env,'migration'));try{const role=(await pool.query('SELECT current_user AS name')).rows[0];if(role.name!=='fgc_owner')throw Error('Cleanup requires migration role');const result=await pool.query("SELECT pg_try_advisory_lock(731013) AS locked");if(!result.rows[0].locked)throw Error('Cleanup already running');console.log('Files reconciled:',await cleanup(pool));}finally{await pool.end();}}
if(require.main===module)main().catch(()=>{console.error('File cleanup unavailable. Check storage and maintenance configuration.');process.exitCode=1;});
module.exports={cleanup};
