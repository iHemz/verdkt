import type { Diagnosis as DiagnosisData, Leak } from "@/lib/diagnostics";

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

export function Diagnosis({ diagnosis }: { diagnosis: DiagnosisData }) {
  if (diagnosis.leaks.length === 0) return null;

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
      </div>
      {!diagnosis.hasRichData && (
        <p className="vk-topbar-note" style={{ marginTop: 14 }}>
          Upload a full broker report (with entry/exit prices, stops, targets, and times) to unlock
          exit-discipline, hold-time, and risk:reward diagnostics.
        </p>
      )}
    </div>
  );
}
