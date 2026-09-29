"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Which clauses are unfolded. The first starts open, a `#section` link opens
 * its clause, and printing opens them all so the paper copy is complete.
 */
export function useOpenSections(ids: string[]) {
  const key = ids.join(" ");
  const [open, setOpen] = useState<ReadonlySet<string>>(
    () => new Set(ids.slice(0, 1)),
  );

  const setSection = useCallback((id: string, next: boolean) => {
    setOpen((prev) => {
      if (prev.has(id) === next) return prev;
      const updated = new Set(prev);
      if (next) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  }, []);

  const setAll = useCallback(
    (next: boolean) => setOpen(new Set(next ? key.split(" ") : [])),
    [key],
  );

  useEffect(() => {
    const known = key.split(" ");
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (known.includes(id)) setSection(id, true);
    };
    const openForPrint = () => setOpen(new Set(known));
    fromHash();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener("beforeprint", openForPrint);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener("beforeprint", openForPrint);
    };
  }, [key, setSection]);

  return { open, setSection, setAll, allOpen: open.size === ids.length };
}
