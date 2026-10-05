"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Check,
  ChevronLeft,
  ImagePlus,
  Lightbulb,
  Mic,
  Pencil,
  Plus,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { Designer } from "./hooks";
import { validDimension, validFutureDate } from "./hooks/use-designer";
import type { FlowScreen } from "./type/flow-screen";
import {
  BUDGET_OPTIONS,
  DESIGNER_COLORS,
  FORM_OPTIONS,
  SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  colorLabel,
  optionLabel,
} from "./const";
import { DesignerImages } from "./idea-step/designer-images";
import { OrderVoice } from "./order-voice";
import "./order-flow.css";

export function OrderFlow({
  designer: d,
  onSubmit,
  submitting,
  offline,
  error,
  notices,
}: {
  designer: Designer;
  onSubmit: () => void;
  submitting: boolean;
  offline: boolean;
  error: string;
  notices: ReactNode;
}) {
  const { locale, href, number } = useLocale();
  const fa = locale === "fa";
  const txt = (faText: string, en: string) => (fa ? faText : en);
  const screen = d.flowScreen;
  const setScreen = d.setFlowScreen;
  const [history, setHistory] = useState<FlowScreen[]>([]);
  const [editing, setEditing] = useState(false);
  const [exactOpen, setExact] = useState(false);
  const exact = exactOpen || Boolean(d.length || d.width || d.height);
  const [customColorOpen, setCustomColor] = useState(false);
  const customColor = customColorOpen || Boolean(d.colorNote);
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);
  const go = (next: FlowScreen) => {
    setHistory((h) => [...h, screen]);
    setScreen(next);
  };
  const next = (target: FlowScreen) => {
    if (editing) {
      setEditing(false);
      go("review");
    } else go(target);
  };
  const edit = (target: FlowScreen) => {
    setEditing(true);
    go(target);
  };
  const back = () => {
    const defaults: Partial<Record<FlowScreen, FlowScreen>> = {
      write: "choose",
      photo: "choose",
      voice: "choose",
      more: "choose",
      form: "more",
      size: "form",
      color: "size",
      similarity: "color",
      budget: "color",
      time: "budget",
      review: "time",
    };
    const previous = history.at(-1) ?? defaults[screen];
    if (previous) {
      setHistory((h) => h.slice(0, -1));
      setScreen(previous);
    }
  };
  const hasReference = Boolean(d.uploads.length || d.sketch);
  const phase = ["choose", "write", "photo", "voice", "more"].includes(screen)
    ? 0
    : screen === "review"
      ? 2
      : 1;
  const titles: Record<FlowScreen, string> = {
    choose: txt("چه ایده‌ای داری؟", "What do you have in mind?"),
    write: txt("هر چی تو ذهنته بنویس", "Write what’s on your mind"),
    photo: txt("عکس بفرست", "Send a photo"),
    voice: txt("ایده‌ات رو بگو", "Tell us your idea"),
    more: txt("چیزی دیگه هم هست؟", "Anything else?"),
    form: txt("چی بسازیم؟", "What should we make?"),
    size: txt("حدوداً چه اندازه‌ای باشه؟", "About how big?"),
    color: txt("چه رنگی مد نظرت هست؟", "Which colors do you have in mind?"),
    similarity: txt(
      "چقدر شبیه عکسی باشه که فرستادی؟",
      "How close to your reference?",
    ),
    budget: txt(
      "حدوداً چقدر می‌خوای هزینه کنی؟",
      "What budget do you have in mind?",
    ),
    time: txt("تا کی بهش نیاز داری؟", "When do you need it?"),
    review: txt("ایده‌ی شما", "Your idea"),
  };
  const hints: Partial<Record<FlowScreen, string>> = {
    choose: txt(
      "به هر روشی که راحت‌تری برامون بگو. لازم نیست کامل باشه.",
      "Tell us however you prefer. It doesn’t need to be perfect.",
    ),
    write: txt(
      "می‌تونی ساده بگی، مثل مثال‌ها:",
      "Keep it simple, like these examples:",
    ),
    photo: txt(
      "اگه چیزی شبیه این دیدی، عکس یا اسکرین‌شاتش رو بفرست. حتی طرح دستی هم عالیه.",
      "Send a photo, screenshot, or even a hand-drawn sketch.",
    ),
    voice: txt(
      "لازم نیست کامل باشه. همین که یه توضیح کلی بدی کافیه.",
      "A quick explanation is enough.",
    ),
    more: txt(
      "اگه عکس دیگه‌ای داری، یا می‌خوای بیشتر توضیح بدی، همین‌جا اضافه کن.",
      "Add another photo, a few words, or a voice note.",
    ),
    form: txt(
      "یه دسته‌بندی اولیه رو انتخاب کن.",
      "Choose a starting category.",
    ),
    color: txt("می‌تونی تا سه رنگ انتخاب کنی.", "Choose up to three colors."),
    budget: txt(
      "فقط می‌پرسیم که پیشنهادهای ما به بودجه‌ات بخوره، نگران نباش.",
      "This helps us suggest something within your budget.",
    ),
    review: txt(
      "این خلاصه‌ای از چیزیه که برامون فرستادی.",
      "Here’s what you’ve shared with us.",
    ),
  };
  const cta = (label: string, action: () => void, disabled = false) => (
    <button
      type="button"
      className="order-flow-primary"
      disabled={disabled}
      onClick={action}
    >
      <ArrowLeftRight aria-hidden="true" />
      {label}
    </button>
  );
  const onward = (target: FlowScreen, disabled = false) =>
    cta(txt("ادامه", "Continue"), () => next(target), disabled);
  const rows = (
    name: string,
    options: typeof BUDGET_OPTIONS,
    value: string,
    choose: (id: string) => void,
  ) => (
    <div className="order-flow-rows">
      {options.map((o) => (
        <label key={o.id} className="order-flow-row">
          <input
            type="radio"
            name={name}
            checked={value === o.id}
            onChange={() => choose(o.id)}
          />
          <span>{o.label[locale]}</span>
        </label>
      ))}
    </div>
  );
  const imagePanel = (
    <DesignerImages
      inputRef={input}
      uploads={d.uploads}
      maxImages={d.maxImages}
      error={d.error}
      onError={d.setError}
      onAdd={d.addUploads}
      onRemove={d.removeUpload}
    />
  );
  const validSize = [d.length, d.width, d.height].every(validDimension);
  const validDate = d.timeline !== "date" || validFutureDate(d.needBy);
  return (
    <div className="order-flow" dir={fa ? "rtl" : "ltr"}>
      <header className="order-flow-top">
        {screen === "choose" ? (
          <Link
            href={href("/studio")}
            className="order-flow-back"
            aria-label={txt("بازگشت به استودیو", "Back to studio")}
          >
            <ChevronLeft />
          </Link>
        ) : (
          <button
            type="button"
            className="order-flow-back"
            onClick={back}
            aria-label={txt("بازگشت", "Back")}
          >
            <ChevronLeft />
          </button>
        )}
        <ol
          className="order-flow-phases"
          aria-label={txt("مراحل سفارش", "Order stages")}
        >
          {[Lightbulb, SlidersHorizontal, UserRound].map((Icon, i) => (
            <li
              key={i}
              data-current={phase === i}
              data-done={phase > i}
              aria-current={phase === i ? "step" : undefined}
            >
              <Icon aria-hidden="true" />
              <span>
                {
                  [
                    txt("ایده", "Idea"),
                    txt("انتخاب‌ها", "Choices"),
                    txt("بررسی", "Review"),
                  ][i]
                }
              </span>
            </li>
          ))}
        </ol>
      </header>
      {notices}
      <section className="order-flow-body" aria-labelledby="order-flow-title">
        <h1 ref={heading} id="order-flow-title" tabIndex={-1}>
          {titles[screen]}
        </h1>
        {hints[screen] && <p className="order-flow-hint">{hints[screen]}</p>}
        {screen === "choose" && (
          <>
            <div className="order-flow-methods">
              <button onClick={() => go("write")}>
                <Pencil />
                <b>{txt("بنویس", "Write")}</b>
                <small>
                  {txt("هر چی تو ذهنته", "Whatever is on your mind")}
                </small>
              </button>
              <button onClick={() => go("photo")}>
                <ImagePlus />
                <b>{txt("عکس بفرست", "Send a photo")}</b>
                <small>
                  {txt(
                    "از هر جا یا حتی طرح دستی",
                    "A photo or your own sketch",
                  )}
                </small>
              </button>
              <button
                className="order-flow-voice-tile"
                onClick={() => go("voice")}
              >
                <Mic />
                <b>{txt("بگو", "Say it")}</b>
                <small>{txt("صدا ضبط کن", "Record your voice")}</small>
              </button>
            </div>
            <img className="order-flow-corner" src="/studio/bowl.webp" alt="" />
          </>
        )}
        {screen === "write" && (
          <>
            <div className="order-flow-examples">
              {[
                txt("مثلاً یک ماگ بزرگ", "A big mug, for example"),
                txt("دسته‌اش شبیه دم نهنگ باشه", "With a whale-tail handle"),
                txt("رنگش مات و خاکی باشه", "In a matte earthy color"),
              ].map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    d.setPrompt(
                      [d.prompt, v].filter(Boolean).join(" ").slice(0, 500),
                    )
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            <label className="order-flow-text">
              <span className="sr-only">{titles.write}</span>
              <textarea
                value={d.prompt}
                onChange={(e) => d.setPrompt(e.target.value)}
                maxLength={500}
                placeholder={txt("ایده‌ات رو بنویس…", "Write your idea…")}
              />
              <small>
                {number(d.prompt.length)}/{number(500)}
              </small>
            </label>
            {onward("more", !d.prompt.trim())}
          </>
        )}
        {screen === "photo" && (
          <>
            <button
              className="order-flow-upload"
              onClick={() => input.current?.click()}
            >
              <Plus />
              <span>{txt("عکس انتخاب کن", "Choose a photo")}</span>
            </button>
            {imagePanel}
            <div className="order-flow-reference-examples">
              {[
                FORM_OPTIONS[0].image,
                "/studio/bowl.webp",
                "/studio/sketch.webp",
              ].map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </div>
            <p className="order-flow-note">
              {txt(
                "از پینترست، عکس خودت یا یک طرح دستی…",
                "Pinterest, your own photo, or a hand-drawn sketch…",
              )}
            </p>
            {onward("more", !d.uploads.length)}
          </>
        )}
        {screen === "voice" && (
          <>
            <OrderVoice value={d.voice} onChange={d.setVoice} />
            {onward("more", !d.voice)}
          </>
        )}
        {screen === "more" && (
          <>
            <div className="order-flow-more">
              {[
                [
                  "photo",
                  ImagePlus,
                  txt("عکس دیگه اضافه کن", "Add another photo"),
                ],
                ["write", Pencil, txt("یک توضیح کوتاه بگو", "Add a few words")],
                [
                  "voice",
                  Mic,
                  txt("صدای دیگه‌ای ذخیره کن", "Record a voice note"),
                ],
              ].map(([target, Icon, label]) => {
                const I = Icon as typeof Pencil;
                return (
                  <button
                    key={String(target)}
                    onClick={() => go(target as FlowScreen)}
                  >
                    <I />
                    <span>{String(label)}</span>
                  </button>
                );
              })}
            </div>
            {cta(txt("بریم برای انتخاب‌ها", "Let’s make some choices"), () =>
              next("form"),
            )}
          </>
        )}
        {screen === "form" && (
          <div className="order-flow-forms">
            {["container", "vase", "serving", "light", "accessory", "open"]
              .map((id) => FORM_OPTIONS.find((o) => o.id === id)!)
              .map((o) => (
                <button
                  key={o.id}
                  aria-pressed={d.form === o.id}
                  onClick={() => {
                    d.setForm(o.id);
                    next("size");
                  }}
                >
                  {o.id === "open" ? <Pencil /> : <img src={o.image} alt="" />}
                  <span>{o.label[locale]}</span>
                  {d.form === o.id && <Check className="order-flow-selected" />}
                </button>
              ))}
          </div>
        )}
        {screen === "size" && (
          <>
            <div className="order-flow-sizes">
              {SIZE_OPTIONS.map((o) => (
                <label key={o.id}>
                  <input
                    type="radio"
                    name="flow-size"
                    checked={d.size === o.id}
                    onChange={() => d.setSize(o.id)}
                  />
                  <img
                    src={FORM_OPTIONS[0].image}
                    alt=""
                    style={{ scale: String(o.scale) }}
                  />
                  <b>{o.label[locale]}</b>
                  <small>{o.hint[locale]}</small>
                </label>
              ))}
            </div>
            <label className="order-flow-switch">
              <input
                type="checkbox"
                checked={exact}
                onChange={(e) => {
                  setExact(e.target.checked);
                  if (!e.target.checked) {
                    d.setLength("");
                    d.setWidth("");
                    d.setHeight("");
                  }
                }}
              />
              {txt("من اندازه‌ی دقیق مد نظرم هست", "I have exact dimensions")}
            </label>
            {exact && (
              <div className="order-flow-dimensions">
                {[
                  [txt("طول", "Length"), d.length, d.setLength],
                  [txt("عرض", "Width"), d.width, d.setWidth],
                  [txt("ارتفاع", "Height"), d.height, d.setHeight],
                ].map(([label, value, set]) => (
                  <label key={String(label)}>
                    {String(label)}
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      inputMode="decimal"
                      value={String(value)}
                      placeholder="cm"
                      onChange={(e) =>
                        (set as (s: string) => void)(e.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            )}
            {onward("color", !validSize)}
          </>
        )}
        {screen === "color" && (
          <>
            <div className="order-flow-colors">
              {DESIGNER_COLORS.map((o) => (
                <button
                  key={o.id}
                  aria-pressed={d.colors.includes(o.value)}
                  disabled={!d.colors.includes(o.value) && d.colors.length >= 3}
                  onClick={() => d.toggleColor(o.value)}
                >
                  <span
                    style={{
                      background: "background" in o ? o.background : o.value,
                    }}
                  >
                    {d.colors.includes(o.value) && <Check />}
                  </span>
                  <small>{o.label[locale]}</small>
                </button>
              ))}
            </div>
            <button
              className="order-flow-specific"
              aria-expanded={customColor}
              onClick={() => setCustomColor((v) => !v)}
            >
              <Pencil />
              {txt(
                "من رنگ خاصی مد نظرم هست",
                "I have a specific color in mind",
              )}
            </button>
            {customColor && (
              <input
                className="order-flow-input"
                aria-label={txt("رنگ دلخواه", "Custom color")}
                value={d.colorNote}
                onChange={(e) => d.setColorNote(e.target.value)}
              />
            )}
            {onward(hasReference ? "similarity" : "budget")}
          </>
        )}
        {screen === "similarity" && (
          <>
            <div className="order-flow-reference-examples">
              {[0, 1, 2].map((i) => (
                <img
                  key={i}
                  src={d.uploads[i] ?? d.uploads[0] ?? d.sketch}
                  alt={txt("مرجع شما", "Your reference")}
                />
              ))}
            </div>
            <input
              className="order-flow-range"
              aria-label={titles.similarity}
              type="range"
              min="0"
              max="100"
              step="50"
              value={d.freedom}
              onChange={(e) => d.setFreedom(Number(e.target.value))}
            />
            <div className="order-flow-range-labels">
              <span>{txt("کاملاً شبیه", "Very close")}</span>
              <span>{txt("با کمی تغییر", "Some changes")}</span>
              <span>{txt("فقط الهام بگیریم", "Just inspiration")}</span>
            </div>
            <p className="order-flow-callout">
              {txt(
                "ما فرم کلی و حس طرح رو در نظر می‌گیریم و با توجه به امکان ساخت، پیشنهاد می‌دیم.",
                "We consider the shape and feel, then suggest what can be made by hand.",
              )}
            </p>
            {onward("budget")}
          </>
        )}
        {screen === "budget" && (
          <>
            {rows("flow-budget", BUDGET_OPTIONS, d.budget, (id) => {
              d.setBudget(id);
              next("time");
            })}
          </>
        )}
        {screen === "time" && (
          <>
            {rows("flow-time", TIMELINE_OPTIONS, d.timeline, d.chooseTimeline)}
            {d.timeline === "date" && (
              <label className="order-flow-date">
                {txt("چه تاریخی؟", "Which date?")}
                <input
                  type="date"
                  value={d.needBy}
                  onChange={(e) => d.setNeedBy(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </label>
            )}
            {onward("review", !d.timeline || !validDate)}
          </>
        )}
        {screen === "review" && (
          <>
            <div className="order-flow-moodboard">
              {[...d.uploads, d.sketch].filter(Boolean).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={txt("مرجع ایده", "Idea reference")}
                />
              ))}
              {!hasReference && <Pencil aria-hidden="true" />}
              <button
                onClick={() => edit("more")}
                aria-label={txt("ویرایش ایده", "Edit idea")}
              >
                <Pencil />
              </button>
            </div>
            {d.prompt && <p className="order-flow-brief">{d.prompt}</p>}
            {d.voice && <audio controls src={d.voice} />}
            <div className="order-flow-summary">
              {[
                [
                  txt("چی بسازیم؟", "Object"),
                  optionLabel(FORM_OPTIONS, d.form, locale),
                  "form",
                ],
                [
                  txt("اندازه", "Size"),
                  [
                    optionLabel(SIZE_OPTIONS, d.size, locale),
                    [d.length, d.width, d.height].filter(Boolean).join(" × "),
                  ]
                    .filter(Boolean)
                    .join(" — "),
                  "size",
                ],
                [
                  txt("رنگ", "Color"),
                  [...d.colors.map((v) => colorLabel(v, locale)), d.colorNote]
                    .filter(Boolean)
                    .join("، "),
                  "color",
                ],
                [
                  txt("بودجه", "Budget"),
                  optionLabel(BUDGET_OPTIONS, d.budget, locale),
                  "budget",
                ],
                [
                  txt("زمان", "Time"),
                  d.needBy || optionLabel(TIMELINE_OPTIONS, d.timeline, locale),
                  "time",
                ],
              ].map(([label, value, target]) => (
                <div key={target}>
                  <span>{label}</span>
                  <b>{value || "—"}</b>
                  <button onClick={() => edit(target as FlowScreen)}>
                    <Pencil />
                    {txt("ویرایش", "Edit")}
                  </button>
                </div>
              ))}
            </div>
            <p className="order-flow-callout">
              {txt(
                "ایده‌ات رو بررسی می‌کنیم و قیمت و زمان دقیق رو بهت می‌گیم. تا قبل از تأیید، پرداختی نداری.",
                "We’ll review your idea and confirm price and timing. No payment is due before you approve.",
              )}
            </p>
            <label className="order-flow-consent">
              <input
                type="checkbox"
                checked={d.agreed}
                onChange={(e) => d.setAgreed(e.target.checked)}
              />
              <span>
                {txt("شرایط ", "I accept the ")}
                <Link href={href("/help/custom")} target="_blank">
                  {txt("سفارش اختصاصی", "custom-order terms")}
                </Link>
                {fa ? " را می‌پذیرم." : "."}
              </span>
            </label>
            {error && (
              <p role="alert" className="order-flow-error">
                {error}
              </p>
            )}
            {cta(
              submitting
                ? txt("در حال ارسال…", "Sending…")
                : txt("ارسال ایده", "Send idea"),
              onSubmit,
              !d.canSubmit || submitting || offline,
            )}
          </>
        )}
      </section>
    </div>
  );
}
