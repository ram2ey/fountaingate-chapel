const {logEvent}=require('../lib/server/operational-log.cjs');
const {Client}=require('pg');
const {databaseConfig}=require('../lib/server/database-config.cjs');
async function reconcile(){
 const client=new Client(databaseConfig(process.env,'migration'));
 await client.connect();
 try{await client.query("SET statement_timeout='60s'");const result=await client.query('SELECT identity.reconcile_attendance(100) AS completed');console.log('Completed services:',result.rows[0].completed);}
 finally{await client.end();}
}
if(require.main===module)reconcile().catch(()=>{logEvent('attendance_reconciliation_failed',{role:'maintenance'});process.exitCode=1;});
module.exports={reconcile};
