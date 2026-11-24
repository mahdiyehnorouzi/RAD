import { useEffect, useState } from "react";

/**
 * Reflects `value` only after it has stopped changing for `delayMs`. Used
 * to keep a fast-typing search box from firing a request per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
