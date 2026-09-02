"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {ProductCategory} from "@rad/types";
import { useLocale } from "@/components/i18n";
import { useMaking } from "@/hooks/use-making-workspace";
import { useCommerce } from "@/components/commerce/commerce-provider";
import {
  artworkCategoryById,
  designDirections,
  designPresets,
} from "@/lib/catalog/artwork";
import { composeLivePortrait } from "@/lib/difference";
import { createDesign } from "@/lib/api/design";
import { surprisePermissions, type SurprisePermission } from "@/components/difference";
import type {DesignerStatus} from "@/components/studio/type";

export function useDesigner() {
  const { locale, href } = useLocale();
  const router = useRouter();
  const { submitDesign } = useMaking();
  const { user } = useCommerce();
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [prompt, setPrompt] = useState("");
  const [memory, setMemory] = useState("");
  const [permission, setPermission] = useState<SurprisePermission>("hand");
  const [intendedUse, setIntendedUse] = useState("");
  const [status, setStatus] = useState<DesignerStatus>("idle");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const selectedCategory = category ? artworkCategoryById(category) : null;
  const presets = designPresets[locale];
  const directions = designDirections[locale];
  const livePortrait = useMemo(() => {
    if (status !== "done" || !selectedCategory || !prompt.trim()) return null;
    const described = [prompt.trim(), memory.trim()].filter(Boolean).join(" — ");
    return composeLivePortrait({
      prompt: described,
      category: selectedCategory.id,
      visual: selectedCategory.visual,
      permission,
      color: selectedCategory.preview.color,
      accent: selectedCategory.preview.accent,
    });
  }, [status, selectedCategory, prompt, memory, permission]);

  function chooseCategory(next: ProductCategory) {
    setCategory(next);
    setBrief({});
    setImage("");
    setStatus("idle");
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!category || !prompt.trim() || status === "loading") return;
    setStatus("loading");
    setError("");
    abort.current = new AbortController();
    try {
      const permissionLabel =
        surprisePermissions.find((item) => item.id === permission)?.title[locale] ?? "";
      const data = await createDesign(
        [
          selectedCategory?.label[locale],
          prompt,
          memory,
          ...Object.values(brief).filter(Boolean),
          directions[direction],
          permissionLabel,
        ]
          .filter(Boolean)
          .join("، "),
        abort.current.signal,
      );
      setImage(data.image);
      setStatus("done");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
        setStatus("error");
      } else setStatus("idle");
    }
  }

  function requestMaking() {
    if (!selectedCategory) return;
    const permissionLabel =
      surprisePermissions.find((item) => item.id === permission)?.title[locale] ?? "";
    const created = submitDesign({
      customerName: user?.name || (locale === "fa" ? "مهمان رَد" : "RAD guest"),
      title: {
        fa: prompt.trim().slice(0, 48),
        en: prompt.trim().slice(0, 48),
      },
      brief: {
        concept: [prompt.trim(), memory.trim()].filter(Boolean).join(" — "),
        dimensions: brief.size || (locale === "fa" ? "نامشخص" : "Unspecified"),
        material: [selectedCategory.label[locale], brief.surface, brief.medium, brief.item]
          .filter(Boolean)
          .join(" · "),
        intendedUse: intendedUse.trim() || (locale === "fa" ? "نامشخص" : "Unspecified"),
        budget: brief.budget || (locale === "fa" ? "نامشخص" : "Unspecified"),
        permission: permissionLabel,
        category: selectedCategory.id,
        image,
      },
    });
    router.push(href(`/making/${created.id}`));
  }

  return {
    category,
    prompt,
    setPrompt,
    memory,
    setMemory,
    permission,
    setPermission,
    intendedUse,
    setIntendedUse,
    status,
    image,
    error,
    brief,
    setBrief,
    direction,
    setDirection,
    chooseCategory,
    submit,
    abort: () => abort.current?.abort(),
    presets,
    directions,
    selectedCategory,
    livePortrait,
    requestMaking,
    resetPreview: () => setStatus("idle"),
  };
}
