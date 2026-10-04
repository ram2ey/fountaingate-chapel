import 'server-only';
import { InputError } from './core-validation';
import { amountMinor } from './finance-validation';
export class PaymentUnavailable extends Error {}
export function paymentConfig(){
 const id=process.env.HUBTEL_CLIENT_ID,secret=process.env.HUBTEL_CLIENT_SECRET,merchant=process.env.HUBTEL_MERCHANT_ACCOUNT;
 const origin=process.env.APP_ORIGIN,callback=process.env.HUBTEL_CALLBACK_TOKEN;
 if(process.env.PAYMENTS_ENABLED!=='true'||process.env.HUBTEL_CONTRACT_CONFIRMED!=='true'||!id||!secret||!merchant||!/^\d+$/.test(merchant)||!origin||new URL(origin).protocol!=='https:'||!callback||!/^[A-Za-z0-9_-]{43}$/.test(callback))throw new PaymentUnavailable('Online giving is not configured.');
 return {merchant,origin:new URL(origin).origin,callback,authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64')};
}
export function paymentsEnabled(){try{paymentConfig();return true;}catch{return false;}}
async function providerRequest(url:string,method:string,body?:object){
 const config=paymentConfig();
 let response:Response;
 try{response=await fetch(url,{method,headers:{Authorization:config.authorization,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});}catch{throw new PaymentUnavailable('Hubtel is unavailable. Check existing attempts before creating another payment.');}
 if(!response.ok)throw new PaymentUnavailable('Hubtel is unavailable. Retry verification later.');
 const reader=response.body?.getReader();if(!reader)throw new PaymentUnavailable('Invalid provider response.');let size=0;const parts:Uint8Array[]=[];
 try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>65536)throw new PaymentUnavailable('Invalid provider response.');parts.push(next.value);}}finally{await reader.cancel();}
 try{const data=JSON.parse(Buffer.concat(parts).toString('utf8'));if(!data||typeof data!=='object'||Array.isArray(data))throw new Error();return data as Record<string,unknown>;}catch{throw new PaymentUnavailable('Invalid provider response.');}
}
export function checkoutUrl(value:unknown){
 if(typeof value!=='string')throw new PaymentUnavailable('Invalid checkout response.');const url=new URL(value);
 if(url.protocol!=='https:'||!['pay.hubtel.com','checkout.hubtel.com','unified-pay.hubtel.com'].includes(url.hostname)||url.username||url.password||url.port||[...url.searchParams.keys()].some(key=>/auth|secret|token/i.test(key)))throw new PaymentUnavailable('Invalid checkout response.');return url.href;
}
// Hosted initialization contract must be confirmed against the merchant portal before enabling.
export async function initiateHubtel(reference:string,amount:string,fund:string){
 const config=paymentConfig();const response=await providerRequest('https://payproxyapi.hubtel.com/items/initiate','POST',{
  totalAmount:Number(amount)/100,description:'Fountain Gate Chapel: '+fund,callbackUrl:config.origin+'/api/payments/callback/'+config.callback+'?reference='+reference,
  returnUrl:config.origin+'/giving',cancellationUrl:config.origin+'/giving',merchantAccountNumber:config.merchant,clientReference:reference,
 });
 const data=response.data as Record<string,unknown>|undefined;
 if(response.responseCode!=='0000'||!data||data.clientReference!==reference)throw new PaymentUnavailable('Checkout initialization could not be confirmed.');
 return checkoutUrl(data.checkoutUrl);
}
// Status endpoint and fields are documented in Hubtel's official Flutter SDK.
export async function verifyHubtel(reference:string,expectedAmount:string){
 const config=paymentConfig(),url=new URL(`https://checkout.hubtel.com/api/v1/merchant/${config.merchant}/unifiedcheckout/statuscheck`);url.searchParams.set('clientReference',reference);
 const response=await providerRequest(url.href,'GET'),data=response.data as Record<string,unknown>|undefined;
 if(!data||data.clientReference!==reference||data.currencyCode!=='GHS'||!['string','number'].includes(typeof data.amount)||amountMinor(String(data.amount))!==expectedAmount)throw new PaymentUnavailable('Provider verification did not match the payment.');
 const status=typeof data.status==='string'?data.status.toLowerCase():'';
 if(!['paid','unpaid','expired','failed'].includes(status))throw new PaymentUnavailable('Provider status requires reconciliation.');
 if(typeof data.transactionID!=='string'||!data.transactionID||data.transactionID.length>160)throw new PaymentUnavailable('Provider transaction identifier missing.');
 return {transaction:data.transactionID,amount:expectedAmount,currency:'GHS',state:status==='paid'?'success':status==='unpaid'?'pending':'failed',refunded:'0'};
}
export function paymentReference(value:unknown){if(typeof value!=='string'||!/^[a-f0-9]{32}$/.test(value))throw new InputError('Invalid payment reference.');return value;}
