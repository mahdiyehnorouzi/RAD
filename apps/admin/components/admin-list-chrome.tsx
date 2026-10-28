"use client";

import { Package } from "lucide-react";

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "oxide" | "sand" | "muted";
}) {
  return <span className={`status-badge ${tone}`}>{label}</span>;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <Package />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
