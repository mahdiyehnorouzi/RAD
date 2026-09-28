import { RadFingerprint } from "@/components/identity";

/** The work's own print, pressed faintly into the corner of the label. */
export function ProductCardPrint({ radNumber }: { radNumber?: number }) {
  if (!radNumber) return null;
  return (
    <RadFingerprint
      radNumber={radNumber}
      density="field"
      className="rad-card-print"
      animate
    />
  );
}
