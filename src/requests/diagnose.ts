// The request level for the deep diagnosis (Tier B market what-ifs + Tier C AI note).

import { apiPost } from "@/lib/api/client";
import type { Trade } from "@/lib/analysis";
import type { Leak } from "@/lib/diagnostics";

export type DeepDiagnosisResponse = {
  marketLeaks: Leak[];
  narrative: string | null;
  coverage: { matched: number; eligible: number; tooLarge: boolean };
  aiEnabled: boolean;
};

export function requestDeepDiagnosis(trades: Trade[]): Promise<DeepDiagnosisResponse> {
  return apiPost<DeepDiagnosisResponse>("/api/diagnose", { trades });
}
