"use client";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Image as ImageIcon,
  ImagePlus,
  Package,
  PackageCheck,
  Pencil,
  SlidersHorizontal,
  Tag,
  Trash2,
} from "lucide-react";
import { Button } from "@rad/ui";
import { api } from "../../lib/api";
import {
  isVideoStorage,
  productStatusLabel,
  productStatusLabels,
  productStatusOptions,
  PRODUCT_CATEGORY_LABELS,
  type AdminProduct,
  type AdminRemoteMediaStorage,
  type ProductAttribute,
  type ProductAttributeValue,
} from "../../lib/admin-data";
import { Field, useBodyScrollLock } from "../../components/admin-dialog";
import { ProductAttributeFields } from "../../components/admin-product-attribute-fields";
import {
  canSelectAsCover,
  coverImage,
  selectAsCover,
  selectAsCoverBySrc,
} from "../../lib/product-cover";

const number = new Intl.NumberFormat("fa-IR");

export function parsePriceInput(raw: string) {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const digits = raw
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits);
}

export function formatPriceInput(value: number) {
  if (!value) return "";
  return number.format(value);
}

export function ProductDialog({
  product,
  onClose,
  onSave,
  onUploadImage,
  onFetchAttributes,
  onDelete,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onSave: (product: AdminProduct) => void | Promise<void>;
  onUploadImage: (
    slug: string,
    file: File,
    onProgress?: (value: number) => void,
    signal?: AbortSignal,
  ) => Promise<{
    storage: AdminRemoteMediaStorage;
    objectKey: string;
  }>;
  onFetchAttributes: (category: string) => Promise<ProductAttribute[]>;
  onDelete?: () => void;
}) {
  useBodyScrollLock();
  const [draft, setDraft] = useState<AdminProduct>(
    product ?? {
      id: crypto.randomUUID(),
      slug: "",
      name: "",
      description: "",
      subtitle: "",
      category: "گلدان",
      price: 0,
      status: "draft",
      artist: "استودیو رَد",
      images: [],
      updatedAt: Date.now(),
      attributeValues: {},
    },
  );
  const [imageError, setImageError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attributeErrors, setAttributeErrors] = useState<
    Record<string, string>
  >({});
  const [saving, setSaving] = useState(false);
  const [limits, setLimits] = useState<{ image: number; video: number } | null>(
    null,
  );
  const [categoryAttributes, setCategoryAttributes] = useState<
    ProductAttribute[]
  >([]);
  const [attributesLoading, setAttributesLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setAttributesLoading(true);
    onFetchAttributes(draft.category)
      .then((list) => {
        if (active) setCategoryAttributes(list);
      })
      .catch(() => {
        if (active) setCategoryAttributes([]);
      })
      .finally(() => {
        if (active) setAttributesLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.category]);
  const [uploads, setUploads] = useState<
    Record<
      string,
      { file: File; progress: number; error?: string; pending: boolean }
    >
  >({});
  const controllers = useRef(new Map<string, AbortController>());
  const previewUrlsRef = useRef<string[]>([]);
  const pendingCover = useRef(new Set<string>());
  const mediaInputId = "product-media-upload";
  const coverInputId = "product-cover-upload";
  const uploadingCount = Object.values(uploads).filter(
    (item) => item.pending,
  ).length;
  const unresolvedUploads = Object.values(uploads).some(
    (item) => item.pending || item.error,
  );
  useEffect(() => {
    let mounted = true;
    api<{ image: number; video: number }>("/admin/media/limits")
      .then((value) => {
        if (mounted) setLimits(value);
      })
      .catch(() => {
        if (mounted)
          setImageError(
            "دریافت محدودیت فایل ممکن نشد. پنجره را دوباره باز کنید.",
          );
      });
    const activeControllers = controllers.current;
    return () => {
      mounted = false;
      activeControllers.forEach((controller) => controller.abort());
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || unresolvedUploads) return;
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "نام محصول را وارد کنید.";
    if (!draft.description.trim())
      next.description = "توضیحات محصول را وارد کنید.";
    if (!draft.slug.trim()) next.slug = "شناسهٔ URL را وارد کنید.";
    if (!draft.artist.trim()) next.artist = "نام هنرمند را وارد کنید.";
    if (!Number.isFinite(draft.price) || draft.price <= 0)
      next.price = "قیمت باید بیشتر از صفر باشد.";
    if (!draft.images.some((image) => !isVideoStorage(image.storage))) {
      setImageError("حداقل یک تصویر برای اثر لازم است.");
      return;
    }
    const nextAttributeErrors: Record<string, string> = {};
    for (const attribute of categoryAttributes) {
      if (!attribute.required) continue;
      const value = draft.attributeValues?.[attribute.id];
      const empty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      if (empty) nextAttributeErrors[attribute.id] = "این ویژگی الزامی است.";
    }
    setErrors(next);
    setAttributeErrors(nextAttributeErrors);
    if (Object.keys(next).length || Object.keys(nextAttributeErrors).length)
      return;
    setSaving(true);
    try {
      await onSave({ ...draft, updatedAt: Date.now() });
    } finally {
      setSaving(false);
    }
  };
  const setAttributeValue = (
    attributeId: string,
    value: ProductAttributeValue | undefined,
  ) =>
    setDraft((item) => {
      const attributeValues = { ...(item.attributeValues ?? {}) };
      if (value === undefined) delete attributeValues[attributeId];
      else attributeValues[attributeId] = value;
      return { ...item, attributeValues };
    });
  const uploadFile = async (file: File, previewUrl: string) => {
    const controller = new AbortController();
    controllers.current.set(previewUrl, controller);
    setUploads((items) => ({
      ...items,
      [previewUrl]: { file, progress: 0, pending: true },
    }));
    try {
      if (
        !limits ||
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
          "video/mp4",
          "video/webm",
        ].includes(file.type)
      )
        throw new Error(
          "فقط تصویر JPEG، PNG، WebP یا ویدیوی MP4، WebM مجاز است.",
        );
      if (
        !file.size ||
        file.size > limits[file.type.startsWith("video/") ? "video" : "image"]
      )
        throw new Error(
          "فایل خالی است یا حجم آن از محدودیت اعلام‌شده بیشتر است.",
        );
      const result = await onUploadImage(
        draft.slug,
        file,
        (progress) =>
          setUploads((items) =>
            items[previewUrl]
              ? { ...items, [previewUrl]: { ...items[previewUrl], progress } }
              : items,
          ),
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setDraft((item) => {
        const images = item.images.map((image) =>
          image.src === previewUrl ? { ...result, src: previewUrl } : image,
        );
        return pendingCover.current.has(previewUrl)
          ? { ...item, images: selectAsCoverBySrc(images, previewUrl) }
          : { ...item, images };
      });
      pendingCover.current.delete(previewUrl);
      setUploads((items) => ({
        ...items,
        [previewUrl]: { file, progress: 100, pending: false },
      }));
    } catch (error) {
      if (!controller.signal.aborted)
        setUploads((items) => ({
          ...items,
          [previewUrl]: {
            file,
            progress: 0,
            pending: false,
            error:
              error instanceof Error
                ? error.message
                : "بارگذاری ناموفق بود. دوباره تلاش کنید.",
          },
        }));
    } finally {
      controllers.current.delete(previewUrl);
    }
  };
  const addImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    asCover = false,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    setImageError("");
    for (const file of files) {
      if (asCover && file.type.startsWith("video/")) {
        setImageError("کاور اثر باید تصویر باشد، نه ویدیو.");
        continue;
      }
      const src = URL.createObjectURL(file);
      previewUrlsRef.current.push(src);
      if (asCover) pendingCover.current.add(src);
      setDraft((item) => ({
        ...item,
        images: [
          ...item.images,
          {
            storage: file.type.startsWith("video/")
              ? "cloudinary_video"
              : "cloudinary",
            objectKey: "",
            src,
          },
        ],
      }));
      void uploadFile(file, src);
    }
  };
  const removeMedia = (index: number) => {
    const src = draft.images[index].src;
    if (src) {
      pendingCover.current.delete(src);
      controllers.current.get(src)?.abort();
      setUploads((items) => {
        const copy = { ...items };
        delete copy[src];
        return copy;
      });
      if (src.startsWith("blob:")) URL.revokeObjectURL(src);
    }
    setDraft((item) => ({
      ...item,
      images: item.images.filter((_, i) => i !== index),
    }));
  };
  const moveMedia = (index: number, offset: number) =>
    setDraft((item) => {
      const images = [...item.images];
      [images[index], images[index + offset]] = [
        images[index + offset],
        images[index],
      ];
      return { ...item, images };
    });
  const setCover = (index: number) =>
    setDraft((item) => ({
      ...item,
      images: selectAsCover(item.images, index, uploads),
    }));
  const previewCover = coverImage(draft.images, uploads);
  const sections: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: "section-basics", label: "اطلاعات اصلی", icon: <Pencil /> },
    { id: "section-category", label: "دسته‌بندی", icon: <Tag /> },
    {
      id: "section-attributes",
      label: "ویژگی‌های محصول",
      icon: <SlidersHorizontal />,
    },
    {
      id: "section-pricing",
      label: "وضعیت و قیمت",
      icon: <CircleDollarSign />,
    },
    { id: "section-images", label: "تصویر و ویدیوی اثر", icon: <ImageIcon /> },
  ];
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const goToSection = (id: string) => {
    setActiveSection(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div
      className="editor-shell"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="editor-dialog"
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <aside className="editor-aside">
          <Button variant="ghost" className="editor-back" onClick={onClose}>
            <ChevronRight />
            بازگشت به لیست
          </Button>
          <div className="editor-cover">
            {previewCover?.src ? (
              <img
                className="product-thumb"
                src={previewCover.src}
                alt=""
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="product-thumb">
                <Package />
              </div>
            )}
            <label htmlFor={coverInputId} className="upload-button">
              <ImagePlus />
              تغییر کاور
            </label>
            <input
              id={coverInputId}
              className="sr-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => addImage(event, true)}
              disabled={!limits || saving}
            />
          </div>
          <nav className="editor-section-nav">
            {sections.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                fullWidth
                className={activeSection === item.id ? "active" : ""}
                onClick={() => goToSection(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
                <ChevronLeft />
              </Button>
            ))}
            {product && onDelete && (
              <Button variant="ghost" fullWidth className="danger" onClick={onDelete}>
                <Trash2 />
                <span>حذف محصول</span>
              </Button>
            )}
          </nav>
        </aside>

        <div className="editor-main">
          <div className="editor-main-head">
            <h2 id="editor-title">{product ? "ویرایش اثر" : "اثر تازه"}</h2>
            <Button
              type="submit"
              disabled={unresolvedUploads}
              loading={saving}
            >
              <PackageCheck />
              {uploadingCount > 0 ? "در حال بارگذاری…" : "ذخیره تغییرات"}
            </Button>
          </div>

          <section id="section-basics" className="editor-section-card">
            <h3>
              <Pencil />
              اطلاعات اصلی
            </h3>
            <div className="form-grid">
              <Field label="نام اثر" error={errors.name}>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field label="شناسه (خودکار)" error={errors.slug}>
                <input
                  dir="ltr"
                  value={draft.slug}
                  readOnly={Boolean(product)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      slug: event.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-"),
                    })
                  }
                  aria-invalid={Boolean(errors.slug)}
                />
              </Field>
              <Field label="هنرمند" error={errors.artist}>
                <input
                  value={draft.artist}
                  onChange={(event) =>
                    setDraft({ ...draft, artist: event.target.value })
                  }
                  aria-invalid={Boolean(errors.artist)}
                />
              </Field>
            </div>
            <Field label="توضیحات اثر" error={errors.description}>
              <textarea
                rows={5}
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
                aria-invalid={Boolean(errors.description)}
              />
            </Field>
            <Field label="زیرعنوان کوتاه (اختیاری)">
              <input
                value={draft.subtitle ?? ""}
                placeholder="خالی بماند تا از ابتدای توضیحات ساخته شود"
                onChange={(event) =>
                  setDraft({ ...draft, subtitle: event.target.value })
                }
              />
            </Field>
          </section>

          <section id="section-category" className="editor-section-card">
            <h3>
              <Tag />
              دسته‌بندی
            </h3>
            <div className="form-grid">
              <Field label="دسته‌بندی فرعی">
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      category: event.target.value as AdminProduct["category"],
                    })
                  }
                >
                  {PRODUCT_CATEGORY_LABELS.map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section id="section-attributes" className="editor-section-card">
            <h3>
              <SlidersHorizontal />
              ویژگی‌های محصول
            </h3>
            <ProductAttributeFields
              attributes={categoryAttributes}
              loading={attributesLoading}
              values={draft.attributeValues ?? {}}
              errors={attributeErrors}
              onChange={setAttributeValue}
            />
          </section>

          <section id="section-pricing" className="editor-section-card">
            <h3>
              <CircleDollarSign />
              وضعیت و قیمت
            </h3>
            <div className="form-grid">
              <Field label="قیمت اثر (تومان)" error={errors.price}>
                <input
                  dir="ltr"
                  inputMode="numeric"
                  value={formatPriceInput(draft.price)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      price: parsePriceInput(event.target.value),
                    })
                  }
                  aria-invalid={Boolean(errors.price)}
                />
              </Field>
              <Field label="وضعیت اثر">
                <select
                  value={draft.status}
                  disabled={Boolean(product?.held)}
                  title={
                    product?.held ? productStatusLabel(product) : undefined
                  }
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      status: event.target.value as AdminProduct["status"],
                    })
                  }
                >
                  {productStatusOptions(product?.status).map((value) => (
                    <option key={value} value={value}>
                      {productStatusLabels[value]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section id="section-images" className="editor-section-card">
            <h3>
              <ImageIcon />
              تصویر و ویدیوی اثر
            </h3>
            <div className="image-editor">
              <p>
                حداقل یک تصویر لازم است. تصویر کاور در کارت فروشگاه و اولین
                تصویر صفحهٔ اثر نمایش داده می‌شود.
              </p>
              <p>
                {limits
                  ? `تصویر JPEG، PNG، WebP تا ${number.format(limits.image / 1024 / 1024)} مگابایت؛ ویدیوی MP4، WebM تا ${number.format(limits.video / 1024 / 1024)} مگابایت.`
                  : "در حال دریافت محدودیت فایل…"}
              </p>
              <label htmlFor={mediaInputId} className="upload-button">
                <ImagePlus /> افزودن تصویر یا ویدیو
              </label>
              <input
                id={mediaInputId}
                className="sr-file"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={(event) => addImage(event)}
                disabled={!limits || saving}
              />
              {imageError && (
                <p className="field-error" role="alert">
                  {imageError}
                </p>
              )}
              {unresolvedUploads && (
                <p role="status">
                  برای ذخیره، منتظر پایان بارگذاری بمانید و فایل‌های ناموفق را
                  دوباره بارگذاری یا حذف کنید.
                </p>
              )}
              <div className="product-media-list">
                {draft.images.map((image, index) => {
                  const upload = image.src ? uploads[image.src] : undefined;
                  const isCover = coverImage(draft.images, uploads) === image;
                  const coverReady = canSelectAsCover(image, upload);
                  return (
                    <div
                      className={`product-media-item${isCover ? " is-cover" : ""}`}
                      key={image.src || image.objectKey || index}
                    >
                      {isVideoStorage(image.storage) ? (
                        <video
                          src={image.src ?? undefined}
                          controls
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={image.src ?? undefined}
                          alt={`تصویر ${number.format(index + 1)}`}
                        />
                      )}
                      {isCover && (
                        <span className="cover-badge">کاور انتخاب‌شده</span>
                      )}
                      {upload && <small>{upload.file.name}</small>}
                      {upload?.pending && (
                        <>
                          <progress
                            max={100}
                            value={upload.progress}
                            aria-label="پیشرفت بارگذاری"
                          />
                          <small role="status">
                            {upload.progress === 100
                              ? "در حال بررسی فایل…"
                              : `بارگذاری ${number.format(upload.progress)}٪`}
                          </small>
                        </>
                      )}
                      {upload?.error && (
                        <p className="field-error" role="alert">
                          {upload.error}
                        </p>
                      )}
                      <div className="product-media-actions">
                        {!isVideoStorage(image.storage) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className={isCover ? "cover-selected" : ""}
                            disabled={saving || isCover || !coverReady}
                            onClick={() => setCover(index)}
                          >
                            {isCover ? "کاور فعلی" : "انتخاب به‌عنوان کاور"}
                          </Button>
                        )}
                        {upload?.error && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              void uploadFile(upload.file, image.src!)
                            }
                          >
                            تلاش دوباره
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="content-danger"
                          disabled={saving}
                          onClick={() => removeMedia(index)}
                          aria-label={`حذف فایل ${number.format(index + 1)}`}
                        >
                          حذف
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={saving || index === 0}
                          onClick={() => moveMedia(index, -1)}
                          aria-label={`جابه‌جایی فایل ${number.format(index + 1)} به قبل`}
                        >
                          قبل
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={saving || index === draft.images.length - 1}
                          onClick={() => moveMedia(index, 1)}
                          aria-label={`جابه‌جایی فایل ${number.format(index + 1)} به بعد`}
                        >
                          بعد
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
