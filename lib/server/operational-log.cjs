const {randomUUID}=require('node:crypto');
const events=new Set(['database_connection_failed','database_transaction_failed','core_api_failed','finance_api_failed','communications_api_failed','media_api_failed','messaging_worker_failed','messaging_lease_expired','file_cleanup_failed','attendance_reconciliation_failed','restore_check_failed','operations_check_failed']);
const codes=new Set(['08000','08003','08006','53300','53400','57P01','57P02','57P03','57014','40001','40P01','23505','23503','42501']);
function logEvent(event,details={},sink=console.error){
 if(!events.has(event))throw Error('Unknown operational event');
 const record={timestamp:new Date().toISOString(),level:'error',event};
 if(typeof details.request_id==='string'&&/^[a-f0-9-]{36}$/i.test(details.request_id))record.request_id=details.request_id;
 if(codes.has(details.code))record.code=details.code;
 if(['runtime','identity','messaging','maintenance'].includes(details.role))record.role=details.role;
 if(Number.isInteger(details.status)&&details.status>=100&&details.status<=599)record.status=details.status;
 sink(JSON.stringify(record));return record;
}
function logFailure(event,error){const id=randomUUID();if(error?.name!=='InputError'&&error?.message!=='Access denied.')logEvent(event,{request_id:id,code:error?.code});return id;}
module.exports={logEvent,logFailure};
