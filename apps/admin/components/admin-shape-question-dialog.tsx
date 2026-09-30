"use client";

import { useState } from "react";
import { SHAPE_TRAITS } from "@rad/types";
import {
  shapeTraitLabels,
  type ShapeChoice,
  type ShapeQuestion,
  type ShapeQuestionInput,
} from "../lib/admin-data";
import { storefrontUrl } from "../lib/storefront-url";
import { DialogShell, Field } from "./admin-dialog";

const blankChoice = (value: number): ShapeChoice => ({
  label: { fa: "", en: "" },
  note: { fa: "", en: "" },
  photo: { src: "", alt: { fa: "", en: "" } },
  value,
});

const filled = (text: { fa: string; en: string }) =>
  Boolean(text.fa.trim() && text.en.trim());
const validSrc = (src: string) => /^(\/\S*|https?:\/\/\S+)$/.test(src.trim());

export function AdminShapeQuestionDialog({
  question,
  onClose,
  onSave,
}: {
  question: ShapeQuestion | null;
  onClose: () => void;
  onSave: (input: ShapeQuestionInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ShapeQuestionInput>(() =>
    question
      ? {
          trait: question.trait,
          prompt: question.prompt,
          hint: question.hint,
          choices: question.choices,
        }
      : {
          trait: "crooked",
          prompt: { fa: "", en: "" },
          hint: { fa: "", en: "" },
          choices: [blankChoice(0.2), blankChoice(0.9)],
        },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setChoice = (
    index: 0 | 1,
    change: (choice: ShapeChoice) => ShapeChoice,
  ) => {
    const choices = [...draft.choices] as ShapeQuestionInput["choices"];
    choices[index] = change(choices[index]);
    setDraft({ ...draft, choices });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const complete =
      filled(draft.prompt) &&
      filled(draft.hint) &&
      draft.choices.every(
        (choice) =>
          filled(choice.label) &&
          filled(choice.note) &&
          filled(choice.photo.alt),
      );
    if (!complete) {
      setError("همه‌ی متن‌ها را به فارسی و انگلیسی پر کنید.");
      return;
    }
    if (!draft.choices.every((choice) => validSrc(choice.photo.src))) {
      setError("آدرس هر عکس باید با / (مسیر فروشگاه) یا http شروع شود.");
      return;
    }
    setError("");
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };

  return (
    <DialogShell
      title={question ? "ویرایش سؤال" : "سؤال تازه"}
      description="هر سؤال یک ویژگی را می‌سنجد و دو گزینه دارد؛ عدد هر گزینه (۰ تا ۱) جای آن را روی آن ویژگی مشخص می‌کند."
      onClose={onClose}
    >
      <form className="editor-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="ویژگی">
            <select
              value={draft.trait}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  trait: event.target.value as ShapeQuestionInput["trait"],
                })
              }
            >
              {SHAPE_TRAITS.map((trait) => (
                <option key={trait} value={trait}>
                  {shapeTraitLabels[trait]}
                </option>
              ))}
            </select>
          </Field>
          <span />
          <Field label="سؤال (فارسی)">
            <input
              value={draft.prompt.fa}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  prompt: { ...draft.prompt, fa: event.target.value },
                })
              }
            />
          </Field>
          <Field label="سؤال (انگلیسی)">
            <input
              dir="ltr"
              value={draft.prompt.en}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  prompt: { ...draft.prompt, en: event.target.value },
                })
              }
            />
          </Field>
          <Field label="راهنما (فارسی)">
            <input
              value={draft.hint.fa}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  hint: { ...draft.hint, fa: event.target.value },
                })
              }
            />
          </Field>
          <Field label="راهنما (انگلیسی)">
            <input
              dir="ltr"
              value={draft.hint.en}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  hint: { ...draft.hint, en: event.target.value },
                })
              }
            />
          </Field>
        </div>

        {([0, 1] as const).map((index) => {
          const choice = draft.choices[index];
          return (
            <fieldset key={index} className="shape-choice-editor">
              <legend>گزینه‌ی {index === 0 ? "اول" : "دوم"}</legend>
              <div className="form-grid">
                <Field label="عنوان (فارسی)">
                  <input
                    value={choice.label.fa}
                    onChange={(event) =>
                      setChoice(index, (c) => ({
                        ...c,
                        label: { ...c.label, fa: event.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="عنوان (انگلیسی)">
                  <input
                    dir="ltr"
                    value={choice.label.en}
                    onChange={(event) =>
                      setChoice(index, (c) => ({
                        ...c,
                        label: { ...c.label, en: event.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="توضیح (فارسی)">
                  <input
                    value={choice.note.fa}
                    onChange={(event) =>
                      setChoice(index, (c) => ({
                        ...c,
                        note: { ...c.note, fa: event.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="توضیح (انگلیسی)">
                  <input
                    dir="ltr"
                    value={choice.note.en}
                    onChange={(event) =>
                      setChoice(index, (c) => ({
                        ...c,
                        note: { ...c.note, en: event.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="آدرس عکس (مثل /shape/q1-straight.webp)">
                  <input
                    dir="ltr"
                    value={choice.photo.src}
                    onChange={(event) =>
                      setChoice(index, (c) => ({
                        ...c,
                        photo: { ...c.photo, src: event.target.value },
                      }))
                    }
                  />
                </Field>
                <Field label="عدد روی ویژگی (۰ تا ۱)">
                  <input
                    dir="ltr"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={choice.value}
                    onChange={(event) =>
                      setChoice(index, (c) => ({
                        ...c,
                        value: Math.min(
                          1,
                          Math.max(0, Number(event.target.value) || 0),
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="توضیح عکس (فارسی)">
                  <input
                    value={choice.photo.alt.fa}
                    onChange={(event) =>
                      setChoice(index, (c) => ({
                        ...c,
                        photo: {
                          ...c.photo,
                          alt: { ...c.photo.alt, fa: event.target.value },
                        },
                      }))
                    }
                  />
                </Field>
                <Field label="توضیح عکس (انگلیسی)">
                  <input
                    dir="ltr"
                    value={choice.photo.alt.en}
                    onChange={(event) =>
                      setChoice(index, (c) => ({
                        ...c,
                        photo: {
                          ...c.photo,
                          alt: { ...c.photo.alt, en: event.target.value },
                        },
                      }))
                    }
                  />
                </Field>
              </div>
              {validSrc(choice.photo.src) ? (
                <img
                  className="shape-choice-preview"
                  src={storefrontUrl(choice.photo.src.trim())}
                  alt=""
                />
              ) : null}
            </fieldset>
          );
        })}

        {error && (
          <small className="field-error" role="alert">
            {error}
          </small>
        )}
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
