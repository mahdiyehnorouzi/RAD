"use client";

import type {FormEvent} from "react";
import type {ProductCategory} from "@rad/types";
import { Button } from "@/components/ui/button-link";
import { Eyebrow } from "@/components/ui/section";
import { useLocale } from "@/components/i18n";
import type { SurprisePermission } from "@/components/difference";
import { DesignerBriefFields } from "./designer-brief-fields";
import { DesignerCategoryField } from "./designer-category-field";
import { DesignerDirection, DesignerPresets } from "./designer-presets";
import { DesignerPromptFields } from "./designer-prompt-fields";
import { DesignerSurprise } from "./designer-surprise";
import type { DesignerStatus } from "@/components/studio/type";

export function DesignerForm({
  category,
  prompt,
  setPrompt,
  memory,
  setMemory,
  permission,
  setPermission,
  status,
  error,
  brief,
  setBrief,
  direction,
  setDirection,
  chooseCategory,
  submit,
  abort,
  presets,
  directions,
}: {
  category: ProductCategory | "";
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  memory: string;
  setMemory: React.Dispatch<React.SetStateAction<string>>;
  permission: SurprisePermission;
  setPermission: (value: SurprisePermission) => void;
  status: DesignerStatus;
  error: string;
  brief: Record<string, string>;
  setBrief: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  direction: number;
  setDirection: (value: number) => void;
  chooseCategory: (next: ProductCategory) => void;
  submit: (event: FormEvent) => void;
  abort: () => void;
  presets: string[];
  directions: string[];
}) {
  const { t } = useLocale();
  return (
    <form className="bg-rad-moss p-6 text-rad-paper md:p-10" onSubmit={submit} noValidate>
      <Eyebrow className="text-rad-sand">{t("designerEyebrow")}</Eyebrow>
      <h1 className="m-0 text-designer font-normal">{t("studioImagineTitle")}</h1>
      <p className="mt-4 max-w-xl text-prose">{t("designerConnect")}</p>
      <DesignerCategoryField category={category} onChoose={chooseCategory} />
      <DesignerBriefFields category={category} brief={brief} setBrief={setBrief} />
      <DesignerPromptFields
        category={category}
        prompt={prompt}
        setPrompt={setPrompt}
        memory={memory}
        setMemory={setMemory}
      />
      <DesignerSurprise permission={permission} setPermission={setPermission} />
      <DesignerPresets category={category} presets={presets} setPrompt={setPrompt} />
      <DesignerDirection
        directions={directions}
        direction={direction}
        setDirection={setDirection}
      />
      {error ? (
        <p className="text-rad-sand" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-6">
        {status === "loading" ? (
          <Button type="button" variant="danger" onClick={abort}>
            {t("stopGeneration")}
          </Button>
        ) : (
          <Button type="submit" disabled={!category || !prompt.trim()}>
            {t("imagineIt")}
          </Button>
        )}
      </div>
    </form>
  );
}
