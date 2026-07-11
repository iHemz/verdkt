"use client";

import { useMutation } from "@tanstack/react-query";
import { requestDeepDiagnosis } from "@/requests/diagnose";
import type { Trade } from "@/lib/analysis";

/** Mutation for the market-data + AI deep diagnosis. */
export function useDeepDiagnosis() {
  return useMutation({ mutationFn: (trades: Trade[]) => requestDeepDiagnosis(trades) });
}
