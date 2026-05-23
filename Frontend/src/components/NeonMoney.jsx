import React from "react";

const neonUp = "text-[#22c55e] ";
const neonDown = "text-[#ef4444]";
const neonNeutral = "text-eis-navy";

function classForDiff(diff) {
  if (diff == null) return neonNeutral;
  if (diff > 0) return neonUp;
  if (diff < 0) return neonDown;
  return neonNeutral;
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value, currency = "HNL") {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(safeNumber(value));
}

/**
 * Renderiza un monto con color neon según comparación vs el valor anterior.
 * - diff: (value - prevValue)
 */
export function NeonMoney({ value, prevValue = null, currency = "HNL", className = "" }) {
  const v = safeNumber(value);
  const pv = prevValue == null ? null : safeNumber(prevValue);
  const diff = pv == null ? null : v - pv;

  return (
    <span className={`${classForDiff(diff)} ${className}`.trim()}>
      {formatMoney(v, currency)}
    </span>
  );
}

