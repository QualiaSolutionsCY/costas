"use client";

import { useLang } from "./LanguageProvider";
import { Icon } from "./icons";

export type WorkshopStatus = "verified" | "pending" | "rejected";

const STYLES: Record<WorkshopStatus, string> = {
  verified: "bg-positive/10 text-positive",
  pending: "bg-surface-2 text-muted",
  rejected: "bg-negative/10 text-negative",
};

/**
 * The single certified/pending/rejected chip primitive. Reused on every
 * workshop surface (mechanic header, owner hero, owner history) so the three
 * states never drift apart. Bilingual via useLang(), tokens only.
 */
export function WorkshopBadge({
  status,
  className,
}: {
  status: WorkshopStatus;
  className?: string;
}) {
  const { t } = useLang();

  const label =
    status === "verified"
      ? t.certified
      : status === "pending"
        ? t.pendingReview
        : t.rejected;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${STYLES[status]} ${className ?? ""}`}
    >
      <Icon name="shield" className="h-3 w-3" /> {label}
    </span>
  );
}
