"use client";

import { useState } from "react";
import { POLICY_SLUGS, type PolicySlug } from "@rad/types";
import {
  policyTitleLabels,
  type HelpQuestion,
  type HelpQuestionInput,
} from "../lib/admin-data";
import { DialogShell, Field } from "./admin-dialog";

type Draft = {
  questionFa: string;
  questionEn: string;
  answerFa: string;
  answerEn: string;
  slug: PolicySlug | "";
  section: string;
};

function toDraft(question: HelpQuestion | null): Draft {
  return {
    questionFa: question?.question.fa ?? "",
    questionEn: question?.question.en ?? "",
    answerFa: question?.answer.fa ?? "",
    answerEn: question?.answer.en ?? "",
    slug: question?.more?.slug ?? "",
    section: question?.more?.section ?? "",
  };
}

export function AdminHelpQuestionDialog({
  question,
  onClose,
  onSave,
}: {
  question: HelpQuestion | null;
  onClose: () => void;
  onSave: (input: HelpQuestionInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => toDraft(question));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saving, setSaving] = useState(false);
  const set = (key: keyof Draft) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setDraft({ ...draft, [key]: event.target.value });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!draft.questionFa.trim()) next.questionFa = "متن فارسی سؤال را بنویسید.";
    if (!draft.questionEn.trim()) next.questionEn = "متن انگلیسی سؤال را بنویسید.";
    if (!draft.answerFa.trim()) next.answerFa = "جواب فارسی را بنویسید.";
    if (!draft.answerEn.trim()) next.answerEn = "جواب انگلیسی را بنویسید.";
    if (draft.section && !/^[a-z0-9-]+$/.test(draft.section.trim()))
      next.section = "فقط حروف انگلیسی کوچک، عدد و خط تیره.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    await onSave({
      question: { fa: draft.questionFa, en: draft.questionEn },
      answer: { fa: draft.answerFa, en: draft.answerEn },
      more: draft.slug
        ? { slug: draft.slug, section: draft.section.trim() || undefined }
        : undefined,
    });
    setSaving(false);
  };

  return (
    <DialogShell
      title={question ? "ویرایش سؤال" : "سؤال تازه"}
      description="سؤال و جواب را به فارسی و انگلیسی بنویسید؛ پیوند به قانون اختیاری است."
      onClose={onClose}
    >
      <form className="editor-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="سؤال (فارسی)" error={errors.questionFa}>
            <input
              value={draft.questionFa}
              onChange={set("questionFa")}
              aria-invalid={Boolean(errors.questionFa)}
            />
          </Field>
          <Field label="سؤال (انگلیسی)" error={errors.questionEn}>
            <input
              dir="ltr"
              value={draft.questionEn}
              onChange={set("questionEn")}
              aria-invalid={Boolean(errors.questionEn)}
            />
          </Field>
          <Field label="جواب (فارسی)" error={errors.answerFa}>
            <textarea
              rows={5}
              value={draft.answerFa}
              onChange={set("answerFa")}
              aria-invalid={Boolean(errors.answerFa)}
            />
          </Field>
          <Field label="جواب (انگلیسی)" error={errors.answerEn}>
            <textarea
              dir="ltr"
              rows={5}
              value={draft.answerEn}
              onChange={set("answerEn")}
              aria-invalid={Boolean(errors.answerEn)}
            />
          </Field>
          <Field label="پیوند «بیشتر بخوانید»">
            <select value={draft.slug} onChange={set("slug")}>
              <option value="">بدون پیوند</option>
              {POLICY_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {policyTitleLabels[slug]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="بخش (اختیاری، مثل window)" error={errors.section}>
            <input
              dir="ltr"
              value={draft.section}
              disabled={!draft.slug}
              onChange={set("section")}
              aria-invalid={Boolean(errors.section)}
            />
          </Field>
        </div>
        <div className="dialog-actions">
          <button className="secondary-action" type="button" onClick={onClose}>
            انصراف
          </button>
          <button className="primary-action" type="submit" disabled={saving}>
            ذخیره
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
