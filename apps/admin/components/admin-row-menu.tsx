"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

const GAP = 6;
const EDGE = 8;

function menuPosition(trigger: DOMRect, menu: DOMRect) {
  const viewport = window.visualViewport;
  const vw = viewport?.width ?? window.innerWidth;
  const vh = viewport?.height ?? window.innerHeight;
  const vx = viewport?.offsetLeft ?? 0;
  const vy = viewport?.offsetTop ?? 0;
  const rtl = document.documentElement.dir === "rtl";

  let top = trigger.bottom + GAP;
  if (top + menu.height > vy + vh - EDGE) {
    top = trigger.top - menu.height - GAP;
  }
  top = Math.max(vy + EDGE, Math.min(top, vy + vh - menu.height - EDGE));

  let left = rtl ? trigger.right - menu.width : trigger.left;
  left = Math.max(vx + EDGE, Math.min(left, vx + vw - menu.width - EDGE));
  return { top, left };
}

export function AdminRowMenu({
  open,
  onToggle,
  onClose,
  canWrite,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  const place = () => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    setCoords(
      menuPosition(
        trigger.getBoundingClientRect(),
        menu.getBoundingClientRect(),
      ),
    );
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    window.visualViewport?.addEventListener("resize", onScroll);
    window.visualViewport?.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
      window.visualViewport?.removeEventListener("resize", onScroll);
      window.visualViewport?.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const buttons = menu?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      if (!buttons?.length) return;
      event.preventDefault();
      const items = Array.from(buttons);
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === "ArrowDown"
          ? items[(index + 1) % items.length]
          : items[(index - 1 + items.length) % items.length];
      next.focus();
    };
    const onPointer = (event: MouseEvent | PointerEvent) => {
      const target = event.target as Node | null;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, onClose]);

  return (
    <div className="row-menu-anchor">
      <button
        ref={triggerRef}
        className="row-menu-trigger"
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="عملیات"
      >
        <MoreVertical />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="row-menu"
            role="menu"
            style={
              coords
                ? { top: coords.top, left: coords.left }
                : { top: 0, left: 0, visibility: "hidden" }
            }
          >
            <button
              type="button"
              role="menuitem"
              onClick={onEdit}
              disabled={!canWrite}
            >
              <Pencil />
              ویرایش
            </button>
            <button
              type="button"
              role="menuitem"
              className="danger"
              onClick={onDelete}
              disabled={!canWrite}
            >
              <Trash2 />
              حذف
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
