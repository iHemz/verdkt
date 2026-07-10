"use client";

import { useMutation } from "@tanstack/react-query";
import { unpublishReport } from "@/requests/reports";

/** Mutation for unpublishing a report, given its manage token. */
export function useUnpublishReport() {
  return useMutation({
    mutationFn: ({ id, manageToken }: { id: string; manageToken: string }) =>
      unpublishReport(id, manageToken),
  });
}
