// The diagnostics layer: turn a verdict into "here is where you leak edge and
// what to change". Descriptive and honest; every claim is quantified on the
// user's own trades, and simulated fixes are flagged as in-sample hypotheses.

export type LeakSeverity = "bad" | "warn" | "info" | "good";

export type Leak = {
  key: string;
  title: string;
  severity: LeakSeverity;
  /** The finding, quantified. */
  detail: string;
  /** The recommended change. */
  fix?: string;
  /** Simulated impact, e.g. "+0.098R -> +0.31R per trade". */
  impact?: string;
};

export type Diagnosis = {
  leaks: Leak[];
  /** True when the log carried rich fields (prices/times/volume), so the UI can
   * nudge bare-log users to upload a full broker report for deeper diagnostics. */
  hasRichData: boolean;
};
