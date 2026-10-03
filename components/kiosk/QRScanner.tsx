'use client';
import { useEffect,useRef,useState } from 'react';
import { decodeCheckInPayload } from '../../lib/kiosk/qr';
type Detector={detect:(source:HTMLVideoElement)=>Promise<{rawValue:string}[]>};
type DetectorConstructor={new(options:{formats:string[]}):Detector;getSupportedFormats:()=>Promise<string[]>};
export function QRScanner({onCapture}:{onCapture:(value:{service_id:string;token:string})=>void}){
 const video=useRef<HTMLVideoElement|null>(null),control=useRef({stream:null as MediaStream|null,timer:0,active:false,mounted:true});const [message,setMessage]=useState('');
 useEffect(()=>{const state=control.current;state.mounted=true;return()=>{state.mounted=false;state.active=false;window.clearTimeout(state.timer);state.stream?.getTracks().forEach(track=>track.stop());};},[]);
 function stop(){const state=control.current;state.active=false;window.clearTimeout(state.timer);state.stream?.getTracks().forEach(track=>track.stop());state.stream=null;}
 async function start(){stop();const state=control.current;
  try{const Constructor=(window as unknown as {BarcodeDetector?:DetectorConstructor}).BarcodeDetector;if(!Constructor||!(await Constructor.getSupportedFormats()).includes('qr_code'))throw Error('Camera QR scanning is unavailable in this browser. Enter the token manually.');
   state.active=true;const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});if(!state.mounted||!state.active){stream.getTracks().forEach(track=>track.stop());return;}state.stream=stream;
   if(!video.current)throw Error('Camera view unavailable.');video.current.srcObject=stream;await video.current.play();setMessage('Aim at the member’s QR code, then confirm capture below.');const detector=new Constructor({formats:['qr_code']});
   async function scan(){if(!state.active||!video.current)return;try{if(video.current.readyState>=2){const codes=await detector.detect(video.current);if(!state.active)return;if(codes.length){onCapture(decodeCheckInPayload(codes[0].rawValue));stop();setMessage('Code read. Confirm capture below.');return;}}}catch{if(state.mounted)setMessage('Code unreadable. Try again or enter the token manually.');}if(state.active)state.timer=window.setTimeout(()=>void scan(),400);}
   void scan();
  }catch(e){stop();if(state.mounted)setMessage(e instanceof Error?e.message:'Camera unavailable. Use manual entry.');}
 }
 return <div className="space-y-2"><div className="flex gap-3"><button type="button" onClick={()=>void start()} className="underline">Scan member QR code</button><button type="button" onClick={stop} className="underline">Stop camera</button></div><video ref={video} muted playsInline className="max-w-xs w-full" aria-label="Check-in QR camera preview"/><p role="status">{message}</p></div>;
}
