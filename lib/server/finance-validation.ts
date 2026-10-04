import 'server-only';
import { date,InputError } from './core-validation';
export const CHURCH_TIMEZONE='Africa/Accra';
export const FUNDS=['tithe','offering','building_fund','missions','special_seed','other'];
export function givingFund(value:unknown){if(typeof value!=='string'||!FUNDS.includes(value))throw new InputError('Choose a supported giving fund.');return value;}
export function amountMinor(value:unknown):string{
 if(typeof value!=='string'||!/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/.test(value))throw new InputError('Enter a positive amount with at most two decimal places.');
 const [whole,fraction='']=value.split('.'),amount=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));if(amount<=0n||amount>100000000000n)throw new InputError('Amount outside supported range.');return amount.toString();
}
export function currencyCode(value:unknown){if(value!=='GHS'&&value!=='USD')throw new InputError('Supported ledger currencies are GHS and USD.');return value;}
export function money(value:string):string{const n=BigInt(value),absolute=n<0n?-n:n;return `${n<0n?'-':''}${absolute/100n}.${(absolute%100n).toString().padStart(2,'0')}`;}
export function financeWindow(url:URL){
 const year=Number(url.searchParams.get('year')||new Intl.DateTimeFormat('en',{timeZone:CHURCH_TIMEZONE,year:'numeric'}).format(new Date()));
 if(!Number.isInteger(year)||year<2000||year>2100)throw new InputError('Invalid reporting year.');
 const from=date(url.searchParams.get('from')||`${year}-01-01`),to=date(url.searchParams.get('to')||`${year}-12-31`);if(!from||!to||from>to)throw new InputError('Invalid date interval.');
 return {year,from,to};
}
export function csvCell(value:unknown){let text=String(value??'');if(/^[\s\u0000-\u001f]*[=+\-@]/.test(text)||/^[\t\r\n]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
