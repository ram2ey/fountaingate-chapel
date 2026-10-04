import { timingSafeEqual } from 'node:crypto';
import { reconcilePayment } from '../../../../../lib/server/payment-service';
import { paymentReference,paymentsEnabled } from '../../../../../lib/server/hubtel';
// Capability-protected notification, not a fabricated Hubtel payload signature.
// No callback amount/status is trusted; an authenticated provider lookup is mandatory.
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params,expected=process.env.HUBTEL_CALLBACK_TOKEN||'';
 if(!paymentsEnabled()||!expected||!/^[A-Za-z0-9_-]{43}$/.test(token)||token.length!==expected.length||!timingSafeEqual(Buffer.from(token),Buffer.from(expected)))return new Response(null,{status:404});
 if(!request.headers.get('content-type')?.includes('application/json'))return new Response(null,{status:415});
 const reader=request.body?.getReader();if(!reader)return new Response(null,{status:400});let size=0;
 const signal=AbortSignal.timeout(5000),abort=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',abort,{once:true});
 try{while(true){const next=await reader.read();signal.throwIfAborted();if(next.done)break;size+=next.value.length;if(size>16384)return new Response(null,{status:413});}
  const reference=paymentReference(new URL(request.url).searchParams.get('reference'));
  await reconcilePayment(reference,true);return new Response(null,{status:200,headers:{'Cache-Control':'no-store'}});
 }catch{return new Response(null,{status:503,headers:{'Retry-After':'30'}});}finally{signal.removeEventListener('abort',abort);void reader.cancel().catch(()=>{});}
}
