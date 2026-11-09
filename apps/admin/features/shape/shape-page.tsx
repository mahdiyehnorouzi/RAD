"use client";

import { useAdminChrome } from "../../components/admin-shell";
import { AdminShapeQuestions } from "./admin-shape-questions";

export function ShapePage() {
  const { workspace, announce } = useAdminChrome();
  const loading =
    !workspace.loadedKeys.has("shapeQuestions") &&
    !workspace.loadErrors.has("shapeQuestions");
  return (
    <AdminShapeQuestions
      questions={workspace.shapeQuestions}
      loading={loading}
      loadError={workspace.loadErrors.has("shapeQuestions")}
      refreshing={workspace.refreshingKeys.has("shapeQuestions")}
      refreshError={workspace.refreshErrors.has("shapeQuestions")}
      onRetry={() => {
        void workspace.retryResource("shapeQuestions");
      }}
      canWrite={workspace.can("content.write")}
      onSave={async (input, id) => {
        await workspace.saveShapeQuestion(input, id);
        announce(id ? "سؤال ذخیره شد." : "سؤال تازه به پرسشنامه اضافه شد.");
        return true;
      }}
      onDelete={async (id) => {
        await workspace.deleteShapeQuestion(id);
        announce("سؤال از پرسشنامه حذف شد.");
      }}
      onReorder={async (ids) => {
        await workspace.reorderShapeQuestions(ids);
      }}
    />
  );
}
