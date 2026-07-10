import type { Analysis, Trade } from "@/lib/analysis";
import { StatGrid } from "./StatGrid";
import { EquityCurve } from "./EquityCurve";
import { OutOfSampleSplit } from "./OutOfSampleSplit";
import { CheckList } from "./CheckList";
import { Attribution } from "./Attribution";
import { CostStress } from "./CostStress";
import { PublishReport } from "./PublishReport";

type VerdictCardProps = {
  analysis: Analysis;
  warnings?: string[];
  /** When provided (live analysis, not a published report), shows the publish CTA. */
  trades?: Trade[];
};

/**
 * Renders an Analysis. Presentational apart from the optional publish CTA, which
 * only appears when `trades` are passed, so the public report page reuses this
 * component as a pure read-only view.
 */
export function VerdictCard({ analysis: a, warnings = [], trades }: VerdictCardProps) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section className="vk-verdict" aria-label="Edge verdict">
        <div className="vk-verdict-head" data-tone={a.tone}>
          <div className="vk-eyebrow" style={{ marginBottom: 12 }}>
            The verdict
          </div>
          <div className="vk-verdict-status" data-tone={a.tone} role="status">
            {a.verdict}
          </div>
          <p className="vk-verdict-sub">{a.summary}</p>
        </div>

        <StatGrid analysis={a} />
        <EquityCurve equityR={a.equityR} />
        <OutOfSampleSplit
          firstHalfR={a.firstHalfR}
          secondHalfR={a.secondHalfR}
          signFlip={a.signFlip}
        />

        <div className="vk-section-label">The five checks</div>
        <CheckList checks={a.checks} />

        <CostStress rSeries={a.rSeries} baseExpectancyR={a.expectancyR} />

        <Attribution dimensions={a.attribution} />
      </section>

      {a.usingRProxy && (
        <p className="vk-topbar-note">
          No R-multiple column found, so 1R was estimated as your average losing trade. Add an R
          column to your export for exact risk-normalised numbers.
        </p>
      )}
      {warnings.map((w, i) => (
        <p className="vk-topbar-note" key={i}>
          Note: {w}
        </p>
      ))}

      {trades && trades.length > 0 && <PublishReport trades={trades} />}
    </div>
  );
}
