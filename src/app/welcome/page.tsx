"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { demoSignIn } from "@/lib/welcome-actions";
import { useLang } from "@/components/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Icon } from "@/components/icons";

/** Persist the onboarding flag so FirstVisitGate stops redirecting here. */
function markOnboarded() {
  try {
    localStorage.setItem("costas_onboarded", "1");
  } catch {
    // localStorage unavailable (private mode / SSR) — onboarding still works,
    // the user just sees the intro again next visit.
  }
}

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

/** One feature row in the intro step: an icon tile + a short line of copy. */
function FeatureRow({ icon, label }: { icon: string; label: string }) {
  return (
    <li className="flex items-center gap-3.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="text-sm text-foreground">{label}</span>
    </li>
  );
}

export default function WelcomePage() {
  const { t } = useLang();
  const [step, setStep] = useState<"intro" | "choose">("intro");

  function goToChoose() {
    markOnboarded();
    setStep("choose");
  }

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

        {step === "intro" ? (
          <div>
            <div className="mb-7">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.onbTitle}
              </h2>
              <p className="mt-2 text-sm text-muted sm:text-base">{t.onbSub}</p>
            </div>

            <ul className="mb-8 space-y-3.5">
              <FeatureRow icon="pin" label={t.onbFeat1} />
              <FeatureRow icon="wrench" label={t.onbFeat2} />
              <FeatureRow icon="history" label={t.onbFeat3} />
            </ul>

            <button
              type="button"
              onClick={goToChoose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {t.onbStart}
              <Icon name="chevron" className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-7">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t.welcomeTitle}
              </h2>
              <p className="mt-1.5 text-sm text-muted">{t.welcomeSubtitle}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <form
                action={() => {
                  markOnboarded();
                  return demoSignIn("owner");
                }}
              >
                <RoleCard
                  icon="car"
                  title={t.roleOwnerTitle}
                  desc={t.roleOwnerDesc}
                />
              </form>
              <form
                action={() => {
                  markOnboarded();
                  return demoSignIn("mechanic");
                }}
              >
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
                onClick={markOnboarded}
                className="text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {t.useEmailInstead}
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
