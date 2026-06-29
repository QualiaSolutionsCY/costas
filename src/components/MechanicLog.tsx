"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { workshop } from "@/lib/data";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";
import { LanguageToggle } from "./LanguageToggle";
import { CarDiagram, type CarPart } from "./CarDiagram";
import { RowSkeleton } from "./Skeleton";
import { WorkshopBadge, type WorkshopStatus } from "./WorkshopBadge";
import { localizeServiceCode, type ServiceCode } from "@/lib/services";
import {
  logMechanicJob,
  getPlateHistory,
  type JobState,
  type MechanicEntry,
} from "@/lib/mechanic-actions";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

// Part → service code. Single-part jobs map to their specific service; mixed
// jobs (2+) resolve to a full service. Kept beside the component because it IS
// the demo's "smart suggestion" — the thing the salesperson points at.
const PART_TO_SERVICE: Record<CarPart, ServiceCode> = {
  wheels: "tyres",
  brakes: "brakes",
  engine: "service_oil",
  body: "bodywork",
  lights: "diagnostic",
  windshield: "other",
  suspension: "alignment",
  exhaust: "other",
};

function deriveService(parts: string[]): ServiceCode | "" {
  if (parts.length === 0) return "";
  if (parts.length === 1) return PART_TO_SERVICE[parts[0] as CarPart];
  return "full_service";
}

const initialState: JobState = { ok: false, error: null };

