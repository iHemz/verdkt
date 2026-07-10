"use client";

import { useEffect, useState } from "react";

/**
 * The current origin, resolved after mount so server and first client render
 * agree (avoids hydration mismatches when building absolute URLs).
 */
export function useOrigin(): string {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  return origin;
}
