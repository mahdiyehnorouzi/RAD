"use client";

import { useAdminChrome } from "../../components/admin-shell";
import { AdminHelpQuestions } from "./admin-help-questions";

export function HelpPage() {
  const { workspace, announce } = useAdminChrome();
  const loading =
    !workspace.loadedKeys.has("helpQuestions") &&
    !workspace.loadErrors.has("helpQuestions");
  return (
    <AdminHelpQuestions
      questions={workspace.helpQuestions}
      loading={loading}
      loadError={workspace.loadErrors.has("helpQuestions")}
      refreshing={workspace.refreshingKeys.has("helpQuestions")}
      refreshError={workspace.refreshErrors.has("helpQuestions")}
      onRetry={() => {
        void workspace.retryResource("helpQuestions");
      }}
      canWrite={workspace.can("content.write")}
      onSave={async (input, id) => {
        await workspace.saveHelpQuestion(input, id);
        announce(
          id ? "سؤال ذخیره شد." : "سؤال تازه به صفحه‌ی راهنما اضافه شد.",
        );
        return true;
      }}
      onDelete={async (id) => {
        await workspace.deleteHelpQuestion(id);
        announce("سؤال از صفحه‌ی راهنما حذف شد.");
      }}
      onReorder={async (ids) => {
        await workspace.reorderHelpQuestions(ids);
      }}
    />
  );
}