export function MechanicLog({
  workshopStatus,
}: {
  workshopStatus?: WorkshopStatus;
}) {
  const { t } = useLang();
  const [state, formAction, isPending] = useActionState(
    logMechanicJob,
    initialState,
  );

  const [plate, setPlate] = useState("");
  const [parts, setParts] = useState<string[]>([]);
  const [date, setDate] = useState(todayISO);
  const [saved, setSaved] = useState(false);

  const [history, setHistory] = useState<MechanicEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isLoadingHistory, startHistoryLoad] = useTransition();

  const trimmedPlate = plate.trim();
  const hasPlate = trimmedPlate.length > 0;
  const derived = deriveService(parts);

  // Load the plate's history whenever the normalized plate stops changing. A
  // 350ms timer delays the fetch so typing doesn't fire a request per keystroke.
  // A ref tracks the plate the latest request was for, so a stale response can't
  // clobber newer state.
  const requestedPlate = useRef("");
  useEffect(() => {
    if (!hasPlate) {
      setHistory([]);
      setHistoryLoaded(false);
      return;
    }
    const target = trimmedPlate.toUpperCase();
    const id = setTimeout(() => {
      requestedPlate.current = target;
      setHistoryLoaded(false);
      startHistoryLoad(async () => {
        const rows = await getPlateHistory(target);
        if (requestedPlate.current === target) {
          setHistory(rows);
          setHistoryLoaded(true);
        }
      });
    }, 350);
    return () => clearTimeout(id);
  }, [trimmedPlate, hasPlate]);

  // On a successful save: confirm, clear the tapped parts, reset the date, and
  // refetch this plate's history so the new row appears immediately.
  useEffect(() => {
    if (!state.ok) return;
    setSaved(true);
    setParts([]);
    setDate(todayISO());
    const target = trimmedPlate.toUpperCase();
    if (target) {
      requestedPlate.current = target;
      startHistoryLoad(async () => {
        const rows = await getPlateHistory(target);
        if (requestedPlate.current === target) {
          setHistory(rows);
          setHistoryLoaded(true);
        }
      });
    }
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function toggle(part: string) {
    setSaved(false);
    setParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part],
    );
  }

  const canRegister = hasPlate && parts.length > 0 && !isPending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* ───── Workshop identity + view switch + language ───── */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-base font-bold text-surface shadow-sm">
          {workshop.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight">
            {workshop.name}
          </p>
          {workshopStatus ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted">
              <WorkshopBadge status={workshopStatus} /> · {t.workshopCity}
            </p>
          ) : (
            <p className="inline-flex items-center gap-1 text-xs text-muted">
              <Icon name="shield" className="h-3.5 w-3.5 text-positive" />{" "}
              {t.mechCertified} · {t.workshopCity}
            </p>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Owner ⇄ Mechanic segmented toggle — mobile + desktop */}
          <div className="inline-flex items-center rounded-lg border p-0.5">
            <Link
              href="/"
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              {t.ownerView}
            </Link>
            <span
              aria-current="page"
              className="rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-surface"
            >
              {t.mechanicView}
            </span>
          </div>
          <LanguageToggle />
        </div>

        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
        >
          <Icon name="shield" className="h-3.5 w-3.5 text-positive" />
          {t.registerLink}
        </Link>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
        >
          <Icon name="calendar" className="h-3.5 w-3.5" />
          {t.incomingTitle}
        </Link>
      </div>

      {/* ───── Step 1: plate ───── */}
      <div className="mt-6 rounded-xl border bg-surface p-5">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            {t.plateLabel}
          </span>
          <input
            name="plate-display"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder={t.platePlaceholder}
            autoComplete="off"
            className="w-full rounded-lg border bg-surface-2 px-3 py-3 text-lg font-medium uppercase tracking-wider placeholder:text-base placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-foreground focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </label>

        {!hasPlate && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
            <Icon name="car" className="h-3.5 w-3.5" />
            {t.plateFirstHint}
          </p>
        )}

        {/* ───── Step 2: visual car ───── */}
        {hasPlate && (
          <div className="mt-5">
            <h2 className="text-sm font-semibold">{t.tapWhatYouFixed}</h2>

            <div className="mt-3 rounded-xl border bg-surface-2/40 p-4">
              <CarDiagram selected={parts} onToggle={toggle} />
            </div>

            {/* Suggested service */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border bg-surface-2 px-4 py-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                <Icon name="wrench" className="h-3.5 w-3.5" />
                {t.suggestedService}
              </span>
              <span
                className={`text-sm font-semibold ${
                  derived ? "text-accent" : "text-muted"
                }`}
              >
                {derived
                  ? localizeServiceCode(derived, t.serviceOptions)
                  : "—"}
              </span>
            </div>

            {/* Date + register */}
            <form
              action={formAction}
              className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="plate" value={trimmedPlate} />
              <input type="hidden" name="service_code" value={derived} />
              <input type="hidden" name="serviced_on" value={date} />

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">
                  {t.dateLabel}
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-lg border bg-surface-2 px-3 py-2.5 text-sm text-muted focus:border-foreground focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                />
              </label>

              <button
                type="submit"
                disabled={!canRegister}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:ml-auto"
              >
                {isPending ? (
                  <Icon name="spinner" className="h-4 w-4" />
                ) : (
                  <Icon name="check" className="h-4 w-4" />
                )}
                {t.registerJob}
              </button>
            </form>

            {saved && state.ok && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-positive/10 px-3 py-1.5 text-xs font-medium text-positive">
                <Icon name="check" className="h-3.5 w-3.5" />
                {t.recordedTo(trimmedPlate)}
              </p>
            )}
            {state.error === "plate" && (
              <p
                role="alert"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-negative/10 px-3 py-1.5 text-xs font-medium text-negative"
              >
                {t.errPlate}
              </p>
            )}
            {state.error && state.error !== "plate" && (
              <p
                role="alert"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-negative/10 px-3 py-1.5 text-xs font-medium text-negative"
              >
                {t.errSave}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ───── Car history ───── */}
      {hasPlate && (
        <div className="mt-8">
          <div className="flex items-center gap-2 px-1">
            <Icon name="history" className="h-4 w-4 text-muted" />
            <h2 className="text-sm font-semibold">{t.carHistory}</h2>
            <span className="font-mono text-[11px] tracking-wider text-muted">
              {trimmedPlate}
            </span>
          </div>

          {isLoadingHistory || !historyLoaded ? (
            <RowSkeleton rows={3} />
          ) : history.length === 0 ? (
            <div className="mt-3 grid place-items-center rounded-xl border border-dashed bg-surface py-12 text-center">
              <Icon name="wrench" className="h-7 w-7 text-muted" />
              <p className="mt-3 text-sm font-medium">{t.recentEmpty}</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl border bg-surface px-4 py-3 transition-colors hover:border-foreground/20"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent ring-1 ring-accent/15">
                    <Icon name="wrench" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {localizeServiceCode(entry.service_code, t.serviceOptions)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {formatDate(entry.serviced_on)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
