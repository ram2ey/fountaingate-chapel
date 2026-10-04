import { Brand } from '../layout/Brand';

interface UnavailableStateProps {
  title: string;
  description: string;
}

export function UnavailableState({ title, description }: UnavailableStateProps) {
  return (
    <section className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50">
      <section className="w-full max-w-md bg-white border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-4">
        <div className="flex justify-center"><Brand /></div>
        <h1 className="font-display font-semibold text-2xl text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </section>
    </section>
  );
}
