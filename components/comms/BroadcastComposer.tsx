interface Props { initialMessage?: string; }

export function BroadcastComposer(props: Props) {
  void props;
  return (
    <section className="glass-panel p-5 border border-slate-200 space-y-2">
      <h2 className="font-display font-bold text-base">Broadcasts unavailable</h2>
      <p className="text-sm text-slate-600">WhatsApp and SMS broadcasts are currently unavailable.</p>
    </section>
  );
}
