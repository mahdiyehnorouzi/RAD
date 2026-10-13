import { useMemo, useState } from "react";
import { COLLABORATE_STEPS, type CollaborateStep } from "../const";
import type { CollaborateDraft } from "../type";

const MAX_ARTWORK_IMAGES = 5;

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

  const stepIndex = COLLABORATE_STEPS.indexOf(step);
  const reachedIndex = COLLABORATE_STEPS.indexOf(reached);

  const introValid = Boolean(fullName.trim() && contact.trim() && city.trim());
  const artworksValid = artworkImages.length > 0;
  const termsValid = Boolean(categories.length && shippingMethod);

  const canAdvance = useMemo(() => {
    if (step === "intro") return introValid;
    if (step === "artworks") return artworksValid;
    if (step === "terms") return termsValid;
    return true;
  }, [step, introValid, artworksValid, termsValid]);

  const canSubmit = introValid && artworksValid && termsValid;

  function goTo(next: CollaborateStep) {
    const nextIndex = COLLABORATE_STEPS.indexOf(next);
    if (nextIndex > reachedIndex + 1) return;
    setStep(next);
    if (nextIndex > reachedIndex) setReached(next);
  }

  function goNext() {
    const next = COLLABORATE_STEPS[stepIndex + 1];
    if (!next || !canAdvance) return;
    goTo(next);
  }

  function goBack() {
    const prev = COLLABORATE_STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  function toggleCategory(id: string) {
    setCategories((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function addImages(files: string[]) {
    setArtworkImages((current) => [...current, ...files].slice(0, MAX_ARTWORK_IMAGES));
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
    canAdvance,
    canSubmit,
    goTo,
    goNext,
    goBack,
    draft,
  };
}

export type Collaborate = ReturnType<typeof useCollaborate>;
