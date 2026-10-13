/**
 * Parses a standard `Server-Timing` response header (e.g. `proxy;dur=42.5`)
 * to pull out one metric's duration. Used only to log diagnostics — this
 * combines two independently-measured *durations* (the browser's own
 * performance.now() delta, and this server-reported figure), never a
 * timestamp from one machine compared against another's clock.
 */
export function parseServerTimingDuration(
  headerValue: string | null,
  metric: string,
): number | undefined {
  if (!headerValue) return undefined;
  for (const entry of headerValue.split(",")) {
    const [name, ...params] = entry.split(";").map((part) => part.trim());
    if (name !== metric) continue;
    for (const param of params) {
      const [key, value] = param.split("=");
      if (key?.trim() === "dur" && value) {
        const dur = Number(value.trim());
        if (!Number.isNaN(dur)) return dur;
      }
    }
  }
  return undefined;
}
