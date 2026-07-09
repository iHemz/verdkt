// Shared domain types for the edge-analysis pipeline.
// The flow is one-directional: raw CSV text -> parse -> Trade[] -> analyze -> Analysis.

/** A single closed trade extracted from a user's log. */
export type Trade = {
  /** Realised profit/loss in account currency (or in R if that's the only column present). */
  pnl: number;
  /** R-multiple, when the log provides an explicit R column. */
  r?: number;
  /** Epoch milliseconds, when a date/time column is present. */
  date?: number;
};

export type DetectedColumns = {
  pnl?: string;
  r?: string;
  date?: string;
};

export type ParseResult = {
  trades: Trade[];
  columns: DetectedColumns;
  rowsSeen: number;
  rowsUsed: number;
  warnings: string[];
};

export type CheckStatus = "pass" | "warn" | "fail";

export type Check = {
  key: string;
  title: string;
  status: CheckStatus;
  detail: string;
};

export type Verdict =
  | "EDGE HOLDS UP"
  | "PROMISING BUT THIN"
  | "NO ROBUST EDGE"
  | "NO EDGE"
  | "NOT ENOUGH DATA";

export type Tone = "pass" | "warn" | "fail" | "none";

export type Analysis = {
  verdict: Verdict;
  tone: Tone;
  summary: string;
  /** True when R was derived from P&L because the log had no R column. */
  usingRProxy: boolean;

  n: number;
  wins: number;
  losses: number;
  scratches: number;
  /** 0..1 */
  winRate: number;

  /** Mean R per trade. */
  expectancyR: number;
  /** Mean P&L per trade, in account-currency units. */
  expectancyCcy: number;
  totalPnl: number;
  /** Average winning trade, in R. */
  avgWin: number;
  /** Average losing trade, in R (negative). */
  avgLoss: number;
  /** avgWin / |avgLoss|. */
  payoff: number;
  profitFactor: number;
  /** Most negative peak-to-trough on the cumulative-R curve (<= 0). */
  maxDrawdownR: number;

  firstHalfR: number;
  secondHalfR: number;
  signFlip: boolean;

  tStat: number;
  pValue: number;

  /** Cumulative-R equity curve, one point per trade. */
  equityR: number[];
  checks: Check[];
};

/** Minimum trades before any conclusion is honest. */
export const MIN_SAMPLE = 30;
/** Trades needed for a "healthy" sample. */
export const HEALTHY_SAMPLE = 200;
/** Significance threshold for the two-sided test against zero. */
export const ALPHA = 0.05;
