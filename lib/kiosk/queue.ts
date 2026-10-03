export type QueuedCheckIn={operation_id:string;device_scope:string;service_id:string;recorded_at:string;token?:string;error?:string};
const DATABASE='fgc-kiosk-v1',STORE='operations',MAXIMUM=200;
function open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open(DATABASE,1);request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'operation_id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('Local queue storage is unavailable.'));request.onblocked=()=>reject(Error('Close other kiosk tabs to unlock storage.'));});}
async function access<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore,resolve:(value:T)=>void)=>void):Promise<T>{
 const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode);let result:T;const store=tx.objectStore(STORE);tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=tx.onabort=()=>{db.close();reject(Error('Local queue change failed; attendance has not been acknowledged.'));};try{operation(store,value=>{result=value;});}catch(error){tx.abort();reject(error);}});
}
export async function deviceScope(credential:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(credential));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export async function listQueue(scope:string){return access<QueuedCheckIn[]>('readwrite',(store,resolve)=>{const request=store.getAll();request.onsuccess=()=>{const rows=request.result as QueuedCheckIn[];for(const row of rows){if(row.token&&Date.parse(row.recorded_at)<Date.now()-7*86400000){delete row.token;row.error='Upload window expired. Token cleared; staff must resolve this entry.';store.put(row);}}resolve(rows.filter(row=>row.device_scope===scope).sort((a,b)=>a.recorded_at.localeCompare(b.recorded_at)||a.operation_id.localeCompare(b.operation_id)));};});}
export async function enqueue(row:QueuedCheckIn){return access<void>('readwrite',(store,resolve)=>{const count=store.count();count.onsuccess=()=>{if(count.result>=MAXIMUM){store.transaction.abort();return;}store.add(row);resolve();};});}
export async function removeQueued(id:string){return access<void>('readwrite',(store,resolve)=>{store.delete(id);resolve();});}
export async function markRejected(row:QueuedCheckIn,message:string,redact=false){return access<void>('readwrite',(store,resolve)=>{const next={...row,error:message};if(redact)delete next.token;store.put(next);resolve();});}
export type QueueStorage={list:(scope:string)=>Promise<QueuedCheckIn[]>;remove:(id:string)=>Promise<void>;reject:(row:QueuedCheckIn,message:string,redact?:boolean)=>Promise<void>};
const storage:QueueStorage={list:listQueue,remove:removeQueued,reject:markRejected};
// Reachability and authorization precede each drain; each receipt must identify the submitted operation.
export async function drainQueue(credential:string,scope:string,transport:typeof fetch=fetch,store:QueueStorage=storage){
 const headers={'Content-Type':'application/json',Authorization:`Bearer ${credential}`};
 const status=await transport('/api/kiosk/status',{method:'POST',headers,body:'{}',cache:'no-store'});
 const rows=await store.list(scope);
 if(status.status===401){for(const row of rows)await store.reject(row,'Device revoked or expired. Resolve attendance through staff; stored tokens were cleared.',true);return {revoked:true,saved:0};}
 if(!status.ok)throw Error('Server unavailable. Local entries are retained.');
 let saved=0;
 for(const row of rows){
  if(!row.token||row.error)continue;
  const response=await transport('/api/kiosk/upload',{method:'POST',headers,body:JSON.stringify({operation_id:row.operation_id,service_id:row.service_id,recorded_at:row.recorded_at,token:row.token}),cache:'no-store'});
  if(response.status===401){for(const queued of await store.list(scope))await store.reject(queued,'Device revoked or expired. Staff resolution required.',true);return {revoked:true,saved};}
  if(response.status===422){await store.reject(row,'Server rejected this service/token/time. Retained for staff resolution.');continue;}
  if(!response.ok)throw Error('Upload failed. Remaining entries are retained.');
  const receipt=await response.json();if(!receipt.ok||receipt.operation_id!==row.operation_id)throw Error('Invalid acknowledgement. Entry retained.');
  await store.remove(row.operation_id);saved++;
 }
 return {revoked:false,saved};
}
