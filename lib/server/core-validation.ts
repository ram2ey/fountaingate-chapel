import 'server-only';
import { uuid } from './auth-input';

export class InputError extends Error {constructor(message:string){super(message);this.name='InputError';}}
export function text(value:unknown,name:string,max:number,required=true):string {
 if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw new InputError(`Invalid ${name}.`);
 return value.trim();
}
export function identifier(value:unknown):string {if(!uuid(value))throw new InputError('Invalid identifier.');return value;}
export function date(value:unknown):string|null {
 if(value===undefined||value==='')return null;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw new InputError('Invalid date.');return value;
}
export function boolean(value:unknown):boolean {if(typeof value!=='boolean')throw new InputError('Invalid boolean.');return value;}
export function allowedFields(body:Record<string,unknown>,fields:string[]){if(Object.keys(body).some(key=>!fields.includes(key)))throw new InputError('Unsupported field.');}
export function nextBirthday(dob:string,today:string):string {
 const birth=date(dob),now=date(today);if(!birth||!now)throw new InputError('Invalid birthday.');
 let year=Number(now.slice(0,4));const monthDay=birth.slice(5);
 function candidate(y:number){const leap=y%4===0&&(y%100!==0||y%400===0);return `${y}-${monthDay==='02-29'&&!leap?'02-28':monthDay}`;}
 if(candidate(year)<now)year++;return candidate(year);
}
