"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  policyTitleLabels,
  type HelpQuestion,
  type HelpQuestionInput,
} from "../lib/admin-data";
import { storefrontUrl } from "../lib/storefront-url";
import { ConfirmDialog } from "./admin-dialog";
import { AdminHelpQuestionDialog } from "./admin-help-question-dialog";
import { AdminRowActions, movedIds } from "./admin-row-actions";

const number = new Intl.NumberFormat("fa-IR");

/** The common questions on the storefront help page, in display order. */
export function AdminHelpQuestions({
  questions,
  canWrite,
  onSave,
  onDelete,
  onReorder,
}: {
  questions: HelpQuestion[];
  canWrite: boolean;
  onSave: (input: HelpQuestionInput, id?: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onReorder: (ids: string[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState<HelpQuestion | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HelpQuestion | null>(null);
  const [moving, setMoving] = useState(false);

  const move = async (from: number, to: number) => {
    setMoving(true);
    await onReorder(movedIds(questions, from, to));
    setMoving(false);
  };

  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <h2>پرسش‌های راهنما</h2>
          <p>
            سؤال‌هایی که در صفحه‌ی{" "}
            <a className="contact-message-reply" href={storefrontUrl("/help")} target="_blank" rel="noreferrer">
              راهنمای خرید
            </a>{" "}
            دیده می‌شوند. تغییرها حداکثر یک دقیقه بعد در فروشگاه دیده می‌شوند.
          </p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={() => setEditing("new")}
          disabled={!canWrite}
        >
          <Plus />
          سؤال تازه
        </button>
      </div>

      {questions.length ? (
        <ol className="contact-message-list content-list">
          {questions.map((question, index) => (
            <li key={question.id} className="contact-message">
              <header>
                <div>
                  <strong>
                    {number.format(index + 1)}. {question.question.fa}
                  </strong>
                  <small dir="ltr">{question.question.en}</small>
                </div>
              </header>
              <p className="contact-message-body">{question.answer.fa}</p>
              {question.more ? (
                <small className="content-meta">
                  بیشتر بخوانید: {policyTitleLabels[question.more.slug]}
                  {question.more.section ? (
                    <bdi dir="ltr"> #{question.more.section}</bdi>
                  ) : null}
                </small>
              ) : null}
              {canWrite ? (
                <AdminRowActions
                  label={`سؤال ${number.format(index + 1)}`}
                  index={index}
                  total={questions.length}
                  disabled={moving}
                  onMove={(from, to) => void move(from, to)}
                  onEdit={() => setEditing(question)}
                  onDelete={() => setDeleteTarget(question)}
                />
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="contact-message-empty">
          هنوز سؤالی نیست؛ بخش پرسش‌ها در صفحه‌ی راهنما پنهان می‌ماند.
        </p>
      )}

      {editing && (
        <AdminHelpQuestionDialog
          question={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            if (await onSave(input, editing === "new" ? undefined : editing.id)) setEditing(null);
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="حذف این سؤال؟"
          description={`«${deleteTarget.question.fa}» از صفحه‌ی راهنما برداشته می‌شود.`}
          confirmLabel="حذف سؤال"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (await onDelete(deleteTarget.id)) setDeleteTarget(null);
          }}
        />
      )}
    </section>
  );
}
