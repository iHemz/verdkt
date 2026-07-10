// The request level: one function per endpoint. Knows the URL and the payload
// shape; delegates transport to the api client. Query/mutation hooks call these.

import { apiDelete, apiPost } from "@/lib/api/client";
import type { Trade } from "@/lib/analysis";

export type PublishInput = {
  title: string;
  author: string;
  trades: Trade[];
};

export type PublishResponse = {
  mode: "free" | "checkout";
  id: string;
  manageToken: string;
  /** Present in free mode. */
  url?: string;
  /** Present in checkout mode; redirect the browser here. */
  checkoutUrl?: string;
};

export function publishReport(input: PublishInput): Promise<PublishResponse> {
  return apiPost<PublishResponse>("/api/publish", input);
}

export function unpublishReport(id: string, manageToken: string): Promise<{ removed: boolean }> {
  return apiDelete<{ removed: boolean }>(
    `/api/reports/${id}?t=${encodeURIComponent(manageToken)}`,
  );
}
