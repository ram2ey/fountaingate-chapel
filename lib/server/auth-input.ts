import 'server-only';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { tokenDigest } from './auth';
import type { PoolClient } from 'pg';

export function normalizedPhone(value: unknown): string {
  if (typeof value !== 'string' || !value.trim().startsWith('+') || value.length>32) throw new Error('Enter a valid international phone number including +country code.');
  const phone = parsePhoneNumberFromString(value);
  if (!phone?.isValid() || phone.ext) throw new Error('Enter a valid international phone number.');
  return phone.number;
}
export function uuid(value: unknown): value is string { return typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value); }
export function assertOrigin(request: Request) {
  const configured = process.env.APP_ORIGIN;
  if (!configured) throw new Error('Authentication is not configured.');
  const origin = new URL(configured).origin;
  if ((process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) || request.headers.get('origin') !== origin || request.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new Error('Invalid request origin.');
}
export async function requestBody(request: Request): Promise<Record<string, unknown>> {
  if(!request.body)throw new Error('Invalid request.');
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;
  try {for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();throw new Error('Request too large.');}chunks.push(value);}}
  finally {reader.releaseLock();}
  const text = Buffer.concat(chunks).toString('utf8');
  const body = JSON.parse(text);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid request.');
  return body;
}
export async function rateLimit(client: PoolClient, scope: string, identifier: string, maximum=10) {
  const result = await client.query<{ attempts: number }>(`INSERT INTO identity.rate_limits(key_hash,window_start,attempts) VALUES($1,now(),1)
    ON CONFLICT(key_hash) DO UPDATE SET attempts=CASE WHEN identity.rate_limits.window_start<now()-interval '15 minutes' THEN 1 ELSE identity.rate_limits.attempts+1 END,
    window_start=CASE WHEN identity.rate_limits.window_start<now()-interval '15 minutes' THEN now() ELSE identity.rate_limits.window_start END RETURNING attempts`,[tokenDigest(scope+':'+identifier)]);
  return result.rows[0].attempts<=maximum;
}
