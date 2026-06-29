"use client";

import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { Icon } from "./icons";

/**
 * Reminders entry point for the topbar. A bordered icon button (matching the
 * Topbar's border-button visual language) linking to /reminders, with a small
 * accent pill showing the unread count when there is one. The count is capped
 * at "9+"; at zero only the bell renders. Tokens only.
 */
export function NotificationBell({ count }: { count: number }) {
  const { t } = useLang();

  return (
    <Link
      href="/reminders"
      aria-label={t.notificationsLabel}
      className="relative grid h-9 w-9 place-items-center rounded-lg border text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      <Icon name="bell" className="h-4 w-4" />
      {count > 0 ? (
        <span
          className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-surface"
          aria-hidden="true"
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
