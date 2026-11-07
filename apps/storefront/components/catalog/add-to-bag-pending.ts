/** Whether the add mutation should look/behave as in-flight (opt-in shared pending). */
export function addToBagShowsPending(
  sharedPending: boolean | undefined,
  localPending: boolean,
): boolean {
  return (sharedPending ?? false) || localPending;
}
