"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";
import type { OwnerVehicle } from "@/lib/owner-actions";
import type { NavKey } from "@/lib/data";
import type { Translation } from "@/lib/i18n";

/** "My Vehicles" surface — every tracked vehicle, one card row each. */
function VehiclesPanel({
  t,
  onOpenLog,
  vehicles,
}: {
  t: Translation;
  onOpenLog: () => void;
  vehicles: OwnerVehicle[];
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="px-1">
        <h2 className="text-base font-semibold tracking-tight">{t.nav.vehicles}</h2>
        <p className="mt-0.5 text-xs text-muted">{t.vehiclesSubtitle}</p>
      </div>

      {vehicles.length === 0 ? (
        <div className="mt-4 grid place-items-center rounded-xl border border-dashed bg-surface py-12 text-center">
          <Icon name="car" className="h-7 w-7 text-muted" />
          <p className="mt-3 text-sm font-medium">{t.historyEmpty}</p>
          <button
            onClick={onOpenLog}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
          >
            <Icon name="plus" className="h-4 w-4" />
            {t.addVehicle}
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {vehicles.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-3 rounded-xl border border-accent/15 bg-accent-soft p-4"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-surface shadow-sm">
                <Icon name="car" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{v.model ?? "—"}</p>
                <p className="font-mono text-xs tracking-wider text-muted">{v.plate}</p>
              </div>
              <button
                onClick={onOpenLog}
                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-surface transition-opacity hover:opacity-90"
              >
                {t.openLog}
                <Icon name="chevron" className="h-3.5 w-3.5 -rotate-90" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AppShell({
  children,
  vehicles,
  reminderCount,
}: {
  children: React.ReactNode;
  vehicles: OwnerVehicle[];
  reminderCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<NavKey>("log");
  const { t } = useLang();
  const router = useRouter();

  function select(key: NavKey) {
    // Settings is a real route now (/settings) — navigate there instead of
    // swapping an inline panel, so the deep-link and back/forward both work.
    if (key === "settings") {
      router.push("/settings");
      setOpen(false);
      return;
    }
    if (key === "book") {
      router.push("/book");
      setOpen(false);
      return;
    }
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
        <Topbar reminderCount={reminderCount} onMenu={() => setOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8">
          {active === "vehicles" ? (
            <VehiclesPanel t={t} onOpenLog={() => select("log")} vehicles={vehicles} />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
