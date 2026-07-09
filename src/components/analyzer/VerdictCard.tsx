import type { Analysis } from "@/lib/analysis";
import { StatGrid } from "./StatGrid";
import { EquityCurve } from "./EquityCurve";
import { OutOfSampleSplit } from "./OutOfSampleSplit";
import { CheckList } from "./CheckList";

type VerdictCardProps = {
  analysis: Analysis;
  warnings?: string[];
};

/**
 * Fully presentational: renders an Analysis. No state, no data fetching — so it
 * is trivial to test and to reuse (e.g. a shareable read-only report page).
 */
export function VerdictCard({ analysis: a, warnings = [] }: VerdictCardProps) {
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
    </div>
  );
}
