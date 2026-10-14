import { useMemo, useState } from "react";
import { normalizeIranMobile } from "@/lib/collaboration/contact";
import { COLLABORATE_STEPS, type CollaborateStep } from "../const";
import type { CollaborateDraft } from "../type";

const MAX_ARTWORK_IMAGES = 5;

type TouchedField =
  | "fullName"
  | "contact"
  | "city"
  | "artworks"
  | "categories"
  | "shippingMethod"
  | "availability";

export function useCollaborate() {
  const [step, setStep] = useState<CollaborateStep>("intro");
  const [reached, setReached] = useState<CollaborateStep>("intro");
  const [fullName, setFullName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [instagram, setInstagram] = useState("");
  const [artworkImages, setArtworkImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");
  const [about, setAbout] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [shippingMethod, setShippingMethod] = useState("");
  const [availability, setAvailability] = useState("");
  const [touched, setTouched] = useState<
    Partial<Record<TouchedField, boolean>>
  >({});
  const [editing, setEditing] = useState(false);

  const stepIndex = COLLABORATE_STEPS.indexOf(step);
  const reachedIndex = COLLABORATE_STEPS.indexOf(reached);

  const contactNormalized = useMemo(
    () => normalizeIranMobile(contact),
    [contact],
  );
  const isContactValid = Boolean(contactNormalized);

  const introValid = Boolean(fullName.trim() && isContactValid && city.trim());
  const artworksValid = artworkImages.length > 0;
  const termsValid = Boolean(
    categories.length && shippingMethod && availability,
  );

  const canAdvance = useMemo(() => {
    if (step === "intro") return introValid;
    if (step === "artworks") return artworksValid;
    if (step === "terms") return termsValid;
    return true;
  }, [step, introValid, artworksValid, termsValid]);

  const canSubmit = introValid && artworksValid && termsValid;

  function touch(...fields: TouchedField[]) {
    setTouched((current) => {
      const next = { ...current };
      for (const field of fields) next[field] = true;
      return next;
    });
  }

  const errors = {
    fullName: touched.fullName && !fullName.trim() ? "required" : undefined,
    contact: touched.contact
      ? !contact.trim()
        ? "empty"
        : !isContactValid
          ? "invalid"
          : undefined
      : undefined,
    city: touched.city && !city.trim() ? "required" : undefined,
    artworks: touched.artworks && !artworksValid ? "required" : undefined,
    categories:
      touched.categories && !categories.length ? "required" : undefined,
    shippingMethod:
      touched.shippingMethod && !shippingMethod ? "required" : undefined,
    availability:
      touched.availability && !availability ? "required" : undefined,
  } as const;

  function goTo(next: CollaborateStep) {
    const nextIndex = COLLABORATE_STEPS.indexOf(next);
    if (nextIndex > reachedIndex + 1) return;
    setStep(next);
    if (nextIndex > reachedIndex) setReached(next);
  }

  function goNext() {
    if (step === "intro") touch("fullName", "contact", "city");
    if (step === "artworks") touch("artworks");
    if (step === "terms") touch("categories", "shippingMethod", "availability");
    if (!canAdvance) return;
    if (editing) {
      setEditing(false);
      goTo("review");
      return;
    }
    const next = COLLABORATE_STEPS[stepIndex + 1];
    if (next) goTo(next);
  }

  function goBack() {
    const prev = COLLABORATE_STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  /** Jump to a step from the review screen; the next "continue" returns here instead of advancing. */
  function edit(target: CollaborateStep) {
    setEditing(true);
    goTo(target);
  }

  function toggleCategory(id: string) {
    setCategories((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function addImages(files: string[]) {
    setArtworkImages((current) =>
      [...current, ...files].slice(0, MAX_ARTWORK_IMAGES),
    );
  }

  function removeImage(index: number) {
    setArtworkImages((current) => current.filter((_, item) => item !== index));
  }

  const draft: CollaborateDraft = {
    step,
    fullName,
    artistName,
    contact,
    city,
    instagram,
    artworkImages,
    about,
    categories,
    shippingMethod,
    availability,
  };

  return {
    step,
    setStep,
    reachedIndex,
    stepIndex,
    maxImages: MAX_ARTWORK_IMAGES,
    fullName,
    setFullName,
    artistName,
    setArtistName,
    contact,
    setContact,
    contactNormalized,
    isContactValid,
    city,
    setCity,
    instagram,
    setInstagram,
    artworkImages,
    addImages,
    removeImage,
    imageError,
    setImageError,
    about,
    setAbout,
    categories,
    toggleCategory,
    shippingMethod,
    setShippingMethod,
    availability,
    setAvailability,
    touched,
    touch,
    errors,
    canAdvance,
    canSubmit,
    goTo,
    goNext,
    goBack,
    edit,
    draft,
  };
}
