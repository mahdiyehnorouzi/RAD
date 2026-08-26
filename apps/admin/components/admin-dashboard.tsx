"use client";

import { useMemo, useRef, useState } from "react";
import { Archive, ChevronLeft, CircleGauge, ImagePlus, LayoutDashboard, LogOut, Menu, Package, Pencil, Plus, Search, ShieldCheck, ShoppingBag, Trash2, Users, X } from "lucide-react";
import { useAdminWorkspace } from "../hooks/use-admin-workspace";
import { orderStatusLabels, productStatusLabels, roleLabels, type AdminMember, type AdminOrder, type AdminProduct, type AdminRole, type AdminSection } from "../lib/admin-data";

const navItems: { id: AdminSection; label: string; icon: typeof Package }[] = [
  { id: "overview", label: "مرور استودیو", icon: LayoutDashboard },
  { id: "products", label: "آثار و محصولات", icon: Archive },
  { id: "orders", label: "سفارش‌ها", icon: ShoppingBag },
  { id: "members", label: "افراد و دسترسی", icon: Users },
];

const number = new Intl.NumberFormat("fa-IR");
const money = (value: number) => `${number.format(value)} تومان`;
const date = (value: number) => new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(value);

export function AdminDashboard() {
  const workspace = useAdminWorkspace();
  const [section, setSection] = useState<AdminSection>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [productEditor, setProductEditor] = useState<AdminProduct | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState("");

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const go = (next: AdminSection) => { setSection(next); setMobileNav(false); };

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${mobileNav ? "is-open" : ""}`} aria-label="ناوبری مدیریت">
      <button className="nav-close" type="button" onClick={() => setMobileNav(false)} aria-label="بستن منو"><X /></button>
      <div className="brand-lockup"><span className="brand-mark">رَد</span><div><strong>دفتر کوره</strong><small>پنل مدیریت استودیو</small></div></div>
      <nav className="admin-nav">{navItems.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={section === id ? "active" : ""} onClick={() => go(id)}><Icon /><span>{label}</span><ChevronLeft /></button>)}</nav>
      <div className="sidebar-foot"><div className="avatar">م‌ن</div><div><strong>مهدیه نوروزی</strong><small>{roleLabels[workspace.currentRole]}</small></div><button type="button" aria-label="خروج از حساب" onClick={() => announce("خروج از حساب پس از اتصال احراز هویت فعال می‌شود.")}><LogOut /></button></div>
    </aside>

    {mobileNav && <button className="nav-scrim" type="button" onClick={() => setMobileNav(false)} aria-label="بستن منو" />}

    <main className="admin-main">
      <header className="admin-topbar"><button className="menu-button" type="button" onClick={() => setMobileNav(true)} aria-label="باز کردن منو"><Menu /></button><div><span className="context-label">رَد / عملیات استودیو</span><h1>{navItems.find((item) => item.id === section)?.label}</h1></div><div className="topbar-status"><span className="live-dot" />نسخهٔ محلی</div></header>

      {section === "overview" && <Overview workspace={workspace} onNavigate={go} />}
      {section === "products" && <Products products={workspace.products} canWrite={workspace.can("product.write")} onCreate={() => setProductEditor("new")} onEdit={setProductEditor} onDelete={setDeleteTarget} />}
      {section === "orders" && <Orders orders={workspace.orders} canWrite={workspace.can("order.write")} onChange={(order) => { workspace.updateOrder(order); announce("وضعیت سفارش ذخیره شد."); }} />}
      {section === "members" && <Members members={workspace.members} canWrite={workspace.can("member.write")} onInvite={() => setInviteOpen(true)} onChange={(member) => { workspace.updateMember(member); announce("سطح دسترسی به‌روزرسانی شد."); }} />}
    </main>

    {productEditor && <ProductDialog product={productEditor === "new" ? null : productEditor} onClose={() => setProductEditor(null)} onSave={(product) => { workspace.saveProduct(product); setProductEditor(null); announce(productEditor === "new" ? "محصول جدید اضافه شد." : "تغییرات محصول ذخیره شد."); }} />}
    {deleteTarget && <ConfirmDialog title={`حذف «${deleteTarget.name}»؟`} description="این محصول از فهرست محلی مدیریت حذف می‌شود. این عمل در نسخهٔ فعلی قابل بازگشت نیست." onCancel={() => setDeleteTarget(null)} onConfirm={() => { workspace.deleteProduct(deleteTarget.id); setDeleteTarget(null); announce("محصول حذف شد."); }} />}
    {inviteOpen && <InviteDialog onClose={() => setInviteOpen(false)} onInvite={(member) => { workspace.inviteMember(member); setInviteOpen(false); announce("دعوت‌نامه به فهرست اعضا اضافه شد."); }} />}
    <div className={`admin-toast ${toast ? "visible" : ""}`} role="status" aria-live="polite">{toast}</div>
  </div>;
}

function Overview({ workspace, onNavigate }: { workspace: ReturnType<typeof useAdminWorkspace>; onNavigate: (section: AdminSection) => void }) {
  const pending = workspace.orders.filter((order) => order.status !== "delivered").length;
  return <div className="view-stack">
    <section className="overview-hero"><div><span className="eyebrow">وضعیت امروز</span><h2>هر اثر، از ثبت تا تحویل زیر یک سقف.</h2><p>محصولات، سفارش‌ها و دسترسی همکاران را بدون جدا شدن از زبان بصری رَد مدیریت کنید.</p></div><div className="kiln-dial"><CircleGauge /><strong>{number.format(workspace.products.length)}</strong><span>اثر ثبت‌شده</span></div></section>
    <section className="metric-grid">
      <Metric label="آثار موجود" value={workspace.products.filter((item) => item.status === "available").length} note="آمادهٔ فروش" />
      <Metric label="سفارش فعال" value={pending} note="در مسیر ساخت یا ارسال" />
      <Metric label="اعضای تیم" value={workspace.members.length} note="فعال و دعوت‌شده" />
    </section>
    <section className="split-grid"><article className="paper-panel"><div className="panel-heading"><div><span className="eyebrow">سفارش‌های اخیر</span><h3>حرکت در کارگاه</h3></div><button className="text-action" type="button" onClick={() => onNavigate("orders")}>دیدن همه</button></div>{workspace.orders.slice(0, 3).map((order) => <div className="compact-row" key={order.id}><div><strong>{order.productName}</strong><small>{order.id} · {order.customer}</small></div><StatusBadge label={orderStatusLabels[order.status]} tone="green" /></div>)}</article>
      <article className="dark-panel"><span className="eyebrow">دسترسی تیم</span><ShieldCheck /><h3>نقش‌ها روشن، مسئولیت‌ها دقیق.</h3><p>مالک، مدیر، ویرایشگر و مشاهده‌گر هرکدام سطح دسترسی مشخص دارند.</p><button className="light-action" type="button" onClick={() => onNavigate("members")}>مدیریت افراد</button></article></section>
  </div>;
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) { return <article className="metric"><span>{label}</span><strong>{number.format(value).padStart(2, "۰")}</strong><small>{note}</small></article>; }

function Products({ products, canWrite, onCreate, onEdit, onDelete }: { products: AdminProduct[]; canWrite: boolean; onCreate: () => void; onEdit: (product: AdminProduct) => void; onDelete: (product: AdminProduct) => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => products.filter((product) => `${product.name} ${product.artist} ${product.slug}`.includes(query.trim())), [products, query]);
  return <section className="paper-panel data-view"><div className="view-heading"><div><span className="eyebrow">کاتالوگ یک‌به‌یک</span><h2>آثار</h2><p>{number.format(filtered.length)} محصول در این نما</p></div><button className="primary-action" type="button" onClick={onCreate} disabled={!canWrite}><Plus />افزودن محصول</button></div>
    <div className="toolbar"><div className="search-field"><Search /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جست‌وجوی نام، هنرمند یا شناسه" aria-label="جست‌وجوی محصولات" />{query && <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="پاک کردن جست‌وجو"><X /></button>}</div></div>
    {filtered.length ? <div className="product-list">{filtered.map((product) => <article className="product-row" key={product.id}><ProductThumb product={product} /><div className="product-primary"><span>{product.category} · {product.artist}</span><h3>{product.name}</h3><p>{product.description}</p></div><div className="product-meta"><StatusBadge label={productStatusLabels[product.status]} tone={product.status === "sold" ? "muted" : "green"} /><strong>{money(product.price)}</strong><small>ویرایش {date(product.updatedAt)}</small></div><div className="row-actions"><button type="button" onClick={() => onEdit(product)} disabled={!canWrite} aria-label={`ویرایش ${product.name}`}><Pencil /></button><button className="danger" type="button" onClick={() => onDelete(product)} disabled={!canWrite} aria-label={`حذف ${product.name}`}><Trash2 /></button></div></article>)}</div> : <EmptyState title="محصولی پیدا نشد" description="عبارت جست‌وجو را تغییر دهید یا محصول تازه‌ای اضافه کنید." />}
  </section>;
}

function ProductThumb({ product }: { product: AdminProduct }) { return <div className="product-thumb">{product.images[0] ? <img src={product.images[0]} alt="" /> : <Package /> }<span>{number.format(product.images.length)} عکس</span></div>; }

function Orders({ orders, canWrite, onChange }: { orders: AdminOrder[]; canWrite: boolean; onChange: (order: AdminOrder) => void }) {
  return <section className="paper-panel data-view"><div className="view-heading"><div><span className="eyebrow">از ثبت تا تحویل</span><h2>سفارش‌ها</h2><p>وضعیت هر قطعه را در مسیر کارگاه ثبت کنید.</p></div></div><div className="table-wrap"><table><thead><tr><th>سفارش</th><th>مشتری</th><th>اثر</th><th>مبلغ</th><th>وضعیت</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{date(order.createdAt)}</small></td><td>{order.customer}</td><td>{order.productName}</td><td>{money(order.amount)}</td><td><select value={order.status} disabled={!canWrite} onChange={(event) => onChange({ ...order, status: event.target.value as AdminOrder["status"] })} aria-label={`وضعیت سفارش ${order.id}`}>{Object.entries(orderStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}</tbody></table></div></section>;
}

function Members({ members, canWrite, onInvite, onChange }: { members: AdminMember[]; canWrite: boolean; onInvite: () => void; onChange: (member: AdminMember) => void }) {
  return <section className="paper-panel data-view"><div className="view-heading"><div><span className="eyebrow">حریم کارگاه</span><h2>افراد و دسترسی</h2><p>دسترسی هر فرد را بر اساس مسئولیت واقعی او تنظیم کنید.</p></div><button className="primary-action" type="button" onClick={onInvite} disabled={!canWrite}><Plus />دعوت فرد جدید</button></div><div className="member-list">{members.map((member) => <article className="member-row" key={member.id}><div className="member-avatar">{member.name.slice(0, 1)}</div><div><strong>{member.name}</strong><small>{member.email}</small></div><StatusBadge label={member.status === "active" ? "فعال" : "دعوت‌شده"} tone={member.status === "active" ? "green" : "muted"} /><select value={member.role} disabled={!canWrite || member.role === "owner"} onChange={(event) => onChange({ ...member, role: event.target.value as AdminRole })} aria-label={`نقش ${member.name}`}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></article>)}</div><div className="permission-note"><ShieldCheck /><div><strong>کنترل امنیت سمت سرور ضروری است</strong><p>این نسخه نقش‌ها را برای طراحی و تست محلی نگه می‌دارد. در محصول واقعی، API باید هر عملیات را دوباره مجازسنجی کند.</p></div></div></section>;
}

function ProductDialog({ product, onClose, onSave }: { product: AdminProduct | null; onClose: () => void; onSave: (product: AdminProduct) => void }) {
  const [draft, setDraft] = useState<AdminProduct>(product ?? { id: crypto.randomUUID(), slug: "", name: "", description: "", category: "گلدان", price: 0, status: "draft", artist: "استودیو رَد", images: [], updatedAt: Date.now() });
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (event: React.FormEvent) => { event.preventDefault(); const next: Record<string, string> = {}; if (!draft.name.trim()) next.name = "نام محصول را وارد کنید."; if (!draft.description.trim()) next.description = "توضیحات محصول را وارد کنید."; if (!draft.slug.trim()) next.slug = "شناسهٔ URL را وارد کنید."; if (draft.price <= 0) next.price = "قیمت باید بیشتر از صفر باشد."; setErrors(next); if (Object.keys(next).length) return; onSave({ ...draft, updatedAt: Date.now() }); };
  const addImage = () => { const value = imageUrl.trim(); if (!value) return; setDraft((item) => ({ ...item, images: [...item.images, value] })); setImageUrl(""); };
  return <DialogShell title={product ? "ویرایش محصول" : "محصول تازه"} description="نام، توضیحات، قیمت و تصاویر اثر را ثبت کنید." onClose={onClose}><form className="editor-form" onSubmit={submit} noValidate><div className="form-grid"><Field label="نام محصول" error={errors.name}><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} aria-invalid={Boolean(errors.name)} /></Field><Field label="شناسه URL" error={errors.slug}><input dir="ltr" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} aria-invalid={Boolean(errors.slug)} /></Field><Field label="هنرمند"><input value={draft.artist} onChange={(event) => setDraft({ ...draft, artist: event.target.value })} /></Field><Field label="قیمت (تومان)" error={errors.price}><input dir="ltr" inputMode="numeric" value={draft.price || ""} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value.replace(/\D/g, "")) })} aria-invalid={Boolean(errors.price)} /></Field><Field label="دسته‌بندی"><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as AdminProduct["category"] })}><option>گلدان</option><option>ظروف</option><option>مجسمه</option></select></Field><Field label="وضعیت"><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as AdminProduct["status"] })}>{Object.entries(productStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></div><Field label="توضیحات محصول" error={errors.description}><textarea rows={5} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} aria-invalid={Boolean(errors.description)} /></Field><div className="image-editor"><div className="field-label"><span>عکس‌های محصول</span><small>چند تصویر با URL اضافه کنید؛ اولین تصویر، تصویر اصلی است.</small></div><div className="image-add"><input dir="ltr" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://…" aria-label="آدرس تصویر" /><button type="button" onClick={addImage}><ImagePlus />افزودن عکس</button></div><div className="image-list">{draft.images.map((image, index) => <div key={`${image}-${index}`}><img src={image} alt="" /><span>{index === 0 ? "تصویر اصلی" : `تصویر ${number.format(index + 1)}`}</span><button type="button" onClick={() => setDraft({ ...draft, images: draft.images.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`حذف تصویر ${index + 1}`}><X /></button></div>)}{!draft.images.length && <div className="image-empty"><ImagePlus /><span>هنوز تصویری اضافه نشده است.</span></div>}</div></div><div className="dialog-actions"><button className="secondary-action" type="button" onClick={onClose}>انصراف</button><button className="primary-action" type="submit">ذخیره تغییرات</button></div></form></DialogShell>;
}

function InviteDialog({ onClose, onInvite }: { onClose: () => void; onInvite: (member: AdminMember) => void }) { const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [role, setRole] = useState<AdminRole>("viewer"); const [error, setError] = useState(""); return <DialogShell title="دعوت فرد جدید" description="نقش را متناسب با مسئولیت فرد انتخاب کنید." onClose={onClose}><form className="editor-form" noValidate onSubmit={(event) => { event.preventDefault(); if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setError("نام و ایمیل معتبر را وارد کنید."); return; } onInvite({ id: crypto.randomUUID(), name, email, role, status: "invited" }); }}><Field label="نام و نام خانوادگی"><input value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="ایمیل" error={error}><input dir="ltr" type="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(error)} /></Field><Field label="سطح دسترسی"><select value={role} onChange={(event) => setRole(event.target.value as AdminRole)}>{Object.entries(roleLabels).filter(([value]) => value !== "owner").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><div className="dialog-actions"><button className="secondary-action" type="button" onClick={onClose}>انصراف</button><button className="primary-action" type="submit">افزودن دعوت</button></div></form></DialogShell>; }

function ConfirmDialog({ title, description, onCancel, onConfirm }: { title: string; description: string; onCancel: () => void; onConfirm: () => void }) { return <DialogShell title={title} description={description} onClose={onCancel} compact><div className="dialog-actions"><button className="secondary-action" type="button" onClick={onCancel}>انصراف</button><button className="danger-action" type="button" onClick={onConfirm}>حذف محصول</button></div></DialogShell>; }

function DialogShell({ title, description, onClose, children, compact = false }: { title: string; description: string; onClose: () => void; children: React.ReactNode; compact?: boolean }) { return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`dialog ${compact ? "compact" : ""}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description"><header><div><span className="eyebrow">دفتر رَد</span><h2 id="dialog-title">{title}</h2><p id="dialog-description">{description}</p></div><button type="button" onClick={onClose} aria-label="بستن"><X /></button></header>{children}</section></div>; }
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}{error && <small className="field-error" role="alert">{error}</small>}</label>; }
function StatusBadge({ label, tone }: { label: string; tone: "green" | "muted" }) { return <span className={`status-badge ${tone}`}>{label}</span>; }
function EmptyState({ title, description }: { title: string; description: string }) { return <div className="empty-state"><Package /><h3>{title}</h3><p>{description}</p></div>; }
