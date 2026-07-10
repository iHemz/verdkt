// Public API response shape for POST /api/v1/analyze. A stable, versioned DTO
// mapped from the internal Analysis, so the engine can evolve without breaking
// API consumers. Large internal arrays (rSeries, equityR) are omitted.

import type { Analysis } from "@/lib/analysis";

export type ApiAnalysis = {
  apiVersion: "v1";
  verdict: Analysis["verdict"];
  tone: Analysis["tone"];
  summary: string;
  metrics: {
    trades: number;
    wins: number;
    losses: number;
    winRate: number;
    expectancyR: number;
    payoff: number;
    /** null when there are no losing trades (internally Infinity). */
    profitFactor: number | null;
    totalPnl: number;
    maxDrawdownR: number;
    /** true when R was estimated from P&L because the log had no R column. */
    usingRProxy: boolean;
  };
  outOfSample: {
    firstHalfR: number;
    secondHalfR: number;
    signFlip: boolean;
  };
  significance: {
    tStat: number;
    pValue: number;
  };
  checks: Analysis["checks"];
  attribution: Analysis["attribution"];
};

const round = (v: number, dp = 4) => Number(v.toFixed(dp));

export function toApiResponse(a: Analysis): ApiAnalysis {
  return {
    apiVersion: "v1",
    verdict: a.verdict,
    tone: a.tone,
    summary: a.summary,
    metrics: {
      trades: a.n,
      wins: a.wins,
      losses: a.losses,
      winRate: round(a.winRate),
      expectancyR: round(a.expectancyR),
      payoff: round(a.payoff),
      profitFactor: Number.isFinite(a.profitFactor) ? round(a.profitFactor, 2) : null,
      totalPnl: round(a.totalPnl, 2),
      maxDrawdownR: round(a.maxDrawdownR),
      usingRProxy: a.usingRProxy,
    },
    outOfSample: {
      firstHalfR: round(a.firstHalfR),
      secondHalfR: round(a.secondHalfR),
      signFlip: a.signFlip,
    },
    significance: {
      tStat: round(a.tStat),
      pValue: round(a.pValue),
    },
    checks: a.checks,
    attribution: a.attribution,
  };
}
