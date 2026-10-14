import type { FlowScreen } from "./flow-screen";

/** The three stages shown in the stepper; several `FlowScreen` values
 * collapse into "idea" or "choices" so sub-steps never get their own
 * stepper entry. */
export type OrderPhase = "idea" | "choices" | "review";

export function phaseFromFlowScreen(screen: FlowScreen): OrderPhase {
  if (screen === "review") return "review";
  if (["choose", "write", "photo", "voice", "more"].includes(screen))
    return "idea";
  return "choices";
}
