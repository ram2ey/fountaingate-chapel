import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { TOTP, Secret } from 'otpauth';

function key() {
  const value=Buffer.from(process.env.AUTH_ENCRYPTION_KEY||'','base64');
  if(value.length!==32) throw new Error('Staff authentication is not configured.');
  return value;
}
export function encryptSecret(secret: string) {
  const iv=randomBytes(12), cipher=createCipheriv('aes-256-gcm',key(),iv);
  const encrypted=Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]);
  return [iv,cipher.getAuthTag(),encrypted].map(part=>part.toString('base64')).join('.');
}
export function decryptSecret(value: string) {
  const [iv,tag,data]=value.split('.').map(part=>Buffer.from(part,'base64'));
  const decipher=createDecipheriv('aes-256-gcm',key(),iv);decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8');
}
export function newTotp(phone: string) { return new TOTP({issuer:'Fountain Gate Chapel',label:phone,algorithm:'SHA1',digits:6,period:30,secret:new Secret({size:20})}); }
export function totpCounter(secret: string, token: unknown) {
  if(typeof token!=='string'||!/^\d{6}$/.test(token)) return null;
  const totp=new TOTP({secret:Secret.fromBase32(secret),algorithm:'SHA1',digits:6,period:30});
  const delta=totp.validate({token,window:1});return delta===null?null:totp.counter()+delta;
}
