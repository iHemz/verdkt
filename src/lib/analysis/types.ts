// Shared domain types for the edge-analysis pipeline.
// The flow is one-directional: raw CSV text -> parse -> Trade[] -> analyze -> Analysis.

/** A single closed trade extracted from a user's log. */
export type Trade = {
  /** Realised profit/loss in account currency (or in R if that's the only column present). */
  pnl: number;
  /** R-multiple, when the log provides an explicit R column. */
  r?: number;
  /** Epoch milliseconds of the open, when a date/time column is present. Used for ordering. */
  date?: number;
  /** Instrument/symbol, when the log has one. Used for edge attribution. */
  symbol?: string;
  /** Trade direction, normalised to "Long" | "Short" when derivable. */
  side?: string;

  // Rich fields from full broker exports (MT5, cTrader). Optional; power the
  // diagnostics engine. Absent on bare P&L logs, which degrade gracefully.
  /** Entry/open price. */
  entryPrice?: number;
  /** Exit/close price. */
  exitPrice?: number;
  /** Stop-loss price as set on the order. */
  stopLoss?: number;
  /** Take-profit price as set on the order. */
  takeProfit?: number;
  /** Position size / volume (lots). */
  volume?: number;
  /** Epoch milliseconds of the close, for hold-time diagnostics. */
  closeTime?: number;
};

export type DetectedColumns = {
  pnl?: string;
  r?: string;
  date?: string;
  symbol?: string;
  side?: string;
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

  /** Per-trade R series, in trade order. Feeds the cost stress test. */
  rSeries: number[];
  /** Cumulative-R equity curve, one point per trade. */
  equityR: number[];
  checks: Check[];

  /** Edge attribution: which slices of the log carry the result. Empty when the
   * log has no dimensions to segment by. Descriptive, never causal. */
  attribution: DimensionAttribution[];
};

/** One category within a dimension (e.g. the "EUR_USD" bucket of "Symbol"). */
export type SegmentStat = {
  label: string;
  /** Number of trades in this segment. */
  n: number;
  /** Mean R within the segment. */
  expectancyR: number;
  /** 0..1 */
  winRate: number;
  /** Sum of R contributed by this segment (its share of the bottom line). */
  totalR: number;
  /** Share of all trades, 0..1. */
  share: number;
  /** True only when the segment is large enough AND separable from zero. */
  robust: boolean;
  /** "carrier" (robust + positive), "drag" (robust + negative), or "thin". */
  role: "carrier" | "drag" | "thin";
};

/** All segments for one grouping dimension, plus an optional headline insight. */
export type DimensionAttribution = {
  key: string;
  /** Human label, e.g. "Symbol", "Direction", "Day of week". */
  label: string;
  segments: SegmentStat[];
  /** One-line takeaway when a single segment carries most of the result. */
  insight?: string;
};

/** The verdict re-run after charging a per-trade round-trip cost. */
export type CostAdjusted = {
  /** Cost in R charged to every trade, win or lose. */
  costR: number;
  expectancyR: number;
  firstHalfR: number;
  secondHalfR: number;
  signFlip: boolean;
  tStat: number;
  pValue: number;
  verdict: Verdict;
  tone: Tone;
  /** True when the strategy still clears the bar after costs. */
  survives: boolean;
};

/** Round-trip cost presets (in R) offered in the stress test. */
export const COST_PRESETS = [0, 0.05, 0.1, 0.2] as const;

/** Minimum trades before any conclusion is honest. */
export const MIN_SAMPLE = 30;
/** Trades needed for a "healthy" sample. */
export const HEALTHY_SAMPLE = 200;
/** Significance threshold for the two-sided test against zero. */
export const ALPHA = 0.05;
/** Below this many trades, a segment is "thin" and not to be trusted. */
export const SEGMENT_MIN = 20;
/** A dimension must label at least this share of trades to be shown. */
export const SEGMENT_COVERAGE = 0.6;
