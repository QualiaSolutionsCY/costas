"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { Icon } from "./icons";
import { updateBookingStatus } from "@/lib/booking-actions";
import { localizeServiceCode } from "@/lib/services";

// dd/mm/yyyy from an ISO `YYYY-MM-DD`, mirroring RemindersList's local helper.
function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

// Shared card/button class strings, lifted from SettingsClient so this surface
// matches the rest of the workshop UI (semantic tokens only — no raw hex).
const CARD = "rounded-xl border bg-surface p-4";
const BACK_LINK =
  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-2";

type Booking = {
  id: string;
  workshop_name: string | null;
  plate: string | null;
  service_code: string | null;
  requested_date: string | null;
  status: string;
  note: string | null;
  created_at: string;
};

/**
 * Workshop-side incoming-bookings list. Each row exposes status-driven
 * transitions (Confirm / Mark-done / Cancel) through `updateBookingStatus`,
 * whose `revalidatePath` refreshes this force-dynamic page — so the list needs
 * no client state of its own. The bilingual header + back link live here so
 * every string reacts to the language toggle.
 */
export function IncomingBookings({ bookings }: { bookings: Booking[] }) {
  const { t } = useLang();

  return (
    <div>
      <div className="mb-4 flex items-start gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">
            {t.incomingTitle}
          </h2>
          <p className="mt-0.5 text-xs text-muted">{t.incomingSubtitle}</p>
        </div>
        <Link href="/mechanic" className={`${BACK_LINK} ml-auto shrink-0`}>
          <Icon name="chevron" className="h-4 w-4 rotate-90" />
          {t.backToLog}
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed bg-surface py-12 text-center">
          <Icon name="calendar" className="h-6 w-6 text-muted" />
          <p className="mt-2 text-sm font-medium text-muted">
            {t.incomingEmpty}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const { t } = useLang();
  const service = localizeServiceCode(
    booking.service_code ?? "",
    t.serviceOptions,
  );

  return (
    <li className={CARD}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent ring-1 ring-accent/15">
          <Icon name="wrench" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{service}</p>
            <StatusChip status={booking.status} />
          </div>
          {booking.workshop_name ? (
            <p className="mt-0.5 truncate text-xs text-muted">
              {booking.workshop_name}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {booking.plate ? (
              <span className="font-mono uppercase tracking-wider text-muted">
                {booking.plate}
              </span>
            ) : null}
            {booking.requested_date ? (
              <span className="inline-flex items-center gap-1 font-mono tabular-nums text-muted">
                <Icon name="calendar" className="h-3.5 w-3.5" />
                {formatDate(booking.requested_date)}
              </span>
            ) : null}
          </div>
          {booking.note ? (
            <p className="mt-2 text-xs text-muted">{booking.note}</p>
          ) : null}

          <StatusActions status={booking.status} bookingId={booking.id} />
        </div>
      </div>
    </li>
  );
}

/* ── status presentation ─────────────────────────────────────────────── */

function StatusChip({ status }: { status: string }) {
  const { t } = useLang();

  // Maps the persisted status to its chip styling + icon + bilingual label.
  // Each branch uses semantic tokens only.
  const map: Record<
    string,
    { cls: string; icon: string; label: string }
  > = {
    requested: {
      cls: "bg-surface-2 text-muted",
      icon: "clock",
      label: t.statusRequested,
    },
    confirmed: {
      cls: "bg-accent-soft text-accent",
      icon: "shield",
      label: t.statusConfirmed,
    },
    done: {
      cls: "bg-positive/10 text-positive",
      icon: "shield",
      label: t.statusDone,
    },
    cancelled: {
      cls: "bg-negative/10 text-negative",
      icon: "clock",
      label: t.statusCancelled,
    },
  };
  const chip = map[status] ?? map.requested;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${chip.cls}`}
    >
      <Icon name={chip.icon} className="h-3 w-3" />
      {chip.label}
    </span>
  );
}

function StatusActions({
  status,
  bookingId,
}: {
  status: string;
  bookingId: string;
}) {
  const { t } = useLang();

  if (status === "requested") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusButton
          bookingId={bookingId}
          status="confirmed"
          label={t.bookingConfirm}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
        />
        <StatusButton
          bookingId={bookingId}
          status="cancelled"
          label={t.bookingCancel}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-negative transition-colors hover:bg-surface-2 disabled:opacity-40"
        />
      </div>
    );
  }

  if (status === "confirmed") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusButton
          bookingId={bookingId}
          status="done"
          label={t.bookingMarkDone}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-positive px-3 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
        />
      </div>
    );
  }

  // done / cancelled → terminal, no actions.
  return null;
}

/**
 * A single status-transition button. Owns its own useActionState so each
 * pending state is isolated; submits `id` + target `status` as hidden inputs
 * to `updateBookingStatus`, which revalidates the server-rendered list.
 */
function StatusButton({
  bookingId,
  status,
  label,
  className,
}: {
  bookingId: string;
  status: string;
  label: string;
  className: string;
}) {
  const { t } = useLang();
  const [state, action, pending] = useActionState(updateBookingStatus, {
    ok: false,
    error: null,
  });

  return (
    <form action={action} className="inline-flex flex-col gap-1">
      <input type="hidden" name="id" value={bookingId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" disabled={pending} className={className}>
        {pending ? (
          <>
            <Icon name="spinner" className="h-4 w-4" />
            {t.saving}
          </>
        ) : (
          label
        )}
      </button>
      {state.error ? (
        <span className="text-[11px] font-medium text-negative">
          {t.bookError}
        </span>
      ) : null}
    </form>
  );
}
