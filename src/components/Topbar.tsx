"use client";

import Link from "next/link";
import { car } from "@/lib/data";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";
import { LanguageToggle } from "./LanguageToggle";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-surface/85 px-4 py-3 backdrop-blur lg:px-6">
      <button
        onClick={onMenu}
        aria-label={t.openMenu}
        className="grid h-9 w-9 place-items-center rounded-lg border text-muted transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden"
      >
        <Icon name="menu" />
      </button>

      <h1 className="hidden text-sm font-semibold sm:block">{t.topbarTitle}</h1>

      <nav
        aria-label={`${t.ownerView} / ${t.mechanicView}`}
        className="inline-flex items-center rounded-lg border p-0.5"
      >
        <Link
          href="/"
          aria-current="page"
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-surface transition-colors"
        >
          <Icon name="car" className="h-3.5 w-3.5" />
          <span>{t.ownerView}</span>
        </Link>
        <Link
          href="/mechanic"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <Icon name="wrench" className="h-3.5 w-3.5" />
          <span>{t.mechanicView}</span>
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/login"
          className="hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2 sm:inline-flex"
        >
          <Icon name="key" className="h-3.5 w-3.5 text-muted" />
          {t.signInBtn}
        </Link>
        <Link
          href="/register"
          className="hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2 md:inline-flex"
        >
          <Icon name="shield" className="h-3.5 w-3.5 text-positive" />
          {t.registerLink}
        </Link>
        <LanguageToggle />
        <div className="flex items-center gap-2.5 rounded-lg border py-1 pl-2.5 pr-2.5">
          <Icon name="car" className="h-4 w-4 text-muted" />
          <div className="hidden text-left leading-tight sm:block">
            <p className="text-xs font-medium">{car.model}</p>
            <p className="font-mono text-[11px] tracking-wider text-muted">{car.plate}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
