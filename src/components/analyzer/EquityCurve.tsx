// Hand-built SVG equity curve (cumulative R). No chart library — keeps the
// bundle tiny and the look native to the design system.

type EquityCurveProps = {
  equityR: number[];
};

const WIDTH = 900;
const HEIGHT = 220;
const PAD = 8;

export function EquityCurve({ equityR }: EquityCurveProps) {
  if (equityR.length < 2) return null;

  const series = [0, ...equityR]; // start the curve at zero
  const min = Math.min(0, ...series);
  const max = Math.max(0, ...series);
  const range = max - min || 1;

  const x = (i: number) => PAD + (i / (series.length - 1)) * (WIDTH - PAD * 2);
  const y = (v: number) => HEIGHT - PAD - ((v - min) / range) * (HEIGHT - PAD * 2);

  const line = series
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(series.length - 1).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z`;

  const ends = equityR[equityR.length - 1];
  const stroke = ends >= 0 ? "var(--pass)" : "var(--fail)";
  const fillId = ends >= 0 ? "vk-grad-pos" : "vk-grad-neg";
  const splitX = x(Math.floor(series.length / 2));

  return (
    <div className="vk-curve">
      <div className="vk-half-label" style={{ marginBottom: 12 }}>
        Cumulative R · equity curve
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Cumulative R equity curve">
        <defs>
          <linearGradient id="vk-grad-pos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pass)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--pass)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="vk-grad-neg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--fail)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--fail)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1={PAD}
          x2={WIDTH - PAD}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--line-strong)"
          strokeDasharray="3 4"
        />
        <line
          x1={splitX}
          x2={splitX}
          y1={PAD}
          y2={HEIGHT - PAD}
          stroke="var(--glow)"
          strokeOpacity="0.3"
          strokeDasharray="2 5"
        />
        <path d={area} fill={`url(#${fillId})`} />
        <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="vk-half-label" style={{ marginTop: 8, textAlign: "center" }}>
        dashed vertical = out-of-sample split point
      </div>
    </div>
  );
}
