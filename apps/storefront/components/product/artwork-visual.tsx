import "./artwork.css";
import { Vessel } from "./vessel";
import type { ProductShape, ProductVisual } from "@rad/types";

export function ArtworkVisual({
  visual = "vessel",
  color,
  accent,
  shape = "round",
  className = "",
}: {
  visual?: ProductVisual;
  color: string;
  accent: string;
  shape?: ProductShape;
  className?: string;
}) {
  if (visual === "vessel")
    return <Vessel product={{ color, accent, shape }} className={className} />;

  return (
    <div
      className={`mock-artwork ${visual} ${className}`}
      style={
        {
          "--art-color": color,
          "--art-accent": accent,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <span />
      <i />
    </div>
  );
}
