"use client";

import { useState } from "react";
import { car, type LogEntry } from "@/lib/data";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";
import { ServiceSelect } from "./ServiceSelect";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export function ServiceLog() {
  const { t } = useLang();
  const [added, setAdded] = useState<LogEntry[]>([]);
  const [serviceIdx, setServiceIdx] = useState(-1);
  const [date, setDate] = useState(todayISO);

  const seed: LogEntry[] = t.seedLog.map((s, i) => ({ id: `seed-${i}`, ...s }));
  const entries = [...added, ...seed].sort((a, b) => b.date.localeCompare(a.date));

  function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (serviceIdx < 0) return;
    const note = t.serviceOptions[serviceIdx];
    setAdded((prev) => [{ id: String(Date.now()), date: date || todayISO(), note }, ...prev]);
    setServiceIdx(-1);
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Όχημα */}
      <div className="flex items-center gap-3 rounded-xl border bg-surface p-4">
        <span className="grid h-11 w-11 place-items-center rounded-lg border bg-surface-2 text-foreground/70">
          <Icon name="car" />
        </span>
        <div>
          <p className="text-sm font-semibold">{car.model}</p>
          <p className="font-mono text-xs tracking-wider text-muted">{car.plate}</p>
        </div>
        <span className="ml-auto text-xs text-muted">{t.entries(entries.length)}</span>
      </div>

      {/* Καταγραφή νέου σέρβις */}
      <form onSubmit={addEntry} className="mt-4 rounded-xl border bg-surface p-4">
        <h2 className="text-sm font-semibold">{t.recordTitle}</h2>
        <p className="mt-0.5 text-xs text-muted">{t.recordSubtitle}</p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <ServiceSelect
            className="min-w-0 flex-1"
            value={serviceIdx}
            onChange={setServiceIdx}
            options={t.serviceOptions}
            placeholder={t.servicePlaceholder}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border bg-surface-2 px-3 py-2.5 text-sm text-muted outline-none focus:border-foreground focus:bg-surface"
          />
        </div>

        <button
          type="submit"
          disabled={serviceIdx < 0}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="plus" className="h-4 w-4" />
          {t.recordBtn}
        </button>
      </form>

      {/* Ιστορικό */}
      <h2 className="mt-6 px-1 text-sm font-semibold">{t.historyTitle}</h2>
      <ol className="mt-3">
        {entries.map((entry, i) => {
          const last = i === entries.length - 1;
          return (
            <li key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
              {!last && <span className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-border" />}
              <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-surface-2 text-foreground/60">
                <Icon name="wrench" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 rounded-xl border bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{entry.note ?? "—"}</p>
                  <span className="shrink-0 text-xs tabular-nums text-muted">{formatDate(entry.date)}</span>
                </div>
                {entry.place && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
                    <Icon name="pin" /> {entry.place}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
