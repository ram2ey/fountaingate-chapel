import Image from 'next/image';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`flex min-w-0 items-center ${compact ? 'gap-2' : 'gap-2.5'}`}>
    <Image src="/images/church-logo.jpeg" alt="" width={40} height={40} className={`shrink-0 rounded-md bg-white object-contain ${compact ? 'h-9 w-9' : 'h-10 w-10'}`} />
    <div className="min-w-0">
      <p className={`font-display font-semibold leading-tight text-slate-900 ${compact ? 'text-sm sm:text-base' : 'text-sm'}`}>Fountain Gate<span className={compact ? 'sr-only sm:not-sr-only' : ''}> Chapel</span></p>
      <p className="mt-1 text-xs text-slate-500">Change Pastures</p>
    </div>
  </div>;
}
