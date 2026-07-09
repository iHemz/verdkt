import type { DimensionAttribution, SegmentStat } from "@/lib/analysis";
import { formatR } from "@/lib/format";

const ROLE_LABEL: Record<SegmentStat["role"], string> = {
  carrier: "carrier",
  drag: "drag",
  thin: "too thin",
};

function SegmentRow({ s }: { s: SegmentStat }) {
  const pos = s.expectancyR > 0;
  const barWidth = Math.max(4, Math.min(100, s.share * 100));
  return (
    <div className="vk-attr-row">
      <div className="vk-attr-name" title={s.label}>
        {s.label}
      </div>
      <div className={`vk-attr-exp ${pos ? "pos" : "neg"}`}>{formatR(s.expectancyR)}</div>
      <div className="vk-attr-n">
        {s.n} <span className="vk-attr-n-unit">trades</span>
      </div>
      <div className="vk-attr-track" aria-hidden>
        <div
          className="vk-attr-fill"
          style={{
            width: `${barWidth}%`,
            background: pos ? "var(--pass)" : "var(--fail)",
            opacity: s.role === "thin" ? 0.4 : 1,
          }}
        />
      </div>
      <div className="vk-attr-chip" data-role={s.role}>
        {ROLE_LABEL[s.role]}
      </div>
    </div>
  );
}

function Dimension({ dim }: { dim: DimensionAttribution }) {
  return (
    <div className="vk-attr-dim">
      <div className="vk-attr-dim-head">
        <span className="vk-attr-dim-label">{dim.label}</span>
        {dim.insight && <span className="vk-attr-insight">{dim.insight}</span>}
      </div>
      <div className="vk-attr-rows">
        {dim.segments.map((s) => (
          <SegmentRow key={s.label} s={s} />
        ))}
      </div>
    </div>
  );
}

export function Attribution({ dimensions }: { dimensions: DimensionAttribution[] }) {
  if (dimensions.length === 0) return null;

  return (
    <div className="vk-attr">
      <div className="vk-section-label" style={{ padding: 0, marginBottom: 6 }}>
        Where the edge lives
      </div>
      <p className="vk-attr-sub">
        Which slices of your log carry the result, ranked by contribution. This is descriptive, not
        causal: it shows where the edge sits, not why the signal works. Slice a log enough ways and
        something always looks good by luck, so a segment is only marked{" "}
        <span style={{ color: "var(--pass)" }}>carries edge</span> when it is both big enough and
        statistically separable from zero. Thin slices are flagged.
      </p>
      <div className="vk-attr-dims">
        {dimensions.map((d) => (
          <Dimension key={d.key} dim={d} />
        ))}
      </div>
    </div>
  );
}
