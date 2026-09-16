export type StoredNoticeKind =
  | "favorite"
  | "cart"
  | "welcome"
  | "order"
  | "commission_approved"
  | "commission_declined"
  | "commission_change"
  | "commission_message"
  | "commission_quote"
  | "commission_pre_kiln"
  | "commission_firing"
  | "commission_balance"
  | "commission_shipped";

export type CommissionNoticeKind = Extract<
  StoredNoticeKind,
  | "commission_approved"
  | "commission_declined"
  | "commission_change"
  | "commission_message"
  | "commission_quote"
  | "commission_pre_kiln"
  | "commission_firing"
  | "commission_balance"
  | "commission_shipped"
>;

/** Map a stage transition to a customer-facing notice (if any). */
export function noticeForStageChange(
  previousStage: string | undefined,
  nextStage: string,
): CommissionNoticeKind | null {
  if (!previousStage || previousStage === nextStage) return null;
  switch (nextStage) {
    case "approval_deposit":
      return "commission_quote";
    case "pre_kiln":
      return "commission_pre_kiln";
    case "reveal":
      return "commission_firing";
    case "shipping":
      return "commission_balance";
    case "complete":
      return "commission_shipped";
    default:
      return null;
  }
}
