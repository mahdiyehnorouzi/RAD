import { STUDIO_ICONS, type StudioIconName, type StudioIconShape } from "./const/icon-shapes";

function paintProps(shape: StudioIconShape, width: number) {
  if (shape.paint === "solid") return { fill: "currentColor", stroke: "none" };
  if (shape.paint === "knock")
    return { fill: "none", stroke: "var(--icon-knock, #f5efe4)", strokeWidth: width };
  return { fill: "none", stroke: "currentColor", strokeWidth: shape.width ?? width };
}

export function StudioIcon({
  name,
  size = 20,
  className,
}: {
  name: StudioIconName;
  size?: number;
  className?: string;
}) {
  const icon = STUDIO_ICONS[name];
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icon.shapes.map((shape: StudioIconShape, index) =>
        "d" in shape ? (
          <path key={index} d={shape.d} {...paintProps(shape, icon.width)} />
        ) : (
          <circle
            key={index}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            {...paintProps(shape, icon.width)}
          />
        ),
      )}
    </svg>
  );
}

/** Arrow pointing in the reading direction (forward) or against it (back). */
export function readingArrow(locale: "fa" | "en", way: "forward" | "back"): StudioIconName {
  const forward = locale === "fa" ? "arrow_left" : "arrow_right";
  const back = locale === "fa" ? "arrow_right" : "arrow_left";
  return way === "forward" ? forward : back;
}
