"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  shapeTraitLabels,
  type ShapeQuestion,
  type ShapeQuestionInput,
} from "../lib/admin-data";
import { createSingleFlight } from "../lib/admin-mutation";
import { storefrontUrl } from "../lib/storefront-url";
import { AdminAsyncRegion } from "./admin-async-region";
import { ConfirmDialog } from "./admin-dialog";
import { AdminRowActions, movedIds } from "./admin-row-actions";
import { AdminShapeQuestionDialog } from "./admin-shape-question-dialog";

const number = new Intl.NumberFormat("fa-IR");

/** Steps of the storefront “what shape is my RAD?” quiz, in display order. */
export function AdminShapeQuestions({
  questions,
  loading,
  loadError,
  refreshing = false,
  refreshError = false,
  onRetry,
  canWrite,
  onSave,
  onDelete,
  onReorder,
}: {
  questions: ShapeQuestion[];
  loading: boolean;
  loadError: boolean;
  refreshing?: boolean;
  refreshError?: boolean;
  onRetry: () => void;
  canWrite: boolean;
  onSave: (input: ShapeQuestionInput, id?: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (ids: string[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState<ShapeQuestion | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShapeQuestion | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const moveFlight = useRef(createSingleFlight());

  const move = (from: number, to: number) => {
    void moveFlight.current.run(async () => {
      setMoving(true);
      setMoveError("");
      try {
        await onReorder(movedIds(questions, from, to));
      } catch (error) {
        setMoveError(
          error instanceof Error && error.message
            ? error.message
            : "جابه‌جایی سؤال ناموفق بود. ترتیب قبلی سر جایش است.",
        );
      } finally {
        setMoving(false);
      }
    });
  };

  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <h2>پرسش‌های «رَد من چه شکلیه؟»</h2>
          <p>
            سؤال‌های{" "}
            <a
              className="contact-message-reply"
              href={storefrontUrl("/shape")}
              target="_blank"
              rel="noreferrer"
            >
              پرسشنامه‌ی شکل
            </a>
            . پاسخ‌ها با ویژگی‌های ثبت‌شده‌ی هر اثر مقایسه می‌شوند و سه اثر
            نزدیک‌تر پیشنهاد می‌شود.
          </p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={() => setEditing("new")}
          disabled={!canWrite || loading || loadError}
        >
          <Plus />
          سؤال تازه
        </button>
      </div>

      {moveError ? (
        <p className="admin-inline-error" role="alert">
          {moveError}
        </p>
      ) : null}

      <AdminAsyncRegion
        loading={loading}
        loadError={loadError}
        refreshing={refreshing}
        refreshError={refreshError}
        onRetry={onRetry}
        errorMessage="دریافت پرسش‌های شکل ناموفق بود. اتصال اینترنت را بررسی و دوباره تلاش کنید."
        loadingLabel="در حال بارگذاری پرسش‌های شکل…"
        skeleton="list"
      >
        {questions.length ? (
          <ol className="contact-message-list content-list">
            {questions.map((question, index) => (
              <li key={question.id} className="contact-message">
                <header>
                  <div>
                    <strong>
                      {number.format(index + 1)}. {question.prompt.fa}
                    </strong>
                    <small>
                      {shapeTraitLabels[question.trait]} ·{" "}
                      <bdi dir="ltr">{question.prompt.en}</bdi>
                    </small>
                  </div>
                </header>
                <p className="contact-message-body">{question.hint.fa}</p>
                <div className="shape-choice-row">
                  {question.choices.map((choice) => (
                    <figure key={choice.label.en}>
                      <img
                        src={storefrontUrl(choice.photo.src)}
                        alt={choice.photo.alt.fa}
                        loading="lazy"
                      />
                      <figcaption>
                        <strong>{choice.label.fa}</strong>
                        <span>
                          {choice.note.fa} · <bdi dir="ltr">{choice.value}</bdi>
                        </span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
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
            هیچ سؤالی نیست؛ پرسشنامه در فروشگاه پیام «به‌زودی» نشان می‌دهد.
          </p>
        )}
      </AdminAsyncRegion>

      {editing && (
        <AdminShapeQuestionDialog
          question={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            if (await onSave(input, editing === "new" ? undefined : editing.id))
              setEditing(null);
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="حذف این سؤال؟"
          description={`«${deleteTarget.prompt.fa}» از پرسشنامه برداشته می‌شود.`}
          confirmLabel="حذف سؤال"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </section>
  );
}
