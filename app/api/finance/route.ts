import { readFinance,writeFinance } from '../../../lib/server/finance-service';
import { financePdf } from '../../../lib/server/finance-pdf';
import { csvCell,money } from '../../../lib/server/finance-validation';
import { assertOrigin,requestBody } from '../../../lib/server/auth-input';
import { InputError } from '../../../lib/server/core-validation';
const respond=(data:object,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){
 try{const url=new URL(request.url),format=url.searchParams.get('format')||'json';if(!['json','csv','pdf'].includes(format))throw new InputError('Unsupported format.');
  const data=await readFinance(url,format!=='json');if(format==='json')return respond(data);
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Disposition':`attachment; filename="giving-${data.from}-${data.to}.${format}"`};
  if(format==='pdf')return new Response(Buffer.from(await financePdf(data,!!url.searchParams.get('receipt'))),{headers:{...headers,'Content-Type':'application/pdf'}});
  const rows=[['Date (Africa/Accra)','Donor','Kind','Amount','Currency','Fund','Method','Reference','Entry ID','Adjusts'],...data.items.map(e=>[new Intl.DateTimeFormat('en-CA',{timeZone:data.timezone,dateStyle:'medium'}).format(new Date(e.given_at)),e.donor,e.kind,money(e.amount_minor),e.currency,e.fund,e.method,e.reference,e.id,e.reversal_of])];
  return new Response('\uFEFF'+rows.map(row=>row.map((value,column)=>column===3&&/^-?\d+\.\d{2}$/.test(String(value))?'"'+value+'"':csvCell(value)).join(',')).join('\r\n'),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8'}});
 }catch(e){return respond({error:e instanceof InputError?e.message:'Financial data unavailable or access denied.'},e instanceof InputError?400:403);}
}
export async function POST(request:Request){try{assertOrigin(request);return respond(await writeFinance(await requestBody(request)));}catch(e){return respond({error:e instanceof InputError?e.message:'Entry could not be saved. Check the reference, amount and access permissions.'},e instanceof InputError?400:403);}}
