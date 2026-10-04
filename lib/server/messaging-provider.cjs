// Server/worker-only transport. Never expose this module or credentials to a browser.
class MessagingUnavailable extends Error {}
function messagingConfig(environment=process.env){
 const key=environment.MNOTIFY_API_KEY,sender=environment.MNOTIFY_SENDER_ID;
 if(environment.SMS_BROADCAST_ENABLED!=='true'||!key||!sender||sender.length>11)throw new MessagingUnavailable('SMS broadcasts are not configured.');
 return {key,sender};
}
async function request(endpoint,method,body,config,fetcher=fetch,signal){
 const url=new URL('https://api.mnotify.com/api/'+endpoint);url.searchParams.set('key',config.key);
 const response=await fetcher(url,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(10000)]):AbortSignal.timeout(10000)});
 const reader=response.body?.getReader();if(!reader)throw new MessagingUnavailable('Provider response unavailable.');let size=0;const chunks=[];
 try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>65536)throw new MessagingUnavailable('Provider response too large.');chunks.push(next.value);}}finally{void reader.cancel().catch(()=>{});}
 const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!data||typeof data!=='object'||Array.isArray(data))throw new MessagingUnavailable('Invalid provider response.');return {ok:response.ok,data};
}
async function sendMessage(job,config,fetcher=fetch,signal){
 // One recipient per provider campaign makes status matching and uncertainty explicit.
 try{const {ok,data}=await request('sms/quick','POST',{recipient:[job.phone.slice(1)],sender:job.provider_sender,message:job.body,is_schedule:false},config,fetcher,signal);
  const summary=data.summary;
  if(ok&&data.status==='success'&&String(data.code)==='2000'&&summary?.total_sent===1&&summary.total_rejected===0&&typeof summary._id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(summary._id))return {result:'accepted',campaign:summary._id};
  if(summary?.total_sent===0&&summary.total_rejected===1)return {result:'rejected',campaign:null};
  return {result:'uncertain',campaign:null};
 }catch{return {result:'uncertain',campaign:null};}
}
async function readReport(job,config,fetcher=fetch,signal){
 try{if(!/^[A-Za-z0-9_-]{1,128}$/.test(job.provider_campaign_id||''))return {result:'unknown',campaign:null};
  const {ok,data}=await request('campaign/'+encodeURIComponent(job.provider_campaign_id),'GET',undefined,config,fetcher,signal);
  if(!ok||data.status!=='success'||!Array.isArray(data.report))return {result:'unknown',campaign:null};
  const rows=data.report.filter(row=>row?.recipient===job.phone.slice(1)&&row.campaign_id===job.provider_campaign_id&&row.message===job.body&&row.sender===job.provider_sender);
  if(rows.length!==1)return {result:'unknown',campaign:null};
  const state=rows[0].status;
  return {result:state==='DELIVERED'?'delivered':['FAILED','REJECTED','UNDELIVERED'].includes(state)?'failed':state==='SUBMITTED'?'accepted':'unknown',campaign:null};
 }catch{return {result:'unknown',campaign:null};}
}
module.exports={MessagingUnavailable,messagingConfig,sendMessage,readReport};
