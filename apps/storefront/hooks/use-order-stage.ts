export function useOrderStages(orders: Array<{ id: string; createdAt: number }>, stageCount: number) {
  const demoStageDuration = 60_000;
  return Object.fromEntries(orders.map((order) => [order.id, Math.min(stageCount - 1, Math.floor((Date.now() - order.createdAt) / demoStageDuration))]));
}
