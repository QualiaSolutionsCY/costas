"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/lib/auth-actions";
import { useLang } from "@/components/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Icon } from "@/components/icons";

const initialState: SignInState = { error: false };

export default function LoginPage() {
  const { t } = useLang();
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <main className="min-h-dvh px-4 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-base font-bold text-surface shadow-sm">
            C
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight">{t.loginTitle}</h1>
            <p className="truncate text-xs text-muted">{t.loginSubtitle}</p>
          </div>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </div>

        <form action={formAction} className="space-y-4 rounded-xl border bg-surface p-5 sm:p-6">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t.emailLabel}</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-foreground focus:bg-surface"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t.passwordLabel}</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-foreground focus:bg-surface"
            />
          </label>

          {state.error && (
            <p
              role="alert"
              className="rounded-lg bg-negative/10 px-3 py-2 text-xs font-medium text-negative"
            >
              {t.loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending && <Icon name="spinner" className="h-4 w-4" />}
            {isPending ? t.signingIn : t.signInBtn}
          </button>
        </form>

        <div className="mt-4 space-y-1.5 text-center text-xs text-muted">
          <p>
            {t.noAccount}{" "}
            <a href="/signup" className="font-medium text-accent hover:opacity-80">
              {t.signUpLink}
            </a>
          </p>
          <p>
            <a href="/forgot-password" className="font-medium text-accent hover:opacity-80">
              {t.forgotPassword}
            </a>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted">{t.demoHint}</p>
      </div>
    </main>
  );
}
