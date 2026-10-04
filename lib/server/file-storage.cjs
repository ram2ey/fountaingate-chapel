const fs=require('node:fs/promises');
const {constants}=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {PDFDocument}=require('pdf-lib');
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
class FileInputError extends Error{constructor(message,status=400){super(message);this.status=status;}}
function limit(type){if(type==='application/pdf'||type==='text/plain')return 10*1024*1024;if(type==='audio/mpeg'||type==='audio/wav')return 50*1024*1024;throw new FileInputError('Supported files: PDF, UTF-8 text, MP3 and PCM WAV.',415);}
function localStorage(directory=process.env.UPLOAD_DIRECTORY){
 if(!directory||!path.isAbsolute(directory)||path.resolve(directory)===path.parse(directory).root)throw Error('Private storage unavailable');
 const root=path.resolve(directory);
 function target(key,stage=false){if(!UUID.test(key))throw Error('Invalid storage key');return path.join(root,key+(stage?'.part':''));}
 return {
  async write(key,request,type){
   const maximum=limit(type),declared=request.headers.get('content-length');
   if(declared&&(!/^\d+$/.test(declared)||Number(declared)>maximum))throw new FileInputError('File exceeds the upload limit.',413);
   if(!request.body)throw new FileInputError('Select a file.');
   await fs.mkdir(root,{recursive:true,mode:0o700});const stat=await fs.lstat(root);if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('Unsafe storage directory');
   const file=await fs.open(target(key,true),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|(constants.O_NOFOLLOW||0),0o600);
   const reader=request.body.getReader(),digest=createHash('sha256'),started=Date.now();let size=0;
   try{for(;;){let timer;let chunk;try{chunk=await Promise.race([reader.read(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new FileInputError('Upload timed out.',408)),Math.max(1,Math.min(30000,300000-(Date.now()-started))));})]);}finally{clearTimeout(timer);}const {done,value}=chunk;if(request.signal.aborted)throw new FileInputError('Upload interrupted.');if(done)break;size+=value.length;if(size>maximum)throw new FileInputError('File exceeds the upload limit.',413);digest.update(value);let offset=0;while(offset<value.length){const result=await file.write(value,offset,value.length-offset);offset+=result.bytesWritten;}}
    if(!size||declared&&Number(declared)!==size)throw new FileInputError('Empty or incomplete upload.');await file.sync();
   }finally{await reader.cancel().catch(()=>{});reader.releaseLock();await file.close();}
   await validate(target(key,true),type,size);await fs.rename(target(key,true),target(key));return {size,digest:digest.digest('hex')};
  },
  async remove(key){await Promise.all([target(key),target(key,true)].map(filename=>fs.unlink(filename).catch(error=>{if(error.code!=='ENOENT')throw error;})));},
  async open(key,size){const file=await fs.open(target(key),constants.O_RDONLY|(constants.O_NOFOLLOW||0));try{const stat=await file.stat();if(!stat.isFile()||stat.size!==Number(size))throw Error('Stored file is incomplete');return file;}catch(error){await file.close();throw error;}}
 };
}
async function validate(filename,type,size){
 const file=await fs.open(filename,'r');try{
  const prefix=Buffer.alloc(Math.min(size,65536));await file.read(prefix,0,prefix.length,0);
  if(type==='application/pdf'){if(prefix.subarray(0,5).toString()!=='%PDF-')throw new FileInputError('Invalid PDF.');try{const pdf=await PDFDocument.load(await file.readFile());if(!pdf.getPageCount())throw Error();}catch{throw new FileInputError('PDF is damaged, empty or encrypted.');}}
  else if(type==='text/plain'){try{const bytes=await file.readFile();const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(text.includes('\0'))throw Error();}catch{throw new FileInputError('Text files must contain UTF-8 text.');}}
  else if(type==='audio/wav'){
   if(prefix.toString('ascii',0,4)!=='RIFF'||prefix.toString('ascii',8,12)!=='WAVE'||prefix.readUInt32LE(4)+8!==size)throw new FileInputError('Invalid WAV file.');
   let offset=12,format=false,data=false,alignment=0;while(offset+8<=size){const header=Buffer.alloc(8);await file.read(header,0,8,offset);const n=header.readUInt32LE(4);if(offset+8+n>size)throw new FileInputError('Truncated WAV.');const tag=header.toString('ascii',0,4);if(tag==='fmt '){const fmt=Buffer.alloc(16);if(n<16)throw new FileInputError('Invalid WAV format.');await file.read(fmt,0,16,offset+8);alignment=fmt.readUInt16LE(2)*fmt.readUInt16LE(14)/8;format=fmt.readUInt16LE(0)===1&&[1,2].includes(fmt.readUInt16LE(2))&&[8,16,24,32].includes(fmt.readUInt16LE(14))&&fmt.readUInt32LE(4)>0&&fmt.readUInt16LE(12)===alignment&&fmt.readUInt32LE(8)===fmt.readUInt32LE(4)*alignment;}if(tag==='data'&&n>0&&alignment&&n%alignment===0)data=true;offset+=8+n+(n%2);}
   if(!format||!data)throw new FileInputError('Only nonempty PCM WAV is supported.');
  }else if(type==='audio/mpeg'){
   let offset=0;if(prefix.toString('ascii',0,3)==='ID3'){if(prefix.length<10||[...prefix.subarray(6,10)].some(n=>n>127))throw new FileInputError('Invalid MP3 metadata.');offset=10+((prefix[6]<<21)|(prefix[7]<<14)|(prefix[8]<<7)|prefix[9]);}
   if(prefix.toString('ascii',0,3)==='ID3'&&(prefix[5]&16))offset+=10;
   let frames=0;while(offset<size){const frame=Buffer.alloc(4);if(size-offset===128){const tail=Buffer.alloc(3);await file.read(tail,0,3,offset);if(tail.toString()==='TAG')break;}if(offset+4>size)throw new FileInputError('Truncated MP3.');await file.read(frame,0,4,offset);
    const version=(frame[1]>>3)&3,index=frame[2]>>4,sample=(frame[2]>>2)&3;
    if(frame[0]!==255||(frame[1]&224)!==224||version===1||(frame[1]&6)!==2||index===0||index===15||sample===3)throw new FileInputError('Invalid MP3 audio frame.');
    const bitrate=(version===3?[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]:[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160])[index]*1000;
    const rate=[44100,48000,32000][sample]/(version===3?1:version===2?2:4),length=Math.floor((version===3?144:72)*bitrate/rate)+((frame[2]>>1)&1);
    if(offset+length>size)throw new FileInputError('Truncated MP3 audio frame.');offset+=length;frames++;
   }if(!frames)throw new FileInputError('MP3 contains no audio.');
  }
 }finally{await file.close();}
}
function range(header,size){if(!header)return null;const match=/^bytes=(\d*)-(\d*)$/.exec(header);if(!match||!match[1]&&!match[2])throw new FileInputError('Invalid byte range.',416);let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2])),end=match[1]?(match[2]?Number(match[2]):size-1):size-1;if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||start>end||Number(match[2])===0&&!match[1])throw new FileInputError('Unsatisfiable byte range.',416);return {start,end:Math.min(end,size-1)};}
module.exports={localStorage,limit,range,FileInputError};
