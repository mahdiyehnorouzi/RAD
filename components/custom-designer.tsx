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
        body: JSON.stringify({ prompt }),
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
        <h1>
          {t("designerTitle1")}
          <br />
          {t("designerTitle2")}
        </h1>
        <p>{t("designerBody")}</p>
        <label htmlFor="ceramic-prompt">{t("promptLabel")}</label>
        <textarea
          id="ceramic-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("promptPlaceholder")}
          aria-describedby="prompt-help"
        />
        <small id="prompt-help">{t("promptHelp")}</small>
        <div className="preset-row">
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
              {t("generate")} <span>✦</span>
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
