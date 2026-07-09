"use client";

import { useMemo, useState } from "react";
import { stressCost, COST_PRESETS } from "@/lib/analysis";
import { formatR } from "@/lib/format";

type CostStressProps = {
  rSeries: number[];
  baseExpectancyR: number;
};

function costLabel(c: number): string {
  return c === 0 ? "None" : `${c.toFixed(2)}R`;
}

export function CostStress({ rSeries, baseExpectancyR }: CostStressProps) {
  const [costR, setCostR] = useState(0);
  const adjusted = useMemo(() => stressCost(rSeries, costR), [rSeries, costR]);

  const dropped = baseExpectancyR > 0 && adjusted.expectancyR <= 0;
  let message: string;
  if (costR === 0) {
    message = "No cost applied yet. Add a realistic round-trip cost above and watch the verdict move.";
  } else if (dropped) {
    message = `The edge does not survive a ${costR.toFixed(2)}R round-trip cost. Once you pay to trade, it stops making money.`;
  } else if (adjusted.survives) {
    message = `Still clears the bar after a ${costR.toFixed(2)}R round-trip cost. That is a good sign, few results survive realistic costs.`;
  } else {
    message = `After a ${costR.toFixed(2)}R round-trip cost the result is ${formatR(adjusted.expectancyR)} per trade and still does not clear the bar.`;
  }

  return (
    <div className="vk-cost">
      <div className="vk-section-label" style={{ padding: 0, marginBottom: 6 }}>
        Does it survive real costs?
      </div>
      <p className="vk-attr-sub">
        Every real trade pays the spread, commission and slippage, win or lose. Enter a round-trip
        cost in R (1R = your average loss) and the whole verdict re-runs with that charged to each
        trade. Retail FX round-trips are often 0.05 to 0.20R depending on stop size.
      </p>

      <div className="vk-cost-controls" role="group" aria-label="Round-trip cost">
        {COST_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            className="vk-cost-preset"
            data-active={costR === c}
            onClick={() => setCostR(c)}
          >
            {costLabel(c)}
          </button>
        ))}
        <label className="vk-cost-custom">
          <span>custom</span>
          <input
            type="number"
            min={0}
            step={0.01}
            aria-label="Custom round-trip cost in R"
            value={Number.isNaN(costR) ? "" : costR}
            onChange={(e) => setCostR(Math.max(0, Number(e.target.value) || 0))}
          />
          <span>R</span>
        </label>
      </div>

      <div className="vk-cost-result" aria-live="polite">
        <div className="vk-cost-nums">
          <span className="vk-cost-base">{formatR(baseExpectancyR)}</span>
          <span className="vk-cost-arrow" aria-hidden>
            →
          </span>
          <span className={`vk-cost-adj ${adjusted.expectancyR > 0 ? "pos" : "neg"}`}>
            {formatR(adjusted.expectancyR)}
          </span>
          <span className="vk-cost-verdict" data-tone={adjusted.tone}>
            {adjusted.verdict}
          </span>
        </div>
        <p className="vk-cost-msg">{message}</p>
      </div>
    </div>
  );
}
