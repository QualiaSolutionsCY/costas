"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";
import { LanguageToggle } from "./LanguageToggle";
import { car } from "@/lib/data";
import type { NavKey } from "@/lib/data";
import type { Translation } from "@/lib/i18n";

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/** Real "My Vehicles" surface — the tracked vehicle with its at-a-glance stats. */
function VehiclesPanel({ t, onOpenLog }: { t: Translation; onOpenLog: () => void }) {
  const count = t.seedLog.length;
  const last = t.seedLog.map((s) => s.date).sort((a, b) => b.localeCompare(a))[0];
  return (
    <div className="mx-auto max-w-2xl">
      <div className="px-1">
        <h2 className="text-base font-semibold tracking-tight">{t.nav.vehicles}</h2>
        <p className="mt-0.5 text-xs text-muted">{t.vehiclesSubtitle}</p>
      </div>
      <div className="mt-4 rounded-xl border border-accent/15 bg-accent-soft p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-surface shadow-sm">
            <Icon name="car" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{car.model}</p>
            <p className="font-mono text-xs tracking-wider text-muted">{car.plate}</p>
          </div>
          <button
            onClick={onOpenLog}
            className="ml-auto inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-surface transition-opacity hover:opacity-90"
          >
            {t.openLog}
            <Icon name="chevron" className="h-3.5 w-3.5 -rotate-90" />
          </button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
          <div className="bg-surface px-3 py-2">
            <dt className="text-[11px] text-muted">{t.statServices}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{count}</dd>
          </div>
          <div className="bg-surface px-3 py-2">
            <dt className="text-[11px] text-muted">{t.statLast}</dt>
            <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
              {last ? formatDate(last) : t.statNone}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/** Honest Settings surface — language preference + about. No fake toggles. */
function SettingsPanel({ t }: { t: Translation }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="px-1">
        <h2 className="text-base font-semibold tracking-tight">{t.nav.settings}</h2>
        <p className="mt-0.5 text-xs text-muted">{t.settingsSubtitle}</p>
      </div>
      <div className="mt-4 divide-y rounded-xl border bg-surface">
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="inline-flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent ring-1 ring-accent/15">
              <Icon name="message" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium">{t.prefLanguage}</p>
              <p className="text-xs text-muted">{t.prefLanguageHint}</p>
            </div>
          </div>
          <LanguageToggle />
        </div>
        <div className="flex items-center gap-2.5 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
            <Icon name="shield" className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium">{t.settingsAbout}</p>
            <p className="text-xs text-muted">{t.settingsAboutText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<NavKey>("log");
  const { t } = useLang();

  function select(key: NavKey) {
    setActive(key);
    setOpen(false);
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 border-r lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar active={active} onSelect={select} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 border-r shadow-xl animate-[slideIn_.2s_ease-out]">
            <button
              aria-label="✕"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
            >
              <Icon name="close" />
            </button>
            <Sidebar active={active} onSelect={select} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8">
          {active === "log" ? (
            children
          ) : active === "vehicles" ? (
            <VehiclesPanel t={t} onOpenLog={() => select("log")} />
          ) : (
            <SettingsPanel t={t} />
          )}
        </main>
      </div>
    </div>
  );
}
