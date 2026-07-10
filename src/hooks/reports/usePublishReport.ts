"use client";

import { useMutation } from "@tanstack/react-query";
import { publishReport } from "@/requests/reports";

/** Mutation for publishing a verdict as a Verdkt Verified report. */
export function usePublishReport() {
  return useMutation({ mutationFn: publishReport });
}
