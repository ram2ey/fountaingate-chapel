import { uploadFile,readMedia,mutateMedia } from '../../../lib/server/media-service';
import { assertOrigin,requestBody } from '../../../lib/server/auth-input';
import { InputError } from '../../../lib/server/core-validation';
export async function GET(request:Request){try{return Response.json(await readMedia(new URL(request.url)),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Media unavailable or access denied.'},{status:403});}}
export async function POST(request:Request){try{return Response.json(await uploadFile(request,'audio'),{status:201,headers:{'Cache-Control':'no-store'}});}catch(error){const typed=error as {status?:number};return Response.json({error:error instanceof InputError||typed.status?(error as Error).message:'Upload unavailable or access denied.'},{status:typed.status||400});}}
export async function PATCH(request:Request){try{assertOrigin(request);return Response.json(await mutateMedia(await requestBody(request)),{headers:{'Cache-Control':'no-store'}});}catch(error){return Response.json({error:error instanceof InputError?error.message:'Media change unavailable or access denied.'},{status:400});}}
