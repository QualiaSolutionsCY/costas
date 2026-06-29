"use client";

import { useEffect, useState } from "react";

/**
 * Simulates the async initial fetch the real Supabase reads will perform in
 * Phase 2. Returns `true` while "loading", then flips to `false`.
 *
 * This is the seam: when the DB reads land, swap the timeout for the real
 * query's pending state — the skeleton UI that consumes this stays identical,
 * so the loading experience built here carries straight into the real app.
 */
export function useInitialLoad(ms = 650) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return loading;
}
