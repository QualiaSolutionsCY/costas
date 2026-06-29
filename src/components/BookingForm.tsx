"use client";

import { useActionState, useState } from "react";
import { useLang } from "./LanguageProvider";
import { Icon } from "./icons";
import { ServiceSelect } from "./ServiceSelect";
import { createBooking } from "@/lib/booking-actions";
import { serviceCodeFromIndex, localizeServiceCode } from "@/lib/services";

// dd/mm/yyyy from an ISO `YYYY-MM-DD`, mirroring RemindersList's local helper.
function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

// Shared input + button class strings, lifted verbatim from SettingsClient so
// every control here matches the existing form surfaces (register/auth/owner).
const INPUT =
  "w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-foreground focus:bg-surface";
const LABEL = "block text-xs font-medium text-muted";
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40";
const CARD = "rounded-xl border bg-surface p-5";

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

type Props = {
  workshops: string[];
  vehicles: { id: string; model: string | null; plate: string; year: number | null }[];
  bookings: Booking[];
};

/**
 * OWNER booking flow. Top card: a form (workshop free-text-or-pick, service enum
 * via ServiceSelect, date, optional plate, note) that submits to the createBooking
 * server action. Bottom card: the owner's existing bookings with a status chip.
 * Tokens only, bilingual via useLang().
 */
export function BookingForm({ workshops, vehicles, bookings }: Props) {
  const { t } = useLang();
  const [state, action, pending] = useActionState(createBooking, {
    ok: false,
    error: null,
  });

  // Service is an enum, so it rides ServiceSelect (index state) + a hidden input
  // carrying the stable service code the server action persists.
  const [svc, setSvc] = useState(-1);

  return (
    <div className="space-y-6">
      <section className={CARD}>
        <SectionHead
          icon="calendar"
          title={t.bookTitle}
          subtitle={t.bookSubtitle}
        />

        <form action={action} className="mt-4 space-y-4">
          {/* Workshop — free text or pick from verified workshops via datalist */}
          <div className="space-y-1.5">
            <label htmlFor="book-workshop" className={LABEL}>
              {t.bookWorkshopLabel}
            </label>
            <input
              id="book-workshop"
              name="workshop_name"
              type="text"
              list="book-workshop-options"
              placeholder={t.bookWorkshopPlaceholder}
              className={INPUT}
            />
            <datalist id="book-workshop-options">
              {workshops.map((w) => (
                <option key={w} value={w} />
              ))}
            </datalist>
            <p className="text-xs text-muted">{t.bookWorkshopFreeHint}</p>
          </div>

          {/* Service — enum picker; hidden input carries the stable code */}
          <div className="space-y-1.5">
            <label htmlFor="book-service-trigger" className={LABEL}>
              {t.bookServiceLabel}
            </label>
            <ServiceSelect
              value={svc}
              onChange={setSvc}
              options={t.serviceOptions}
              placeholder={t.servicePlaceholder}
            />
            <input
              type="hidden"
              name="service_code"
              value={serviceCodeFromIndex(svc) ?? ""}
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label htmlFor="book-date" className={LABEL}>
              {t.bookDateLabel}
            </label>
            <input
              id="book-date"
              name="requested_date"
              type="date"
              className={INPUT}
            />
          </div>

          {/* Plate (optional) — free text; uppercased to match plate display */}
          <div className="space-y-1.5">
            <label htmlFor="book-plate" className={LABEL}>
              {t.bookPlateLabel}
            </label>
            <input
              id="book-plate"
              name="plate"
              type="text"
              list={vehicles.length > 0 ? "book-plate-options" : undefined}
              placeholder={t.platePlaceholder}
              className={`${INPUT} uppercase tracking-wider placeholder:normal-case`}
            />
            {vehicles.length > 0 && (
              <datalist id="book-plate-options">
                {vehicles.map((v) => (
                  <option key={v.id} value={v.plate} />
                ))}
              </datalist>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label htmlFor="book-note" className={LABEL}>
              {t.bookNoteLabel}
            </label>
            <input
              id="book-note"
              name="note"
              type="text"
              placeholder={t.bookNotePlaceholder}
              className={INPUT}
            />
          </div>

          {state.ok ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-positive">
              <Icon name="check" className="h-4 w-4" />
              {t.bookSent}
            </p>
          ) : state.error ? (
            <p role="alert" className="text-xs font-medium text-negative">{t.bookError}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending || svc < 0}
            className={PRIMARY_BTN}
          >
            {pending ? (
              <>
                <Icon name="spinner" className="h-4 w-4" />
                {t.bookSubmitting}
              </>
            ) : (
              <>
                <Icon name="calendar" className="h-4 w-4" />
                {t.bookSubmit}
              </>
            )}
          </button>
        </form>
      </section>

      <section className={CARD}>
        <SectionHead icon="clock" title={t.myBookingsTitle} />
        {bookings.length === 0 ? (
          <div className="mt-4 grid place-items-center rounded-lg border border-dashed bg-surface-2 py-10 text-center">
            <Icon name="calendar" className="h-6 w-6 text-muted" />
            <p className="mt-2 text-sm font-medium">{t.myBookingsEmpty}</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 rounded-lg border bg-surface p-4"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-surface shadow-sm">
                  <Icon name="calendar" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {localizeServiceCode(b.service_code ?? "", t.serviceOptions)}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {b.workshop_name ?? ""}
                  </p>
                  {b.requested_date ? (
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
                      {formatDate(b.requested_date)}
                    </p>
                  ) : null}
                  {b.note ? (
                    <p className="mt-0.5 text-xs text-muted">{b.note}</p>
                  ) : null}
                </div>
                <div className="ml-auto shrink-0">
                  <StatusChip status={b.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ── shared ──────────────────────────────────────────────────────────── */

/** Booking lifecycle chip — mirrors the WorkshopBadge chip shape, tokens only. */
function StatusChip({ status }: { status: string }) {
  const { t } = useLang();

  const map: Record<string, { label: string; classes: string }> = {
    requested: { label: t.statusRequested, classes: "bg-surface-2 text-muted" },
    confirmed: { label: t.statusConfirmed, classes: "bg-accent-soft text-accent" },
    done: { label: t.statusDone, classes: "bg-positive/10 text-positive" },
    cancelled: { label: t.statusCancelled, classes: "bg-negative/10 text-negative" },
  };

  const chip = map[status] ?? map.requested;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${chip.classes}`}
    >
      {chip.label}
    </span>
  );
}

function SectionHead({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent ring-1 ring-accent/15">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}
