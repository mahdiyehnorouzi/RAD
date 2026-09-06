import { useMemo, useRef, useState } from "react";
import type { ProductCategory } from "@rad/types";
import { artworkCategoryById } from "@/lib/catalog/artwork";
import { DESIGNER_STEPS, type DesignerStep } from "../const";

const maxImages = 4;

export function useDesigner() {
  const [step, setStep] = useState<DesignerStep>("type");
  const [reached, setReached] = useState<DesignerStep>("type");
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [prompt, setPrompt] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [image, setImage] = useState("");
  const [uploads, setUploads] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const selectedCategory = category ? artworkCategoryById(category) : null;
  const stepIndex = DESIGNER_STEPS.indexOf(step);
  const reachedIndex = DESIGNER_STEPS.indexOf(reached);

  const canAdvance = useMemo(() => {
    if (step === "type") return Boolean(category);
    if (step === "details") {
      return Boolean(
        selectedCategory?.fields.every((field) => brief[field.key]),
      );
    }
    if (step === "idea") return Boolean(prompt.trim());
    if (step === "images") return true;
    return Boolean(intendedUse.trim());
  }, [brief, category, intendedUse, prompt, selectedCategory, step]);

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
    setUploads([]);
    setStatus("idle");
    setError("");
    setReached("type");
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
    direction,
    error,
    goBack,
    goNext,
    goTo,
    image,
    intendedUse,
    maxImages,
    prompt,
    reached,
    reachedIndex,
    removeUpload,
    selectedCategory,
    setBrief,
    setDirection,
    setError,
    setImage,
    setIntendedUse,
    setPrompt,
    setStatus,
    status,
    step,
    stepIndex,
    uploads,
  };
}
