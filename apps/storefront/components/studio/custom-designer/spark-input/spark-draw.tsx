"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { useLocale } from "@/components/i18n";

export function SparkDraw({
  sketch,
  onChange,
}: {
  sketch: string;
  onChange: (value: string) => void;
}) {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const box = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = box.width * ratio;
    canvas.height = box.height * ratio;
    context.scale(ratio, ratio);
    context.fillStyle = "#f7f2e9";
    context.fillRect(0, 0, box.width, box.height);
    context.strokeStyle = "#18231f";
    context.lineWidth = 2.4;
    context.lineCap = "round";
    if (sketch) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, box.width, box.height);
      image.src = sketch;
    }
  }, [sketch]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function persist() {
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  }

  return (
    <div className="spark-draw">
      <p>{t("designerDrawHint")}</p>
      <canvas
        ref={canvasRef}
        onPointerDown={(event) => {
          const context = event.currentTarget.getContext("2d");
          if (!context) return;
          drawing.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          const next = point(event);
          context.beginPath();
          context.moveTo(next.x, next.y);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const context = event.currentTarget.getContext("2d");
          if (!context) return;
          const next = point(event);
          context.lineTo(next.x, next.y);
          context.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
          persist();
        }}
      />
      <button type="button" className="button outline" onClick={() => onChange("")}>
        {t("designerDrawClear")}
      </button>
    </div>
  );
}
