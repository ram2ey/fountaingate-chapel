export function decodeCheckInPayload(raw:string):{service_id:string;token:string}{
 if(raw.length>300)throw Error('Invalid check-in QR code.');
 const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(key=>!['service_id','token'].includes(key))||typeof data.service_id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(data.service_id)||typeof data.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(data.token))throw Error('Invalid check-in QR code.');
 return {service_id:data.service_id,token:data.token};
}
