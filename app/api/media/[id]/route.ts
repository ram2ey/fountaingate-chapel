import { downloadFile } from '../../../../lib/server/media-service';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{return await downloadFile(request,(await params).id,'audio');}catch{return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});}}
export const HEAD=GET;
