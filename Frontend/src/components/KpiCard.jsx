export function KpiCard({ title, value, subtitle, subtitleTone = "neutral", tone = "default" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50/80"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50/80"
        : tone === "danger"
          ? "border-red-200 bg-red-50/80"
          : "border-slate-200 bg-white/80";

  const subtitleToneClass =
    subtitleTone === "up"
      ? "text-emerald-700"
      : subtitleTone === "down"
        ? "text-red-700"
        : "text-slate-500";

  return (
    <article className={`flex flex-col rounded-xl border p-4 shadow-soft backdrop-blur ${toneClass}`}>
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-2 text-[2rem] font-semibold leading-tight text-eis-navy">{value}</h3>
      {subtitle ? <p className={`mt-2 text-xs ${subtitleToneClass}`}>{subtitle}</p> : null}
    </article>
  );
}
