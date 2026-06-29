"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";
import { ServiceSelect } from "./ServiceSelect";
import { logOwnerService } from "@/lib/owner-actions";
import { serviceCodeFromIndex, localizeServiceCode } from "@/lib/services";
import { useState } from "react";

type Vehicle = { model: string; plate: string };
type Entry = {
  id: string;
  service_code: string;
  note: string | null;
  place: string | null;
  serviced_on: string;
  kind: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon name={pending ? "spinner" : "plus"} className="h-4 w-4" />
      {label}
    </button>
  );
}

export function ServiceLog({
  vehicle,
  initialEntries,
}: {
  vehicle: Vehicle | null;
  initialEntries: Entry[];
}) {
  const { t } = useLang();
  const [state, formAction] = useActionState(logOwnerService, {
    ok: false,
    error: null,
  });
  const [serviceIdx, setServiceIdx] = useState(-1);

  const entries = initialEntries;
  const lastServiced = entries[0]?.serviced_on;
  const serviceCode = serviceCodeFromIndex(serviceIdx);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Όχημα */}
      <div className="rounded-xl border border-accent/15 bg-accent-soft p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-surface shadow-sm">
            <Icon name="car" />
          </span>
          <div>
            <p className="text-sm font-semibold">{vehicle?.model ?? "—"}</p>
            <p className="font-mono text-xs tracking-wider text-muted">{vehicle?.plate ?? "—"}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 self-start rounded-full bg-positive/10 px-2 py-0.5 text-[11px] font-medium text-positive">
            <Icon name="shield" className="h-3 w-3" /> {t.mechCertified}
          </span>
        </div>
        {/* Στατιστικά με μια ματιά */}
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
          <div className="bg-surface px-3 py-2">
            <dt className="text-[11px] text-muted">{t.statServices}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{entries.length}</dd>
          </div>
          <div className="bg-surface px-3 py-2">
            <dt className="text-[11px] text-muted">{t.statLast}</dt>
            <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
              {lastServiced ? formatDate(lastServiced) : t.statNone}
            </dd>
          </div>
        </dl>
      </div>

      {/* Καταγραφή νέου σέρβις */}
      <form action={formAction} className="mt-4 rounded-xl border bg-surface p-4">
        <h2 className="text-sm font-semibold">{t.recordTitle}</h2>
        <p className="mt-0.5 text-xs text-muted">{t.recordSubtitle}</p>

        <input type="hidden" name="service_code" value={serviceCode ?? ""} />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <ServiceSelect
            className="min-w-0 flex-1"
            value={serviceIdx}
            onChange={setServiceIdx}
            options={t.serviceOptions}
            placeholder={t.servicePlaceholder}
          />
          <input
            type="date"
            name="serviced_on"
            defaultValue={todayISO()}
            className="rounded-lg border bg-surface-2 px-3 py-2.5 text-sm text-muted outline-none focus:border-foreground focus:bg-surface"
          />
        </div>

        <input
          name="place"
          aria-label={t.placeLabel}
          placeholder={t.placePlaceholder}
          maxLength={120}
          className="mt-2 w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-foreground focus:bg-surface"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SubmitButton label={t.recordBtn} />
          {state.ok && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-positive/10 px-3 py-1.5 text-xs font-medium text-positive [animation:popIn_.12s_ease-out]">
              <Icon name="check" className="h-3.5 w-3.5" /> {t.recordedOwn}
            </span>
          )}
          {state.error && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-negative/10 px-3 py-1.5 text-xs font-medium text-negative">
              {t.errSave}
            </span>
          )}
        </div>
      </form>

      {/* Ιστορικό */}
      <h2 className="mt-6 flex items-center gap-1.5 px-1 text-sm font-semibold">
        <Icon name="history" className="h-4 w-4 text-muted" />
        {t.historyTitle}
      </h2>

      {entries.length === 0 ? (
        <div className="mt-3 grid place-items-center rounded-xl border border-dashed bg-surface py-12 text-center">
          <Icon name="wrench" className="h-7 w-7 text-muted" />
          <p className="mt-3 text-sm font-medium">{t.historyEmpty}</p>
          <p className="mt-1 text-xs text-muted">{t.historyEmptyHint}</p>
        </div>
      ) : (
        <ol className="mt-3">
          {entries.map((entry, i) => {
            const last = i === entries.length - 1;
            return (
              <li key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                {!last && <span className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-border" />}
                <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent ring-1 ring-accent/15">
                  <Icon name="wrench" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 rounded-xl border bg-surface px-4 py-3 transition-colors hover:border-foreground/20">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {localizeServiceCode(entry.service_code, t.serviceOptions)}
                    </p>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{formatDate(entry.serviced_on)}</span>
                  </div>
                  {entry.place && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
                      <Icon name="pin" /> {entry.place}
                    </p>
                  )}
                  {entry.note && <p className="mt-0.5 text-xs text-muted">{entry.note}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
