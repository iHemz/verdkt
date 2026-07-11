// Tier C: a short, grounded coaching note written by Claude from the ALREADY
// COMPUTED diagnostics. The model narrates verified numbers; it is never given
// raw trades and is instructed hard against inventing anything, so it can't
// fabricate findings or claim to know the strategy.

import Anthropic from "@anthropic-ai/sdk";
import type { Analysis } from "@/lib/analysis";
import type { Leak } from "@/lib/diagnostics";

export function aiCoachEnabled(): boolean {
  // Either credential the Anthropic SDK resolves from the environment works.
  return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

const SYSTEM = `You are Verdkt's diagnostics coach. Verdkt is an honest trading-strategy analyzer whose whole brand is refusing to flatter traders.

You receive a JSON object of ALREADY-COMPUTED, verified statistics and findings about one trader's closed-trade log. Write a short coaching note (roughly 120 to 180 words) that a skeptical trader would respect.

Hard rules:
- Use ONLY numbers and findings present in the JSON. Never invent a metric, a cause, a market, or a strategy name.
- You can see outcomes, not the strategy's rules or parameters. Never claim to know WHY trades worked or WHAT the strategy is. Describe behaviour, not intent.
- Treat every suggested fix as a hypothesis to forward-test. Not a guarantee, not financial advice.
- Lead with the single most important thing. Be direct and specific with the numbers. No hype, no praise-padding, no emojis, no em-dashes.
- If the verdict is negative, say so plainly. If it holds up, say that and warn against over-optimising.
- Plain sentences a person wrote. No headings, no bullet lists. Two or three tight paragraphs.`;

export async function coachingNarrative(analysis: Analysis, leaks: Leak[]): Promise<string | null> {
  if (!aiCoachEnabled()) return null;

  const facts = {
    verdict: analysis.verdict,
    trades: analysis.n,
    winRatePct: +(analysis.winRate * 100).toFixed(1),
    expectancyR: +analysis.expectancyR.toFixed(3),
    usingRProxy: analysis.usingRProxy,
    payoff: +analysis.payoff.toFixed(2),
    profitFactor: Number.isFinite(analysis.profitFactor) ? +analysis.profitFactor.toFixed(2) : null,
    firstHalfR: +analysis.firstHalfR.toFixed(3),
    secondHalfR: +analysis.secondHalfR.toFixed(3),
    signFlipsOutOfSample: analysis.signFlip,
    tStat: +analysis.tStat.toFixed(2),
    pValue: +analysis.pValue.toFixed(3),
    maxDrawdownR: +analysis.maxDrawdownR.toFixed(1),
    leaksFound: leaks.map((l) => ({ title: l.title, detail: l.detail, fix: l.fix, impact: l.impact })),
  };

  const client = new Anthropic();
  const res = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 700,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Verified diagnostics for this trader's log. Write the coaching note.\n\n${JSON.stringify(facts, null, 2)}`,
      },
    ],
  });

  const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  return text || null;
}
