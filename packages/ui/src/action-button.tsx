import type { ButtonHTMLAttributes } from "react";

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "solid" | "outline" | "ghost";
}

export function ActionButton({ tone = "solid", className = "", ...props }: ActionButtonProps) {
  const toneClass = tone === "solid" ? "bg-rad-mineral text-rad-paper" : tone === "outline" ? "border border-rad-mineral text-rad-mineral" : "text-rad-mineral";
  return <button className={`min-h-11 px-5 py-2 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${toneClass} ${className}`} {...props} />;
}
