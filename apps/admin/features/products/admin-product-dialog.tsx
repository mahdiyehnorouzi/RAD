"use client";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Image as ImageIcon,
  ImagePlus,
  Package,
  Pencil,
  QrCode,
  SlidersHorizontal,
  Tag,
  Trash2,
} from "lucide-react";
import { Button } from "@rad/ui";
import { api, API_BASE } from "../../lib/api";
import { formatRadCode } from "@rad/types";
import { storefrontUrl } from "../../lib/storefront-url";
import { StatusBadge } from "../../components/admin-list-chrome";
import { productStatusTone } from "./admin-products";
import { productSnapshot } from "./product-workspace";
import "./products-workspace.css";
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
import { Field } from "../../components/admin-dialog";
import { ProductAttributeFields } from "../../components/admin-product-attribute-fields";
import {
  canSelectAsCover,
  coverImage,
  selectAsCover,
  selectAsCoverBySrc,
} from "../../lib/product-cover";

const number = new Intl.NumberFormat("fa-IR");

/** Browser-ready URL. Relative catalog paths go through the admin API proxy. */
function mediaSrc(src?: string | null) {
  const value = src?.trim();
  if (!value) return undefined;
  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("http")
  ) {
    return value;
  }
  return value.startsWith("/") ? `${API_BASE}${value}` : value;
}

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
  canWrite = true,
  onDirtyChange,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onSave: (product: AdminProduct) => void | Promise<void>;
  canWrite?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
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
  const [reservedNumbers, setReservedNumbers] = useState<
    Array<{ id: string; radNumber: number; label: string }>
  >([]);
  const [qrSvg, setQrSvg] = useState("");
  const [qrNote, setQrNote] = useState("");
  useEffect(() => {
    if (!product?.id || !product.radNumber) {
      setQrSvg("");
      setQrNote("");
      return;
    }
    let active = true;
    fetch(`${API_BASE}/admin/identities/products/${product.id}/qr.svg`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            message?: string;
          };
          return {
            svg: "",
            note: data.message || "QR این اثر قابل دانلود نیست.",
          };
        }
        const svg = await response.text();
        const start = svg.indexOf("<svg");
        return {
          svg: start >= 0 ? svg.slice(start) : "",
          note: start >= 0 ? "" : "QR این اثر قابل دانلود نیست.",
        };
      })
      .then((result) => {
        if (!active) return;
        setQrSvg(result.svg);
        setQrNote(result.note);
      })
      .catch(() => {
        if (!active) return;
        setQrSvg("");
        setQrNote("QR این اثر قابل دانلود نیست.");
      });
    return () => {
      active = false;
    };
  }, [product?.id, product?.radNumber]);
  useEffect(() => {
    if (product) return;
    let active = true;
    api<Array<{ id: string; radNumber: number; label: string }>>(
      "/admin/identities?status=reserved&assignment=unassigned",
    )
      .then((rows) => {
        if (active) setReservedNumbers(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (active) setReservedNumbers([]);
      });
    return () => {
      active = false;
    };
  }, [product]);
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
  const baseline = useRef<string | null>(null);
  if (baseline.current === null) baseline.current = productSnapshot(draft);
  const isDirty =
    productSnapshot(draft) !== baseline.current || unresolvedUploads;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);
  useEffect(() => {
    if (!isDirty) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [isDirty]);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      const overlap = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      document.documentElement.style.setProperty(
        "--keyboard-inset",
        `${overlap}px`,
      );
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      document.documentElement.style.removeProperty("--keyboard-inset");
    };
  }, []);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
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
    const previewUrls = previewUrlsRef.current;
    return () => {
      mounted = false;
      activeControllers.forEach((controller) => controller.abort());
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  async function downloadProductQr(kind: "svg" | "png") {
    if (!product?.id) return;
    const response = await fetch(
      `${API_BASE}/admin/identities/products/${product.id}/qr.${kind}`,
      { credentials: "include" },
    );
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RAD-${formatRadCode(product.radNumber ?? 0)}.${kind}`;
    link.click();
    URL.revokeObjectURL(url);
  }

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
              ? "seaweedfs_video"
              : "seaweedfs",
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
  const previewHref = draft.slug.trim()
    ? storefrontUrl(`/products/${encodeURIComponent(draft.slug.trim())}`)
    : "";
  const locked = saving || !canWrite;
  const radLabel = draft.radNumber
    ? `RAD-${formatRadCode(draft.radNumber)}`
    : product
      ? "شماره بعد از ذخیره"
      : "شماره تازه";

  return (
    <form className="product-editor" onSubmit={submit} noValidate>
      <div className="product-editor-top">
        <Button
          variant="ghost"
          className="product-back product-back-mobile"
          onClick={onClose}
        >
          <ChevronRight />
          بازگشت به لیست
        </Button>
        <div className="product-editor-identity">
          <div className="product-editor-copy">
            <span className="editor-kicker">
              {product ? "ویرایش اثر" : "اثر تازه"}
            </span>
            <h2 id="editor-title" tabIndex={-1} ref={titleRef}>
              {product ? draft.name || "ویرایش اثر" : "اثر تازه"}
            </h2>
            <p className="editor-meta">
              <span>{draft.artist || "هنرمند"}</span>
              <span className="editor-rad" dir="ltr">
                {radLabel}
              </span>
            </p>
            <StatusBadge
              label={productStatusLabel(draft)}
              tone={productStatusTone(draft)}
            />
            {isDirty ? (
              <p className="editor-unsaved" role="status">
                تغییرات ذخیره نشده
              </p>
            ) : null}
          </div>
          <div className="product-editor-cover-stack">
            <div className="product-editor-cover">
              {mediaSrc(previewCover?.src) ? (
                <img src={mediaSrc(previewCover?.src)} alt="" />
              ) : (
                <Package />
              )}
            </div>
            <label htmlFor={coverInputId} className="cover-change">
              <ImagePlus />
              تغییر کاور
            </label>
            <input
              id={coverInputId}
              className="sr-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => addImage(event, true)}
              disabled={!limits || locked}
            />
          </div>
        </div>
        <div className="product-editor-actions">
          {product && onDelete ? (
            <Button
              variant="ghost"
              className="content-danger product-editor-delete"
              onClick={onDelete}
              disabled={!canWrite}
            >
              <Trash2 />
              حذف محصول
            </Button>
          ) : null}
          <div className="product-editor-actions-desktop">
            <Button variant="ghost" className="product-back" onClick={onClose}>
              <ChevronRight />
              بازگشت به لیست
            </Button>
            <PreviewLink href={previewHref} />
            <Button
              type="submit"
              disabled={!canWrite || unresolvedUploads}
              loading={saving}
            >
              <Check />
              {uploadingCount > 0 ? "در حال بارگذاری…" : "ذخیره تغییرات"}
            </Button>
          </div>
        </div>
      </div>

      <details className="editor-accordion" id="section-basics" open>
        <summary>
          <Pencil />
          اطلاعات اصلی
          <ChevronDown className="accordion-chevron" />
        </summary>
        <div className="editor-accordion-body">
          <div className="form-grid">
            <Field label="نام اثر" error={errors.name}>
              <input
                value={draft.name}
                disabled={locked}
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
                readOnly={Boolean(product) || !canWrite}
                disabled={locked && !product}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    slug: event.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
                aria-invalid={Boolean(errors.slug)}
              />
            </Field>
            <Field label={draft.radNumber ? "شماره رَد" : "شماره رزروشده"}>
              {product ? (
                <input
                  dir="ltr"
                  readOnly
                  value={
                    draft.radNumber
                      ? `RAD-${formatRadCode(draft.radNumber)}`
                      : "بعد از ذخیره ثبت می‌شود"
                  }
                />
              ) : (
                <select
                  value={draft.reservedRadNumber ?? ""}
                  disabled={locked}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      reservedRadNumber: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    })
                  }
                >
                  <option value="">شماره تازه، بعد از ذخیره</option>
                  {reservedNumbers.map((identity) => (
                    <option key={identity.id} value={identity.radNumber}>
                      {identity.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="هنرمند" error={errors.artist}>
              <input
                value={draft.artist}
                disabled={locked}
                onChange={(event) =>
                  setDraft({ ...draft, artist: event.target.value })
                }
                aria-invalid={Boolean(errors.artist)}
              />
            </Field>
          </div>
        </div>
      </details>

      {product ? (
        <details className="editor-accordion" id="section-identity">
          <summary>
            <QrCode />
            شناسه و QR
            <ChevronDown className="accordion-chevron" />
          </summary>
          <div className="editor-accordion-body">
            <Field label="QR دائمی">
              {draft.radNumber ? (
                <>
                  <p className="product-qr-url" dir="ltr">
                    {`https://www.rad-object.com/r/${formatRadCode(draft.radNumber)}`}
                  </p>
                  {qrSvg ? (
                    <span
                      className="product-qr-preview"
                      aria-label={`QR ${formatRadCode(draft.radNumber)}`}
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  ) : (
                    <span>{qrNote || "QR آماده نیست."}</span>
                  )}
                  {qrSvg ? (
                    <div className="product-qr-actions">
                      <Button
                        type="button"
                        onClick={() => void downloadProductQr("svg")}
                      >
                        <QrCode />
                        دانلود SVG
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void downloadProductQr("png")}
                      >
                        دانلود PNG
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <span>
                  این اثر شماره رَد ندارد. برای آثار قبلی شماره تازه‌ای ساخته
                  نمی‌شود.
                </span>
              )}
            </Field>
          </div>
        </details>
      ) : null}

      <details className="editor-accordion" id="section-description">
        <summary>
          <Pencil />
          توضیحات اثر
          <ChevronDown className="accordion-chevron" />
        </summary>
        <div className="editor-accordion-body">
          <Field label="توضیحات اثر" error={errors.description}>
            <textarea
              rows={5}
              value={draft.description}
              disabled={locked}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
              aria-invalid={Boolean(errors.description)}
            />
          </Field>
          <Field label="زیرعنوان کوتاه (اختیاری)">
            <input
              value={draft.subtitle ?? ""}
              disabled={locked}
              placeholder="خالی بماند تا از ابتدای توضیحات ساخته شود"
              onChange={(event) =>
                setDraft({ ...draft, subtitle: event.target.value })
              }
            />
          </Field>
        </div>
      </details>

      <details className="editor-accordion" id="section-category">
        <summary>
          <Tag />
          دسته‌بندی
          <ChevronDown className="accordion-chevron" />
        </summary>
        <div className="editor-accordion-body">
          <div className="form-grid">
            <Field label="دسته‌بندی فرعی">
              <select
                value={draft.category}
                disabled={locked}
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
        </div>
      </details>

      <details className="editor-accordion" id="section-attributes">
        <summary>
          <SlidersHorizontal />
          ویژگی‌های محصول
          <ChevronDown className="accordion-chevron" />
        </summary>
        <div className="editor-accordion-body">
          <fieldset className="editor-fields" disabled={locked}>
            <ProductAttributeFields
              attributes={categoryAttributes}
              loading={attributesLoading}
              values={draft.attributeValues ?? {}}
              errors={attributeErrors}
              onChange={setAttributeValue}
            />
          </fieldset>
        </div>
      </details>

      <details className="editor-accordion" id="section-pricing">
        <summary>
          <CircleDollarSign />
          وضعیت و قیمت
          <ChevronDown className="accordion-chevron" />
        </summary>
        <div className="editor-accordion-body">
          <div className="form-grid">
            <Field label="قیمت اثر (تومان)" error={errors.price}>
              <input
                dir="ltr"
                inputMode="numeric"
                value={formatPriceInput(draft.price)}
                disabled={locked}
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
                disabled={locked || Boolean(product?.held)}
                title={product?.held ? productStatusLabel(product) : undefined}
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
        </div>
      </details>

      <details className="editor-accordion" id="section-images">
        <summary>
          <ImageIcon />
          تصویر و ویدیوی اثر
          <ChevronDown className="accordion-chevron" />
        </summary>
        <div className="editor-accordion-body">
          <p>
            حداقل یک تصویر لازم است. تصویر کاور در کارت فروشگاه و اولین تصویر
            صفحهٔ اثر نمایش داده می‌شود.
          </p>
          <p>
            {limits
              ? `تصویر JPEG، PNG، WebP تا ${number.format(limits.image / 1024 / 1024)} مگابایت؛ ویدیوی MP4، WebM تا ${number.format(limits.video / 1024 / 1024)} مگابایت.`
              : "در حال دریافت محدودیت فایل…"}
          </p>
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
          <div className="artwork-media-grid">
            {draft.images.map((image, index) => {
              const upload = image.src ? uploads[image.src] : undefined;
              const isCover = coverImage(draft.images, uploads) === image;
              const coverReady = canSelectAsCover(image, upload);
              const shown = mediaSrc(image.src);
              return (
                <div
                  className={`artwork-media-card${isCover ? " is-cover" : ""}${shown ? "" : " is-missing"}`}
                  key={image.src || image.objectKey || index}
                >
                  <div className="artwork-media-frame">
                    {isVideoStorage(image.storage) ? (
                      <video
                        src={shown}
                        controls
                        playsInline
                        preload="metadata"
                      />
                    ) : shown ? (
                      <img
                        src={shown}
                        alt={`تصویر ${number.format(index + 1)}`}
                      />
                    ) : (
                      <span className="media-missing">
                        فایل تصویر موجود نیست
                      </span>
                    )}
                    {isCover && (
                      <span className="cover-badge">کاور انتخاب‌شده</span>
                    )}
                  </div>
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
                  <div className="artwork-media-actions">
                    {!isVideoStorage(image.storage) && (
                      <Button
                        variant={isCover ? "primary" : "secondary"}
                        size="sm"
                        className={isCover ? "is-cover-choice" : undefined}
                        aria-pressed={isCover}
                        disabled={locked || isCover || !coverReady}
                        onClick={() => setCover(index)}
                      >
                        انتخاب به‌عنوان کاور
                      </Button>
                    )}
                    {upload?.error && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void uploadFile(upload.file, image.src!)}
                      >
                        تلاش دوباره
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="content-danger"
                      disabled={locked}
                      onClick={() => removeMedia(index)}
                      aria-label={`حذف فایل ${number.format(index + 1)}`}
                    >
                      حذف
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={locked || index === 0}
                      onClick={() => moveMedia(index, -1)}
                      aria-label={`جابه‌جایی فایل ${number.format(index + 1)} به قبل`}
                    >
                      قبل
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={locked || index === draft.images.length - 1}
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
          <label htmlFor={mediaInputId} className="media-add">
            <ImagePlus /> افزودن تصویر یا ویدیو
          </label>
          <input
            id={mediaInputId}
            className="sr-file"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            onChange={(event) => addImage(event)}
            disabled={!limits || locked}
          />
        </div>
      </details>

      <div className="product-editor-dock">
        <PreviewLink href={previewHref} />
        <Button
          type="submit"
          disabled={!canWrite || unresolvedUploads}
          loading={saving}
        >
          <Check />
          {uploadingCount > 0 ? "در حال بارگذاری…" : "ذخیره تغییرات"}
        </Button>
      </div>
    </form>
  );
}

function PreviewLink({ href }: { href: string }) {
  if (!href) {
    return (
      <Button variant="secondary" disabled>
        پیش‌نمایش
      </Button>
    );
  }
  return (
    <a
      className="rad-button rad-button-secondary rad-button-md"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      پیش‌نمایش
    </a>
  );
}
