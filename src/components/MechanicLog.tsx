"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { workshop } from "@/lib/data";
import { Icon } from "./icons";
import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { LanguageToggle } from "./LanguageToggle";
import { ServiceSelect } from "./ServiceSelect";
import { serviceCodeFromIndex, localizeServiceCode } from "@/lib/services";
import { logMechanicJob, type JobState, type MechanicEntry } from "@/lib/mechanic-actions";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

const initialState: JobState = { ok: false, error: null };

export function MechanicLog({ initialEntries }: { initialEntries: MechanicEntry[] }) {
  const { t } = useLang();
  const [state, formAction, isPending] = useActionState(logMechanicJob, initialState);
  const [serviceIdx, setServiceIdx] = useState(-1);
  const [date, setDate] = useState(todayISO);
  const [savedPlate, setSavedPlate] = useState<string | null>(null);
  // The plate text at submit time, captured before the action runs so the
  // success chip can echo it back even though the input is uncontrolled.
  const pendingPlate = useRef("");

  const serviceCode = serviceCodeFromIndex(serviceIdx) ?? "";
  const entries = initialEntries;
  const todayCount = entries.filter((e) => e.serviced_on === todayISO()).length;

  // On a successful save, surface the confirmation chip and reset the picker.
  // The revalidated server data already carries the new row into `entries`.
  useEffect(() => {
    if (!state.ok) return;
    setSavedPlate(pendingPlate.current.trim().toUpperCase());
    setServiceIdx(-1);
    setDate(todayISO());
    const timer = setTimeout(() => setSavedPlate(null), 2500);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Ταυτότητα συνεργείου + γλώσσα */}
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-base font-bold text-surface shadow-sm">
          {workshop.name.charAt(0)}
        </span>
        <div>
          <p className="text-base font-semibold tracking-tight">{workshop.name}</p>
          <p className="inline-flex items-center gap-1 text-xs text-muted">
            <Icon name="shield" className="h-3.5 w-3.5 text-positive" /> {t.mechCertified} · {t.workshopCity}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/register"
            className="hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2 sm:inline-flex"
          >
            <Icon name="shield" className="h-3.5 w-3.5 text-positive" />
            {t.registerLink}
          </Link>
          <LanguageToggle />
        </div>
      </div>

      {/* Φόρμα καταγραφής */}
      <form
        action={(formData) => {
          pendingPlate.current = String(formData.get("plate") ?? "");
          formAction(formData);
        }}
        className="mt-6 rounded-xl border bg-surface p-5"
      >
        <h1 className="text-sm font-semibold">{t.recordTitle}</h1>
        <p className="mt-0.5 text-xs text-muted">{t.mechSubtitle}</p>

        {/* Stable hidden value for the selected service code (-1 → empty). */}
        <input type="hidden" name="service_code" value={serviceCode} />

        <div className="mt-4 space-y-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t.plateLabel}</span>
            <input
              name="plate"
              placeholder={t.platePlaceholder}
              className="w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm uppercase tracking-wider outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-foreground focus:bg-surface"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1">
              <span className="mb-1 block text-xs font-medium text-muted">{t.workLabel}</span>
              <ServiceSelect
                value={serviceIdx}
                onChange={setServiceIdx}
                options={t.serviceOptions}
                placeholder={t.servicePlaceholder}
              />
            </div>
            <label>
              <span className="mb-1 block text-xs font-medium text-muted">{t.dateLabel}</span>
              <input
                type="date"
                name="serviced_on"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border bg-surface-2 px-3 py-2.5 text-sm text-muted outline-none focus:border-foreground focus:bg-surface"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || serviceIdx < 0}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? <Icon name="spinner" className="h-4 w-4" /> : <Icon name="plus" className="h-4 w-4" />}
          {t.mechRecordBtn}
        </button>

        {state.ok && savedPlate && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-positive/10 px-3 py-1.5 text-xs font-medium text-positive">
            <Icon name="shield" className="h-3.5 w-3.5" /> {t.recordedTo(savedPlate)}
          </p>
        )}
        {state.error === "plate" && (
          <p role="alert" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-negative/10 px-3 py-1.5 text-xs font-medium text-negative">
            {t.errPlate}
          </p>
        )}
        {state.error && state.error !== "plate" && (
          <p role="alert" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-negative/10 px-3 py-1.5 text-xs font-medium text-negative">
            {t.errSave}
          </p>
        )}
      </form>

      {/* Πρόσφατες καταγραφές */}
      <div className="mt-8 flex items-center gap-2 px-1">
        <h2 className="text-sm font-semibold">{t.recentTitle}</h2>
        <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium tabular-nums text-accent">
          {t.jobsToday(todayCount)}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="mt-3 grid place-items-center rounded-xl border border-dashed bg-surface py-12 text-center">
          <Icon name="wrench" className="h-7 w-7 text-muted" />
          <p className="mt-3 text-sm font-medium">{t.recentEmpty}</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 rounded-xl border bg-surface px-4 py-3 transition-colors hover:border-foreground/20">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent ring-1 ring-accent/15">
                <Icon name="wrench" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{localizeServiceCode(entry.service_code, t.serviceOptions)}</p>
                <p className="font-mono text-[11px] tracking-wider text-muted">{entry.plate}</p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted">{formatDate(entry.serviced_on)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
