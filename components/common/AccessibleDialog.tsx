'use client';
import {useEffect,useId,useRef,type ReactNode} from 'react';
export function AccessibleDialog({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement|null>(null),heading=useId();
 useEffect(()=>{const dialog=ref.current;if(!dialog)return;const previous=document.activeElement instanceof HTMLElement?document.activeElement:null,overflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';return()=>{dialog.close();document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};},[]);
 return <dialog ref={ref} aria-labelledby={heading} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget){const box=event.currentTarget.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)onClose();}}} className="accessible-dialog border border-slate-300 bg-white p-5 shadow-xl"><div className="flex items-center justify-between gap-4 mb-4"><h2 id={heading} className="font-semibold text-lg">{title}</h2><button type="button" onClick={onClose} aria-label={'Close '+title} className="border px-3 py-2">Close</button></div>{children}</dialog>;
}
