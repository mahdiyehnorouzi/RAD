"use client";

import { useLocale } from "@/components/i18n";

const fieldClass =
  "mt-2 min-h-[180px] w-full resize-none border-0 border-b border-rad-paper/40 bg-transparent px-0 py-2 text-rad-paper outline-none disabled:cursor-not-allowed disabled:opacity-55";

export function DesignerPromptFields({
  category,
  prompt,
  setPrompt,
  memory,
  setMemory,
}: {
  category: string;
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  memory: string;
  setMemory: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { t } = useLocale();
  return (
    <>
      <label htmlFor="artwork-prompt">{t("promptLabel")}</label>
      <textarea
        id="artwork-prompt"
        className={fieldClass}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder={category ? t("promptPlaceholder") : t("promptChooseCategory")}
        aria-describedby="prompt-help"
        disabled={!category}
      />
      <small id="prompt-help" className="mt-2 block text-rad-paper/70">
        {t("promptHelp")}
      </small>

      <label className="mt-8 block" htmlFor="artwork-memory">
        {t("memoryLabel")}
      </label>
      <textarea
        id="artwork-memory"
        className={`${fieldClass} min-h-[110px]`}
        value={memory}
        onChange={(event) => setMemory(event.target.value)}
        placeholder={t("memoryPlaceholder")}
        aria-describedby="memory-help"
        disabled={!category}
      />
      <small id="memory-help" className="mt-2 block text-rad-paper/70">
        {t("memoryHelp")}
      </small>
    </>
  );
}
