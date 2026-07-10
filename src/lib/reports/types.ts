// A published Verdkt Verified report. We store the computed Analysis, never the
// raw trades, which keeps the "your data stays yours" promise intact.

import type { Analysis } from "@/lib/analysis";

/** How the underlying data was obtained. v1 is submitted-data only. */
export type Disclosure = "submitted-data";

/** The public-facing report (what /r/[id] renders). No secrets. */
export type StoredReport = {
  id: string;
  createdAt: number;
  title: string;
  /** Free-text handle/name the publisher wants shown, e.g. "@yourname". */
  author: string;
  disclosure: Disclosure;
  analysis: Analysis;
};

/** Fields supplied when creating a report (id/createdAt are assigned by the store). */
export type NewReport = {
  title: string;
  author: string;
  disclosure: Disclosure;
  analysis: Analysis;
};

/** Internal record persisted by a store: the public report plus secrets/state. */
export type ReportRecord = StoredReport & {
  /** SHA-256 of the manage token. The raw token is shown to the owner once, never stored. */
  manageTokenHash: string;
  /** Whether the report is paid for. Unpaid drafts are not shown publicly. */
  paid: boolean;
};
