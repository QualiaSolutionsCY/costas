"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type AccountState } from "@/lib/account-actions";
import { useLang } from "@/components/LanguageProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Icon } from "@/components/icons";

type ChangeAction = (
  prevState: AccountState,
  formData: FormData,
) => Promise<AccountState>;

// Client completion form for the reset-password route. The changePassword
// server action is return-based (stays reusable by Phase 2 settings), so on
// state.ok we redirect to /login client-side via the router. A client mismatch
// guard blocks submit before the password ever leaves the browser.
export function ResetPasswordForm({
  action,
  expired,
}: {
  action: ChangeAction;
  expired: boolean;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    action,
    { ok: false, error: null },
  );
  const [mismatch, setMismatch] = useState(false);

  useEffect(() => {
    if (state.ok) router.push("/login");
  }, [state.ok, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement)
      .value;
    if (password !== confirm) {
      e.preventDefault();
      setMismatch(true);
    } else {
      setMismatch(false);
    }
  }

  const errorText = mismatch
    ? t.errPwMismatch
    : state.error === "mismatch"
      ? t.errPwMismatch
      : state.error
        ? t.errSave
        : null;

  return (
    <main className="min-h-dvh px-4 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-base font-bold text-surface shadow-sm">
            C
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight">{t.resetPwTitle}</h1>
            <p className="truncate text-xs text-muted">{t.resetPwSub}</p>
          </div>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </div>

        {expired ? (
          <div className="rounded-xl border bg-surface p-5 sm:p-6">
            <p
              role="alert"
              className="rounded-lg bg-negative/10 px-3 py-2 text-xs font-medium text-negative"
            >
              {t.resetLinkExpired}
            </p>
            <p className="mt-4 text-center text-xs text-muted">
              <a
                href="/forgot-password"
                className="font-medium text-accent hover:opacity-80"
              >
                {t.forgotTitle}
              </a>
            </p>
          </div>
        ) : (
          <form
            action={formAction}
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border bg-surface p-5 sm:p-6"
          >
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">{t.passwordLabel}</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-foreground focus:bg-surface"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">{t.confirmPasswordLabel}</span>
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-foreground focus:bg-surface"
              />
            </label>

            {errorText && (
              <p
                role="alert"
                className="rounded-lg bg-negative/10 px-3 py-2 text-xs font-medium text-negative"
              >
                {errorText}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || state.ok}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {(isPending || state.ok) && <Icon name="spinner" className="h-4 w-4" />}
              {state.ok ? t.signInBtn : t.setNewPassword}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-muted">
          <a href="/login" className="font-medium text-accent hover:opacity-80">
            {t.signInBtn}
          </a>
        </p>
      </div>
    </main>
  );
}
