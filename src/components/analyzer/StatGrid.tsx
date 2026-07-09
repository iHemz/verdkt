import type { Analysis } from "@/lib/analysis";
import { formatCurrency, formatPercent, formatR } from "@/lib/format";

type StatProps = {
  label: string;
  value: string;
  note?: string;
  tone?: "pos" | "neg";
};

function Stat({ label, value, note, tone }: StatProps) {
  return (
    <div className="vk-stat">
      <div className="vk-stat-label">{label}</div>
      <div className={`vk-stat-value${tone ? " " + tone : ""}`}>{value}</div>
      {note && <div className="vk-stat-note">{note}</div>}
    </div>
  );
}

export function StatGrid({ analysis: a }: { analysis: Analysis }) {
  const pf = Number.isFinite(a.profitFactor) ? a.profitFactor.toFixed(2) : "∞";
  return (
    <div className="vk-stats">
      <Stat label="Trades" value={String(a.n)} note={`${a.wins}W · ${a.losses}L`} />
      <Stat
        label={a.usingRProxy ? "Expectancy (R proxy)" : "Expectancy"}
        value={formatR(a.expectancyR)}
        tone={a.expectancyR > 0 ? "pos" : "neg"}
      />
      <Stat label="Win rate" value={formatPercent(a.winRate)} />
      <Stat label="Payoff" value={`${a.payoff.toFixed(2)}×`} note={`PF ${pf}`} />
      <Stat label="Total P&L" value={formatCurrency(a.totalPnl)} tone={a.totalPnl > 0 ? "pos" : "neg"} />
      <Stat label="Max drawdown" value={`${a.maxDrawdownR.toFixed(1)}R`} tone="neg" />
    </div>
  );
}
