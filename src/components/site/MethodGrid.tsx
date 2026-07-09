type Method = { n: string; title: string; body: string };

const METHODS: Method[] = [
  {
    n: "01",
    title: "Expectancy in R",
    body: "Not total profit, but average risk-adjusted result per trade. A high win rate with fat losers gets caught here.",
  },
  {
    n: "02",
    title: "Out-of-sample split",
    body: "Splits your trades in half by time. If the edge flips sign across the halves, it's a regime artifact, not a strategy.",
  },
  {
    n: "03",
    title: "Significance",
    body: "A t-test against zero. If the result isn't statistically separable from luck plus costs, you'll be told.",
  },
  {
    n: "04",
    title: "Sample size",
    body: "Small samples routinely show fake edges. Verdkt is blunt about when you simply don't have enough trades.",
  },
];

export function MethodGrid() {
  return (
    <div className="vk-shell" style={{ paddingBottom: 72 }}>
      <div className="vk-section-label" style={{ padding: 0, marginBottom: 18 }}>
        What it checks
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 18,
        }}
      >
        {METHODS.map((m) => (
          <div
            key={m.n}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: 22,
              background: "var(--ink-850)",
            }}
          >
            <div className="vk-eyebrow" style={{ color: "var(--faint)" }}>
              {m.n}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginTop: 10 }}>
              {m.title}
            </div>
            <p style={{ color: "var(--mute)", fontSize: 14.5, marginTop: 8 }}>{m.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
