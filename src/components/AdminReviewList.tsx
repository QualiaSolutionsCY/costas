"use client";

import { useLang } from "@/components/LanguageProvider";
import { Icon } from "@/components/icons";

export type AdminWorkshop = {
  id: string;
  name: string;
  serial: string;
  created_at: string;
  certUrl: string | null;
};

/**
 * Read-only review list of workshops awaiting verification. Receives plain,
 * already-signed data from the server component (no Supabase access here) and
 * renders it bilingually via useLang(). Approve/reject actions land in Phase 2;
 * this surface intentionally lists only.
 */
export function AdminReviewList({ workshops }: { workshops: AdminWorkshop[] }) {
  const { t, lang } = useLang();

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{t.adminTitle}</h2>
          <p className="text-xs text-muted">{t.adminSubtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent tabular-nums">
          {t.adminPending(workshops.length)}
        </span>
      </div>

      {workshops.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-surface px-4 py-12 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted">
            <Icon name="shield" />
          </span>
          <p className="text-sm text-muted">{t.adminEmpty}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {workshops.map((w) => (
            <li key={w.id} className="rounded-xl border bg-surface p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon name="shield" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{w.name}</p>
                  <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                    <div className="flex items-center gap-1.5">
                      <dt className="font-medium">{t.adminSerial}</dt>
                      <dd className="font-mono tabular-nums">{w.serial}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <dt className="font-medium">{t.adminRegistered}</dt>
                      <dd className="font-mono tabular-nums">{fmtDate(w.created_at)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-3 border-t pt-3">
                {w.certUrl ? (
                  <a
                    href={w.certUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
                  >
                    <Icon name="file" className="h-3.5 w-3.5 text-accent" />
                    {t.adminCert}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <Icon name="file" className="h-3.5 w-3.5" />
                    {t.adminNoCert}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
