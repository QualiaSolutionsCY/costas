"use client";

import { useFormStatus } from "react-dom";
import { demoSignIn } from "@/lib/welcome-actions";
import { useLang } from "@/components/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Icon } from "@/components/icons";

/**
 * One selectable role card. It is the submit button of its own <form>, so
 * useFormStatus reads the pending state of exactly this card — tapping it
 * shows a spinner only here while the demo sign-in resolves and routes.
 */
function RoleCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full flex-col gap-4 rounded-xl border bg-surface p-5 text-left transition-colors hover:border-accent/40 focus-visible:border-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent-soft text-accent">
        {pending ? (
          <Icon name="spinner" className="h-6 w-6" />
        ) : (
          <Icon name={icon} className="h-6 w-6" />
        )}
      </span>
      <span className="space-y-1">
        <span className="flex items-center gap-1.5">
          <span className="text-base font-semibold tracking-tight">{title}</span>
          <Icon
            name="chevron"
            className="h-4 w-4 -rotate-90 text-muted transition-transform group-hover:translate-x-0.5"
          />
        </span>
        <span className="block text-sm text-muted">{desc}</span>
      </span>
    </button>
  );
}

export default function WelcomePage() {
  const { t } = useLang();

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-base font-bold text-surface shadow-sm">
            C
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight">Costas</h1>
            <p className="truncate text-xs text-muted">{t.tagline}</p>
          </div>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </div>

        <div className="mb-7">
          <h2 className="text-2xl font-semibold tracking-tight">{t.welcomeTitle}</h2>
          <p className="mt-1.5 text-sm text-muted">{t.welcomeSubtitle}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <form action={() => demoSignIn("owner")}>
            <RoleCard
              icon="car"
              title={t.roleOwnerTitle}
              desc={t.roleOwnerDesc}
            />
          </form>
          <form action={() => demoSignIn("mechanic")}>
            <RoleCard
              icon="shield"
              title={t.roleMechTitle}
              desc={t.roleMechDesc}
            />
          </form>
        </div>

        <p className="mt-7 text-center text-sm">
          <a
            href="/login"
            className="text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {t.useEmailInstead}
          </a>
        </p>
      </div>
    </main>
  );
}
