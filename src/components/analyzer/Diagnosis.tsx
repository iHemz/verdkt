"use client";

import { toast } from "sonner";
import type { Diagnosis as DiagnosisData, Leak } from "@/lib/diagnostics";
import type { Trade } from "@/lib/analysis";
import { useDeepDiagnosis } from "@/hooks/diagnostics/useDeepDiagnosis";
import { Button } from "@/components/ui/Button";

const TAG: Record<Leak["severity"], string> = {
  bad: "Leak",
  warn: "Watch",
  info: "Note",
  good: "Solid",
};

function LeakRow({ leak }: { leak: Leak }) {
  return (
    <div className="vk-leak">
      <div className="vk-leak-head">
        <span className="vk-leak-tag" data-sev={leak.severity}>
          {TAG[leak.severity]}
        </span>
        <span className="vk-leak-title">{leak.title}</span>
        {leak.impact && <span className="vk-leak-impact">{leak.impact}</span>}
      </div>
      <p className="vk-leak-detail">{leak.detail}</p>
      {leak.fix && (
        <p className="vk-leak-fix">
          <span aria-hidden>→ </span>
          {leak.fix}
        </p>
      )}
    </div>
  );
}

export function Diagnosis({ diagnosis, trades }: { diagnosis: DiagnosisData; trades: Trade[] }) {
  const deep = useDeepDiagnosis();
  const data = deep.data;

  if (diagnosis.leaks.length === 0 && !diagnosis.hasRichData) return null;

  function runDeep() {
    deep.mutate(trades, { onError: (err) => toast.error(err.message) });
  }

  return (
    <div className="vk-diagnosis">
      <div className="vk-section-label" style={{ padding: 0, marginBottom: 6 }}>
        What to fix
      </div>
      <p className="vk-attr-sub">
        Where the edge is leaking and what to change, measured on your own trades. Descriptive, not
        prescriptive: simulated fixes are in-sample, so forward-test before you commit real money.
      </p>

      <div className="vk-leaks">
        {diagnosis.leaks.map((leak) => (
          <LeakRow key={leak.key} leak={leak} />
        ))}
        {data?.marketLeaks.map((leak) => (
          <LeakRow key={leak.key} leak={leak} />
        ))}
      </div>

      {diagnosis.hasRichData ? (
        <div className="vk-deep">
          {!data && (
            <>
              <p className="vk-deep-pitch">
                Price every trade against real market data and get a coaching note written from your
                own numbers: where you leave money on the table, whether your stops are too tight,
                and the one thing to fix first.
              </p>
              <Button onClick={runDeep} disabled={deep.isPending}>
                {deep.isPending ? "Analysing your trades…" : "Run deep diagnosis"}
              </Button>
              {deep.isPending && (
                <p className="vk-topbar-note" style={{ marginTop: 10 }}>
                  Pricing each trade against market history. This can take up to a minute the first
                  time.
                </p>
              )}
            </>
          )}

          {data && (
            <>
              {data.narrative && (
                <div className="vk-coach">
                  <div className="vk-coach-label">Coach&apos;s note</div>
                  {data.narrative.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
              {!data.narrative && data.aiEnabled === false && (
                <p className="vk-topbar-note">
                  Market checks ran; the AI coaching note is not configured on this deployment.
                </p>
              )}
              {data.marketLeaks.length === 0 && data.coverage.matched === 0 && (
                <p className="vk-topbar-note">
                  {data.coverage.tooLarge
                    ? "Your history spans too long a window for the live market pass, so the market checks were skipped."
                    : "We couldn't match your symbols to market data, so the market checks were skipped."}
                </p>
              )}
              {data.coverage.matched > 0 && (
                <p className="vk-topbar-note" style={{ marginTop: 10 }}>
                  Market pass priced {data.coverage.matched} of {data.coverage.eligible} eligible
                  trades.
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <p className="vk-topbar-note" style={{ marginTop: 14 }}>
          Upload a full broker report (with entry/exit prices, stops, targets, and times) to unlock
          the market-data checks and the AI coaching note.
        </p>
      )}
    </div>
  );
}
