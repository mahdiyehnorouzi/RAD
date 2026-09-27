import { useEffect, useState } from "react";

/** Milliseconds left until `deadline` (epoch ms), ticking every second. */
export function useCountdown(deadline?: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  return deadline ? Math.max(0, deadline - now) : null;
}
