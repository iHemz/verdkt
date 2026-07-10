import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Verdkt API — validate any strategy programmatically",
  description:
    "The Verdkt Validation API: POST a trade log, get an honest edge verdict as JSON. Out-of-sample stability, significance, and attribution. Open beta.",
};

const CURL = `curl -X POST https://verdkt.vercel.app/api/v1/analyze \\
  -H "content-type: application/json" \\
  -d '{
    "trades": [
      { "pnl": 1.2, "r": 1.2, "symbol": "EUR_USD", "side": "Long" },
      { "pnl": -1.0, "r": -1.0, "symbol": "EUR_USD", "side": "Short" }
    ]
  }'`;

const RESPONSE = `{
  "apiVersion": "v1",
  "verdict": "NO ROBUST EDGE",
  "tone": "fail",
  "summary": "The overall number is positive, but the edge flips sign ...",
  "metrics": {
    "trades": 180,
    "winRate": 0.52,
    "expectancyR": 0.098,
    "payoff": 1.12,
    "profitFactor": 1.2,
    "maxDrawdownR": -22.9,
    "usingRProxy": true
  },
  "outOfSample": { "firstHalfR": 0.426, "secondHalfR": -0.231, "signFlip": true },
  "significance": { "tStat": 1.01, "pValue": 0.312 },
  "checks": [ /* the five checks, each with status + detail */ ],
  "attribution": [ /* which slices carry the edge */ ]
}`;

function Code({ children }: { children: string }) {
  return (
    <pre className="vk-code">
      <code>{children}</code>
    </pre>
  );
}

export default function DevelopersPage() {
  return (
    <main>
      <SiteHeader />

      <section className="vk-shell" style={{ paddingTop: "clamp(40px,7vw,80px)", paddingBottom: 32 }}>
        <div className="vk-eyebrow">Developers · Open beta</div>
        <h1 className="vk-h1" style={{ marginTop: 16, maxWidth: "18ch" }}>
          Validate any strategy, <em>programmatically</em>.
        </h1>
        <p className="vk-lede" style={{ marginTop: 20 }}>
          The same engine behind Verdkt, as a JSON API. Point it at a trade log and it tells you
          whether the edge is real, fragile, or fictional. Built for agents and automation that
          generate strategies faster than anyone can hand-check them.
        </p>
      </section>

      <section className="vk-shell" style={{ paddingBottom: 28 }}>
        <div className="vk-endpoint">
          <span className="vk-endpoint-method">POST</span>
          <span>https://verdkt.vercel.app/api/v1/analyze</span>
        </div>
      </section>

      <section className="vk-shell" style={{ paddingBottom: 24, display: "grid", gap: 28 }}>
        <div>
          <div className="vk-section-label" style={{ padding: 0, marginBottom: 10 }}>
            Request
          </div>
          <p style={{ color: "var(--mute)", fontSize: 15, marginBottom: 14, maxWidth: "70ch" }}>
            Send either <code className="vk-inline">trades</code> (an array of{" "}
            <code className="vk-inline">{`{ pnl, r?, date?, symbol?, side? }`}</code>) or a raw{" "}
            <code className="vk-inline">csv</code> string exported from MT4/MT5, cTrader, or
            TradingView. No key required during the open beta.
          </p>
          <Code>{CURL}</Code>
        </div>

        <div>
          <div className="vk-section-label" style={{ padding: 0, marginBottom: 10 }}>
            Response
          </div>
          <Code>{RESPONSE}</Code>
        </div>

        <div>
          <div className="vk-section-label" style={{ padding: 0, marginBottom: 10 }}>
            Rate limits
          </div>
          <p style={{ color: "var(--mute)", fontSize: 15, maxWidth: "70ch" }}>
            Open beta allows <strong>30 requests per 10 minutes</strong> per IP. Every response
            carries <code className="vk-inline">x-ratelimit-remaining</code> and{" "}
            <code className="vk-inline">x-ratelimit-reset</code> headers. Higher limits and API keys
            are coming, tell us what you are building.
          </p>
        </div>

        <div>
          <div className="vk-section-label" style={{ padding: 0, marginBottom: 10 }}>
            Verdicts
          </div>
          <p style={{ color: "var(--mute)", fontSize: 15, maxWidth: "70ch" }}>
            <code className="vk-inline">verdict</code> is one of{" "}
            <code className="vk-inline">EDGE HOLDS UP</code>,{" "}
            <code className="vk-inline">PROMISING BUT THIN</code>,{" "}
            <code className="vk-inline">NO ROBUST EDGE</code>,{" "}
            <code className="vk-inline">NO EDGE</code>, or{" "}
            <code className="vk-inline">NOT ENOUGH DATA</code>. It is deliberately built to prove a
            strategy wrong, so a positive headline number never passes on its own.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
