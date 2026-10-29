/**
 * Distinguishes "not loaded yet" from "loaded and empty" and from a failed
 * fetch, including a later refresh that must not wipe data already on screen.
 * The admin workspace hook commits server payloads only when `settle` returns
 * "applied", so an older response cannot overwrite a newer one.
 */
export type ResourceStatus = {
  loaded: boolean;
  /** Nothing committed yet, and the last attempt did not fail. */
  initialLoading: boolean;
  /** A later fetch is in flight. Committed data stays put. */
  refreshing: boolean;
  /** The first fetch failed. There is nothing to show. */
  loadError: boolean;
  /** A refresh failed. Committed data is unchanged. */
  refreshError: boolean;
};

type Slot = {
  loaded: boolean;
  loadError: boolean;
  refreshError: boolean;
  generation: number;
  inflight: boolean;
};

export class ResourceGate<K extends string> {
  private slots = new Map<K, Slot>();

  private slot(key: K): Slot {
    let slot = this.slots.get(key);
    if (!slot) {
      slot = {
        loaded: false,
        loadError: false,
        refreshError: false,
        generation: 0,
        inflight: false,
      };
      this.slots.set(key, slot);
    }
    return slot;
  }

  /**
   * Start a fetch. Initial loads dedupe while one is already in flight or
   * the resource is already committed. A refresh is ignored until something
   * has been committed, and it supersedes an older refresh.
   * Returns the generation the caller must pass back to `settle`, or null
   * when no request should be sent.
   */
  begin(key: K, mode: "initial" | "refresh"): number | null {
    const slot = this.slot(key);
    if (mode === "initial") {
      if (slot.loaded || slot.inflight) return null;
    } else if (!slot.loaded) {
      return null;
    }
    slot.generation += 1;
    slot.inflight = true;
    return slot.generation;
  }

  /**
   * Finish the fetch started with `generation`. A generation that is no
   * longer the latest one is stale: nothing is committed and the in-flight
   * flag of the newer request is left alone.
   */
  settle(key: K, generation: number, ok: boolean): "applied" | "stale" {
    const slot = this.slots.get(key);
    if (!slot || generation !== slot.generation) return "stale";
    slot.inflight = false;
    if (ok) {
      slot.loaded = true;
      slot.loadError = false;
      slot.refreshError = false;
    } else if (slot.loaded) {
      slot.refreshError = true;
    } else {
      slot.loadError = true;
    }
    return "applied";
  }

  status(key: K): ResourceStatus {
    const slot = this.slots.get(key);
    const loaded = slot?.loaded ?? false;
    const loadError = slot?.loadError ?? false;
    const inflight = slot?.inflight ?? false;
    return {
      loaded,
      initialLoading: !loaded && !loadError,
      refreshing: inflight && loaded,
      loadError,
      refreshError: Boolean(slot?.refreshError && loaded),
    };
  }

  /** Drops every slot so an in-flight settle from a signed-out session is stale. */
  reset() {
    this.slots.clear();
  }
}

/** What a list should render. Empty is only reachable after a successful load. */
export function resourceListPhase(
  status: ResourceStatus,
  count: number,
): "loading" | "error" | "empty" | "ready" {
  if (status.loadError) return "error";
  if (!status.loaded) return "loading";
  if (count === 0) return "empty";
  return "ready";
}
