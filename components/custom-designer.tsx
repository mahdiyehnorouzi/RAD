"use client";
import { FormEvent, useRef, useState } from "react";
import { Vessel } from "./site";
import { useLocale } from "./i18n";

export function CustomDesigner() {
  const { t, locale } = useLocale();
  const presets = [t("preset1"), t("preset2"), t("preset3"), t("preset4")];
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [brief, setBrief] = useState({
    use: "",
    form: "",
    size: "",
    surface: "",
    budget: "",
  });
  const [direction, setDirection] = useState(0);
  const abort = useRef<AbortController | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || status === "loading") return;
    setStatus("loading");
    setError("");
    abort.current = new AbortController();
    try {
      const response = await fetch("/api/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${prompt}. ${Object.values(brief).filter(Boolean).join(", ")}. Concept direction ${direction + 1}`,
        }),
        signal: abort.current.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("designError"));
      setImage(data.image);
      setStatus("done");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
        setStatus("error");
      } else setStatus("idle");
    }
  }

  return (
    <div className="designer-grid">
      <form className="designer-form" onSubmit={submit} noValidate>
        <span className="eyebrow">{t("designerEyebrow")}</span>
        <h1>{locale === "fa" ? "چیزی را که هنوز وجود ندارد، تصور کن." : "Imagine what does not exist yet."}</h1>
        <p>{locale === "fa" ? "رَد کمک می‌کند آن را ببینی و بسازی." : "RAD helps you see it and make it."}</p>
        <fieldset className="brief-fields">
          <legend>{locale === "fa" ? "مشخصات اولیه" : "Starting brief"}</legend>
          {[
            [
              "use",
              locale === "fa" ? "کاربرد" : "Use",
              locale === "fa"
                ? ["گلدان", "ظرف", "آبجکت هنری"]
                : ["Vase", "Tableware", "Art object"],
            ],
            [
              "form",
              locale === "fa" ? "فرم" : "Form",
              locale === "fa"
                ? ["کشیده", "پهن", "نامتقارن"]
                : ["Tall", "Wide", "Asymmetric"],
            ],
            [
              "size",
              locale === "fa" ? "ابعاد" : "Scale",
              locale === "fa"
                ? ["کوچک", "متوسط", "بزرگ"]
                : ["Small", "Medium", "Large"],
            ],
            [
              "surface",
              locale === "fa" ? "سطح" : "Surface",
              locale === "fa"
                ? ["خام", "مات", "براق"]
                : ["Raw", "Matte", "Glossy"],
            ],
            [
              "budget",
              locale === "fa" ? "بازه بودجه" : "Budget",
              locale === "fa"
                ? ["تا ۱۰ میلیون", "۱۰ تا ۲۰ میلیون", "بیش از ۲۰ میلیون"]
                : ["Up to $120", "$120–$240", "$240+"],
            ],
          ].map(([key, label, options]) => (
            <label key={key as string}>
              <span>{label as string}</span>
              <select
                value={brief[key as keyof typeof brief]}
                onChange={(event) =>
                  setBrief((current) => ({
                    ...current,
                    [key as string]: event.target.value,
                  }))
                }
              >
                <option value="">
                  {locale === "fa" ? "انتخاب کنید" : "Choose"}
                </option>
                {(options as string[]).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
        <label htmlFor="ceramic-prompt">{t("promptLabel")}</label>
        <textarea
          id="ceramic-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("promptPlaceholder")}
          aria-describedby="prompt-help"
        />
        <small id="prompt-help">{t("promptHelp")}</small>
        <div className="preset-row" aria-label={locale === "fa" ? "واژه‌های پیشنهادی" : "Suggested words"}>
          {presets.map((x) => (
            <button
              type="button"
              key={x}
              onClick={() =>
                setPrompt(
                  (p) => `${p}${p ? (locale === "fa" ? "، " : ", ") : ""}${x}`,
                )
              }
            >
              {x}
            </button>
          ))}
        </div>
        <div
          className="concept-directions"
          aria-label={locale === "fa" ? "جهت طراحی" : "Design direction"}
        >
          {[
            locale === "fa" ? "آرام و متعادل" : "Quiet balance",
            locale === "fa" ? "خام و نامتقارن" : "Raw asymmetry",
            locale === "fa" ? "پیکره‌وار و جسور" : "Sculptural statement",
          ].map((label, index) => (
            <button
              type="button"
              key={label}
              className={direction === index ? "active" : ""}
              onClick={() => setDirection(index)}
              aria-pressed={direction === index}
            >
              <small>0{index + 1}</small>
              <span>{label}</span>
            </button>
          ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          {status === "loading" ? (
            <button
              type="button"
              className="button danger"
              onClick={() => abort.current?.abort()}
            >
              {t("stopGeneration")}
            </button>
          ) : (
            <button className="button" disabled={!prompt.trim()}>
              {locale === "fa" ? "تصورش کن →" : "Imagine it →"}
            </button>
          )}
        </div>
      </form>
      <section className={`designer-preview ${status}`} aria-live="polite">
        {image ? (
          <img src={image} alt={t("generatedAlt")} />
        ) : (
          <>
            <div className="preview-orbit" />
            <Vessel
              product={{ color: "#4a5039", accent: "#ead9bd", shape: "tall" }}
            />
            <p>{status === "loading" ? t("generating") : t("preview")}</p>
          </>
        )}
        {status === "done" && (
          <div className="preview-actions">
            <button className="button light" onClick={() => setStatus("idle")}>
              {t("anotherVersion")}
            </button>
            <a
              className="button"
              href="mailto:studio@rad.ir?subject=Custom ceramic"
            >
              {t("talkArtist")}
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
