import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { calculateMonthlyGrowth } = require("../../src/modules/kpis/kpis.schemas");

describe("calculateMonthlyGrowth", () => {
  it("calcula crecimiento mensual correctamente", () => {
    const input = [
      { periodo: "2026-01", total: 100 },
      { periodo: "2026-02", total: 120 },
      { periodo: "2026-03", total: 90 },
    ];

    const result = calculateMonthlyGrowth(input);

    expect(result[0].crecimiento_pct).toBeNull();
    expect(result[1].crecimiento_pct).toBe(20);
    expect(result[2].crecimiento_pct).toBe(-25);
  });
});
