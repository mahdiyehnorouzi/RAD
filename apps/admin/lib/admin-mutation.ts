export type FlightResult<T> =
  { status: "ran"; value: T } | { status: "ignored" };

/**
 * Runs one async action at a time. A second call while the first is still
 * going is ignored — it is not queued and not retried. After the first
 * settles (success or failure) a later call may run again.
 */
export function createSingleFlight() {
  let pending = false;
  return {
    get pending() {
      return pending;
    },
    async run<T>(task: () => Promise<T>): Promise<FlightResult<T>> {
      if (pending) return { status: "ignored" };
      pending = true;
      try {
        return { status: "ran", value: await task() };
      } finally {
        pending = false;
      }
    },
  };
}
