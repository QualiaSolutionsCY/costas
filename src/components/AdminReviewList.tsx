"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useLang } from "@/components/LanguageProvider";
import { Icon } from "@/components/icons";
import { approveWorkshop, rejectWorkshop } from "@/lib/admin-actions";

export type AdminWorkshop = {
  id: string;
  name: string;
  serial: string;
  created_at: string;
  certUrl: string | null;
};

const noopState = { ok: false, error: null };

/**
 * Review list of workshops awaiting verification. Receives plain, already-signed
 * data from the server component (no Supabase access here) and renders it
 * bilingually via useLang(). Each row carries Approve / Reject controls wired to
 * the admin server actions; useOptimistic drops a reviewed row from the list
 * immediately so the queue shrinks without a full page reload (VERIF-03/04).
 */
export function AdminReviewList({ workshops }: { workshops: AdminWorkshop[] }) {
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState(false);

  // Optimistically remove a reviewed row; the revalidated server list arrives
  // on the next render and reconciles.
  const [optimistic, removeOptimistic] = useOptimistic(
    workshops,
    (state, removedId: string) => state.filter((w) => w.id !== removedId),
  );

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "el" ? "el-GR" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  function onApprove(id: string) {
    setActionError(false);
    const fd = new FormData();
    fd.set("workshopId", id);
    startTransition(() => {
      removeOptimistic(id);
      void approveWorkshop(noopState, fd).then((res) => {
        if (res && !res.ok) setActionError(true);
      });
    });
  }

  function onConfirmReject(id: string) {
    const trimmed = reason.trim();
    if (!trimmed) return;
    setActionError(false);
    const fd = new FormData();
    fd.set("workshopId", id);
    fd.set("reason", trimmed);
    setRejectingId(null);
    setReason("");
    startTransition(() => {
      removeOptimistic(id);
      void rejectWorkshop(noopState, fd).then((res) => {
        if (res && !res.ok) setActionError(true);
      });
    });
  }

  function startReject(id: string) {
    setRejectingId(id);
    setReason("");
  }

  function cancelReject() {
    setRejectingId(null);
    setReason("");
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{t.adminTitle}</h2>
          <p className="text-xs text-muted">{t.adminSubtitle}</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent tabular-nums">
          {t.adminPending(optimistic.length)}
        </span>
      </div>

      {actionError ? (
        <p role="alert" className="rounded-lg bg-negative/10 px-3 py-2 text-xs font-medium text-negative">
          {t.errSave}
        </p>
      ) : null}

      {optimistic.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-surface px-4 py-12 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted">
            <Icon name="shield" />
          </span>
          <p className="text-sm text-muted">{t.adminEmpty}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {optimistic.map((w) => (
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

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
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

                {rejectingId === w.id ? (
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      name="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t.rejectReason}
                      maxLength={200}
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-foreground focus:bg-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onConfirmReject(w.id)}
                        disabled={!reason.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-negative/10 px-3 py-2 text-xs font-medium text-negative transition-colors hover:bg-negative/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon name="close" className="h-3.5 w-3.5" />
                        {t.confirmReject}
                      </button>
                      <button
                        type="button"
                        onClick={cancelReject}
                        className="rounded-lg border px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-2"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onApprove(w.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-positive/30 bg-positive/10 px-3 py-1.5 text-xs font-medium text-positive transition-colors hover:bg-positive/20"
                    >
                      <Icon name="check" className="h-3.5 w-3.5" />
                      {t.approve}
                    </button>
                    <button
                      type="button"
                      onClick={() => startReject(w.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-negative transition-colors hover:bg-negative/10"
                    >
                      <Icon name="close" className="h-3.5 w-3.5" />
                      {t.reject}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
