'use client';
import { useEffect,useRef } from 'react';
import QRCode from 'qrcode';
export function CheckInCode({token,service}:{token:string;service:string}){const canvas=useRef<HTMLCanvasElement|null>(null);useEffect(()=>{const target=canvas.current;if(!target)return;QRCode.toCanvas(target,JSON.stringify({token,service_id:service}),{width:256,errorCorrectionLevel:'M'}).catch(()=>{});return()=>{target.getContext('2d')?.clearRect(0,0,target.width,target.height);};},[token,service]);return <canvas ref={canvas} aria-label="Five-minute member check-in QR code"/>;}
