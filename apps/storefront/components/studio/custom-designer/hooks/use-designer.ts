import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductCategory } from "@rad/types";
import { artworkCategoryById } from "@/lib/catalog/artwork";
import { DESIGNER_STEPS, MAX_DESIGNER_COLORS, type DesignerStep } from "../const";

const maxImages = 4;

export function freedomToPermission(value: number) {
  if (value <= 33) return "faithful";
  if (value <= 66) return "hand";
  return "material";
}

export function useDesigner() {
  const [step, setStep] = useState<DesignerStep>("spark");
  const [reached, setReached] = useState<DesignerStep>("spark");
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [prompt, setPrompt] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [image, setImage] = useState("");
  const [uploads, setUploads] = useState<string[]>([]);
  const [sketch, setSketch] = useState("");
  const [hasVoice, setHasVoice] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [feeling, setFeeling] = useState("");
  const [freedom, setFreedom] = useState(70);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [ideaNumber, setIdeaNumber] = useState(24);
  useEffect(() => {
    setIdeaNumber(18 + Math.floor(Math.random() * 40));
  }, []);
  const abort = useRef<AbortController | null>(null);
  const selectedCategory = category ? artworkCategoryById(category) : null;
  const stepIndex = DESIGNER_STEPS.indexOf(step);
  const reachedIndex = DESIGNER_STEPS.indexOf(reached);
  const hasSpark = Boolean(
    prompt.trim() || uploads.length || sketch || hasVoice || colors.length || feeling,
  );

  const canAdvance = useMemo(() => {
    if (step === "spark") return hasSpark;
    if (step === "type") return Boolean(category);
    if (step === "freedom") return true;
    return Boolean(intendedUse.trim());
  }, [category, hasSpark, intendedUse, step]);

  function goTo(next: DesignerStep) {
    const nextIndex = DESIGNER_STEPS.indexOf(next);
    if (nextIndex > reachedIndex + 1) return;
    setStep(next);
    if (nextIndex > reachedIndex) setReached(next);
  }

  function goNext() {
    const next = DESIGNER_STEPS[stepIndex + 1];
    if (!next || !canAdvance) return;
    goTo(next);
  }

  function goBack() {
    const prev = DESIGNER_STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  function chooseCategory(next: ProductCategory) {
    setCategory(next);
    setBrief({});
    setImage("");
  }

  function toggleColor(value: string) {
    setColors((current) => {
      if (current.includes(value)) return current.filter((item) => item !== value);
      if (current.length >= MAX_DESIGNER_COLORS) return current;
      return [...current, value];
    });
  }

  function addUploads(files: string[]) {
    setUploads((current) => [...current, ...files].slice(0, maxImages));
  }

  function removeUpload(index: number) {
    setUploads((current) => current.filter((_, item) => item !== index));
  }

  return {
    abort,
    addUploads,
    brief,
    canAdvance,
    category,
    chooseCategory,
    colors,
    error,
    feeling,
    freedom,
    goBack,
    goNext,
    goTo,
    hasSpark,
    hasVoice,
    ideaNumber,
    image,
    intendedUse,
    maxImages,
    prompt,
    reached,
    reachedIndex,
    removeUpload,
    selectedCategory,
    setBrief,
    setError,
    setFeeling,
    setFreedom,
    setHasVoice,
    setImage,
    setIntendedUse,
    setPrompt,
    setSketch,
    sketch,
    step,
    stepIndex,
    toggleColor,
    uploads,
  };
}
