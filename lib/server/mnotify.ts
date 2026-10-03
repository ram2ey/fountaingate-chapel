import 'server-only';

export function smsConfigured() { return Boolean(process.env.MNOTIFY_API_KEY && process.env.MNOTIFY_SENDER_ID && process.env.APP_ORIGIN); }
export async function sendAuthMessage(phone: string, purpose: 'verify'|'reset'|'invite', token: string) {
  const key = process.env.MNOTIFY_API_KEY;
  const sender = process.env.MNOTIFY_SENDER_ID;
  if (!key || !sender || sender.length>11 || !process.env.APP_ORIGIN) throw new Error('SMS delivery is unavailable.');
  const origin = new URL(process.env.APP_ORIGIN);
  if (origin.protocol !== 'https:' && process.env.NODE_ENV === 'production') throw new Error('HTTPS is required.');
  const url = new URL('https://api.mnotify.com/api/sms/quick');
  url.searchParams.set('key',key);
  // Fragments are not transmitted to the web server or HTTP access logs.
  const link = `${origin.origin}/login#${purpose}=${encodeURIComponent(token)}`;
  const response = await fetch(url, { method:'POST', cache:'no-store', signal:AbortSignal.timeout(10000),
    headers:{'Content-Type':'application/json'}, body:JSON.stringify({recipient:[phone.slice(1)],sender,
      message:`Fountain Gate: ${purpose==='verify'?'Verify your phone':purpose==='reset'?'Reset your password':'Accept your staff invitation'}: ${link} . Expires shortly. Ignore if not requested.`,is_schedule:false,sms_type:'otp'}) });
  const data = await response.json();
  if (!response.ok || data.status!=='success' || String(data.code)!=='2000' || Number(data.summary?.total_rejected)>0 || Number(data.summary?.total_sent)!==1) throw new Error('SMS request was not accepted.');
  return typeof data.summary?._id==='string' ? data.summary._id : null;
}
