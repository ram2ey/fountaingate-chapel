interface UnavailableStateProps {
  title: string;
  description: string;
}

export function UnavailableState({ title, description }: UnavailableStateProps) {
  return (
    <main className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50">
      <section className="w-full max-w-md bg-white border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-4">
        <div aria-hidden="true" className="w-14 h-14 bg-indigo-600 text-white font-bold text-xl mx-auto flex items-center justify-center">
          FGC
        </div>
        <p className="text-sm text-slate-500">Fountain Gate Chapel</p>
        <h1 className="font-display font-bold text-2xl text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </section>
    </main>
  );
}
