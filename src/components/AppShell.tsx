"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";
import type { NavKey } from "@/lib/data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<NavKey>("log");
  const { t, lang } = useLang();

  function select(key: NavKey) {
    setActive(key);
    setOpen(false);
  }

  const placeholderLabel = active === "vehicles" ? t.nav.vehicles : t.nav.settings;

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
          ) : (
            <div className="mx-auto grid max-w-2xl place-items-center rounded-xl border border-dashed bg-surface py-20 text-center">
              <Icon name={active === "vehicles" ? "car" : "settings"} className="h-8 w-8 text-muted" />
              <p className="mt-3 text-sm font-semibold">{placeholderLabel}</p>
              <p className="mt-1 text-xs text-muted">{lang === "el" ? "Σύντομα διαθέσιμο" : "Coming soon"}</p>
            </div>
          )}
        </main>
      </div>

      <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );
}
