"use client";

import { useCallback, useState } from "react";

/**
 * Copy-to-clipboard with transient "copied" feedback keyed per target, so one
 * hook can back several copy buttons.
 */
export function useClipboard(resetMs = 1600) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = useCallback(
    async (key: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), resetMs);
      } catch {
        /* clipboard unavailable */
      }
    },
    [resetMs],
  );

  return { copiedKey, copy };
}
