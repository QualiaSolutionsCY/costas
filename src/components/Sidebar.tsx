"use client";

import { navItems, type NavKey } from "@/lib/data";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";

export function Sidebar({ active, onSelect }: { active: NavKey; onSelect: (key: NavKey) => void }) {
  const { t } = useLang();
  return (
    <div className="flex h-full w-64 flex-col bg-surface px-4 py-5">
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground text-base font-bold text-surface">C</div>
        <div className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">Costas</span>
          <span className="block text-[11px] text-muted">{t.tagline}</span>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              active === item.key
                ? "bg-surface-2 font-medium text-foreground"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            <Icon name={item.icon} />
            {t.nav[item.key]}
          </button>
        ))}
      </nav>

      <p className="mt-auto px-2 text-[11px] leading-relaxed text-muted">{t.sidebarNote}</p>
    </div>
  );
}
