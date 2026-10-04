import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument,rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFinance } from './finance-service';
import { money } from './finance-validation';
import { InputError } from './core-validation';
export async function financePdf(report:Awaited<ReturnType<typeof readFinance>>,receipt=false){
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 const font=await pdf.embedFont(await readFile(path.join(process.cwd(),'assets/fonts/NotoSans.ttf')),{subset:true});
 const supported=new Set(font.getCharacterSet());
 let page=pdf.addPage([595.28,841.89]),y=785;
 const draw=(value:string,size=10)=>{for(const character of value){if(!supported.has(character.codePointAt(0)!))throw new InputError('This statement contains a character the PDF font cannot render. Export CSV to retain the original text.');}page.drawText(value,{x:42,y,size,font,color:rgb(.12,.16,.22)});y-=size+8;};
 const lines=(value:string,width=505,size=10)=>{
  let line='';for(const character of value.replace(/[\u0000-\u001f]/g,' ')){if(font.widthOfTextAtSize(line+character,size)>width){draw(line,size);line='';}line+=character;}if(line)draw(line,size);
 };
 const header=()=>{lines(report.church,505,18);draw(receipt?'Giving receipt / adjustment history':'Giving statement',14);draw(receipt?`Entry history | ${report.timezone}`:`${report.from} to ${report.to} | ${report.timezone}`);draw('Amounts show recorded giving and adjustments. Pending payments are excluded.');y-=8;};header();
 const room=(height:number)=>{if(y-height<65){page=pdf.addPage([595.28,841.89]);y=785;header();}};
 if(!report.items.length)draw('No recorded giving for this selection.');
 for(const row of report.items){
  const values=[`${new Intl.DateTimeFormat('en-CA',{timeZone:report.timezone,dateStyle:'medium'}).format(new Date(row.given_at))} | ${row.currency} ${money(row.amount_minor)} | ${row.kind}`,
   `${row.donor} | ${row.fund} | ${row.method}`,`Reference: ${row.reference}`,`Entry: ${row.id}`,...(row.reversal_of?[`Adjusts: ${row.reversal_of}`]:[])];
  const height=values.reduce((sum,value)=>sum+(Math.ceil(font.widthOfTextAtSize(value,10)/505)||1)*18,0)+12;room(height);
  values.forEach(value=>lines(value));y-=12;
 }
 room(80);draw('Totals by currency and fund',12);
 for(const total of report.totals){room(30);lines(`${total.currency} | ${total.fund}: net ${money(total.net_minor)}, credits ${money(total.credited_minor||'0')}, adjustments ${money(total.adjusted_minor||'0')}`);}
 pdf.getPages().forEach((p,i)=>p.drawText(`Page ${i+1} of ${pdf.getPageCount()}`,{x:42,y:30,size:9,font}));
 pdf.setTitle(receipt?'Giving receipt':'Giving statement');pdf.setProducer('Fountain Gate Chapel');return pdf.save();
}
