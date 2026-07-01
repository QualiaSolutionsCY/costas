"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";

const SPLASH_MS = 2500;

/**
 * Full-screen animated splash shown once per browser session on entry. After
 * ~2.5s it routes the visitor to /login. A sessionStorage flag ensures it only
 * plays on the first landing, not on every return to the dashboard — so a
 * signed-in owner routed back to "/" doesn't re-trigger it. SSR-safe:
 * sessionStorage is only read inside the effect.
 */
export function SplashGate() {
  const router = useRouter();
  const { t } = useLang();
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("costas_splash") !== null) return;
    sessionStorage.setItem("costas_splash", "1");
    setShowing(true);
    const id = setTimeout(() => router.replace("/login"), SPLASH_MS);
    return () => clearTimeout(id);
  }, [router]);

  if (!showing) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex flex-col items-center gap-6"
        style={{ animation: "splashIn 0.5s ease-out both" }}
      >
        <span
          className="grid h-20 w-20 place-items-center rounded-2xl bg-accent text-3xl font-bold text-surface shadow-lg"
          style={{ animation: "splashPulse 1.6s ease-in-out infinite" }}
        >
          C
        </span>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">Costas</h1>
          <p className="mt-1 text-sm text-muted">{t.tagline}</p>
        </div>
        <div className="mt-1 h-1 w-40 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full w-1/3 rounded-full bg-accent"
            style={{ animation: "splashBar 1.2s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}
