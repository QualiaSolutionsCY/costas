"use client";

import { useState } from "react";
import { workshop, type WorkLog } from "@/lib/data";
import { Icon } from "./icons";
import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { LanguageToggle } from "./LanguageToggle";
import { ServiceSelect } from "./ServiceSelect";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export function MechanicLog() {
  const { t } = useLang();
  const [added, setAdded] = useState<WorkLog[]>([]);
  const [plate, setPlate] = useState("");
  const [serviceIdx, setServiceIdx] = useState(-1);
  const [date, setDate] = useState(todayISO);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const seed: WorkLog[] = t.mechanicSeed.map((s, i) => ({ id: `seed-${i}`, ...s }));
  const entries = [...added, ...seed].sort((a, b) => b.date.localeCompare(a.date));

  function addEntry(e: React.FormEvent) {
    e.preventDefault();
    const p = plate.trim().toUpperCase();
    const w = serviceIdx >= 0 ? t.serviceOptions[serviceIdx] : "";
    if (!p || !w) return;
    setAdded((prev) => [{ id: String(Date.now()), date: date || todayISO(), plate: p, work: w }, ...prev]);
    setPlate("");
    setServiceIdx(-1);
    setJustAdded(p);
    setTimeout(() => setJustAdded(null), 2500);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Ταυτότητα συνεργείου + γλώσσα */}
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-foreground text-base font-bold text-surface">
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
      <form onSubmit={addEntry} className="mt-6 rounded-xl border bg-surface p-5">
        <h1 className="text-sm font-semibold">{t.recordTitle}</h1>
        <p className="mt-0.5 text-xs text-muted">{t.mechSubtitle}</p>

        <div className="mt-4 space-y-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t.plateLabel}</span>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border bg-surface-2 px-3 py-2.5 text-sm text-muted outline-none focus:border-foreground focus:bg-surface"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={!plate.trim() || serviceIdx < 0}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="plus" className="h-4 w-4" />
          {t.mechRecordBtn}
        </button>

        {justAdded && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-positive/10 px-3 py-1.5 text-xs font-medium text-positive">
            <Icon name="shield" className="h-3.5 w-3.5" /> {t.recordedTo(justAdded)}
          </p>
        )}
      </form>

      {/* Πρόσφατες καταγραφές */}
      <h2 className="mt-8 px-1 text-sm font-semibold">{t.recentTitle}</h2>
      <ul className="mt-3 space-y-2">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 rounded-xl border bg-surface px-4 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-surface-2 text-foreground/60">
              <Icon name="wrench" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.work}</p>
              <p className="font-mono text-[11px] tracking-wider text-muted">{entry.plate}</p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted">{formatDate(entry.date)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
