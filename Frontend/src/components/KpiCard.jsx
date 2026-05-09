export function KpiCard({ title, value, subtitle }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-soft backdrop-blur">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-semibold text-eis-navy">{value}</h3>
      {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
    </article>
  );
}
