"use client";

import { useState } from "react";
import { car, type LogEntry } from "@/lib/data";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";
import { ServiceSelect } from "./ServiceSelect";
import { useInitialLoad } from "@/lib/useInitialLoad";
import { TimelineSkeleton } from "./Skeleton";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export function ServiceLog() {
  const { t } = useLang();
  const loading = useInitialLoad();
  const [added, setAdded] = useState<LogEntry[]>([]);
  const [serviceIdx, setServiceIdx] = useState(-1);
  const [date, setDate] = useState(todayISO);
  const [justAdded, setJustAdded] = useState(false);

  const seed: LogEntry[] = t.seedLog.map((s, i) => ({ id: `seed-${i}`, ...s }));
  const entries = [...added, ...seed].sort((a, b) => b.date.localeCompare(a.date));
  const lastServiced = entries[0]?.date;

  function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (serviceIdx < 0) return;
    const note = t.serviceOptions[serviceIdx];
    setAdded((prev) => [{ id: String(Date.now()), date: date || todayISO(), note }, ...prev]);
    setServiceIdx(-1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Όχημα */}
      <div className="rounded-xl border border-accent/15 bg-accent-soft p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-surface shadow-sm">
            <Icon name="car" />
          </span>
          <div>
            <p className="text-sm font-semibold">{car.model}</p>
            <p className="font-mono text-xs tracking-wider text-muted">{car.plate}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 self-start rounded-full bg-positive/10 px-2 py-0.5 text-[11px] font-medium text-positive">
            <Icon name="shield" className="h-3 w-3" /> {t.mechCertified}
          </span>
        </div>
        {/* Στατιστικά με μια ματιά */}
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
          <div className="bg-surface px-3 py-2">
            <dt className="text-[11px] text-muted">{t.statServices}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">
              {loading ? "—" : entries.length}
            </dd>
          </div>
          <div className="bg-surface px-3 py-2">
            <dt className="text-[11px] text-muted">{t.statLast}</dt>
            <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
              {loading || !lastServiced ? t.statNone : formatDate(lastServiced)}
            </dd>
          </div>
        </dl>
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

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={serviceIdx < 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="plus" className="h-4 w-4" />
            {t.recordBtn}
          </button>
          {justAdded && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-positive/10 px-3 py-1.5 text-xs font-medium text-positive [animation:popIn_.12s_ease-out]">
              <Icon name="check" className="h-3.5 w-3.5" /> {t.recordedOwn}
            </span>
          )}
        </div>
      </form>

      {/* Ιστορικό */}
      <h2 className="mt-6 flex items-center gap-1.5 px-1 text-sm font-semibold">
        <Icon name="history" className="h-4 w-4 text-muted" />
        {t.historyTitle}
      </h2>

      {loading ? (
        <TimelineSkeleton />
      ) : entries.length === 0 ? (
        <div className="mt-3 grid place-items-center rounded-xl border border-dashed bg-surface py-12 text-center">
          <Icon name="wrench" className="h-7 w-7 text-muted" />
          <p className="mt-3 text-sm font-medium">{t.historyEmpty}</p>
          <p className="mt-1 text-xs text-muted">{t.historyEmptyHint}</p>
        </div>
      ) : (
        <ol className="mt-3">
          {entries.map((entry, i) => {
            const last = i === entries.length - 1;
            return (
              <li key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                {!last && <span className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-border" />}
                <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent ring-1 ring-accent/15">
                  <Icon name="wrench" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 rounded-xl border bg-surface px-4 py-3 transition-colors hover:border-foreground/20">
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
      )}
    </div>
  );
}
