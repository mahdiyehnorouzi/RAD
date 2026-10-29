export type CommissionDetailTabId =
  "summary" | "files" | "messages" | "history" | "decision";

export type CommissionDetailTab = {
  id: CommissionDetailTabId;
  label: string;
};

const BASE_TABS: CommissionDetailTab[] = [
  { id: "summary", label: "خلاصه" },
  { id: "files", label: "فایل‌ها" },
  { id: "messages", label: "پیام‌ها" },
  { id: "history", label: "تاریخچه مراحل" },
];

const DECISION_TAB: CommissionDetailTab = {
  id: "decision",
  label: "تصمیم",
};

/** Same gate the decision pane already uses — do not widen permissions here. */
export function commissionDecisionTabVisible(input: {
  stage: string;
  nextActor: string;
}) {
  return (
    input.stage === "design_submitted" ||
    (input.stage === "feasibility" && input.nextActor === "artist")
  );
}

export function commissionDetailTabs(input: {
  stage: string;
  nextActor: string;
}): CommissionDetailTab[] {
  if (commissionDecisionTabVisible(input)) {
    return [...BASE_TABS, DECISION_TAB];
  }
  return [...BASE_TABS];
}

export function defaultCommissionDetailTab(input: {
  stage: string;
  nextActor: string;
}): CommissionDetailTabId {
  return commissionDecisionTabVisible(input) ? "decision" : "summary";
}
