"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./icons";
import { useLang } from "./LanguageProvider";
import { ServiceSelect } from "./ServiceSelect";
import { WorkshopBadge } from "./WorkshopBadge";
import {
  addVehicle,
  getEntries,
  logOwnerService,
  type OwnerEntry,
  type OwnerVehicle,
} from "@/lib/owner-actions";
import { serviceCodeFromIndex, localizeServiceCode } from "@/lib/services";

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
  vehicles,
  initialEntries,
  verifiedWorkshops = [],
}: {
  vehicles: OwnerVehicle[];
  initialEntries: OwnerEntry[];
  verifiedWorkshops?: string[];
}) {
  const { t } = useLang();

  // Names are pre-lowercased + trimmed by getVerifiedWorkshopNames(). A history
  // entry's free-text `place` is "verified" when any verified workshop name is a
  // substring of the lowercased place — the only honest owner-side link, since
  // service_entries.place has no FK to a workshop.
  const isVerifiedPlace = (place: string | null | undefined) => {
    if (!place) return false;
    const haystack = place.toLowerCase();
    return verifiedWorkshops.some((name) => name && haystack.includes(name));
  };

  const [selectedId, setSelectedId] = useState<string | null>(
    vehicles[0]?.id ?? null,
  );
  const [entries, setEntries] = useState<OwnerEntry[]>(initialEntries);
  const [, startSwitch] = useTransition();

  // Add-vehicle inline form.
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicleState, vehicleAction] = useActionState(addVehicle, {
    ok: false,
    error: null,
  });

  // Log-service form.
  const [logState, logAction] = useActionState(logOwnerService, {
    ok: false,
    error: null,
  });
  const [serviceIdx, setServiceIdx] = useState(-1);
  const [cityIdx, setCityIdx] = useState(-1);

  // Collapse the add-vehicle form once a vehicle saves; the revalidated list
  // arrives on the next render. Reset the selection to the new newest vehicle.
  useEffect(() => {
    if (vehicleState.ok) setShowAddVehicle(false);
  }, [vehicleState.ok]);

  // Keep selectedId valid as the vehicle list changes (after a revalidate).
  useEffect(() => {
    if (vehicles.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !vehicles.some((v) => v.id === selectedId)) {
      setSelectedId(vehicles[0].id);
    }
  }, [vehicles, selectedId]);

  // Refresh the shown history whenever a new entry is logged.
  useEffect(() => {
    if (!logState.ok || !selectedId) return;
    const id = selectedId;
    startSwitch(async () => {
      const next = await getEntries(id);
      setEntries(next);
    });
  }, [logState.ok, selectedId]);

  function switchVehicle(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    startSwitch(async () => {
      const next = await getEntries(id);
      setEntries(next);
    });
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? null;
  const lastServiced = entries[0]?.serviced_on;
  const serviceCode = serviceCodeFromIndex(serviceIdx);
  const cityValue = cityIdx >= 0 ? t.cities[cityIdx] : "";

  // No vehicles yet — prompt to add the first one.
  if (vehicles.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="grid place-items-center rounded-xl border border-dashed bg-surface py-12 text-center">
          <Icon name="car" className="h-7 w-7 text-muted" />
          <p className="mt-3 text-sm font-medium">{t.historyEmpty}</p>
          <p className="mt-1 text-xs text-muted">{t.vehiclesSubtitle}</p>
          {!showAddVehicle && (
            <button
              type="button"
              onClick={() => setShowAddVehicle(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
            >
              <Icon name="plus" className="h-4 w-4" />
              {t.addVehicle}
            </button>
          )}
        </div>
        {showAddVehicle && (
          <AddVehicleForm
            action={vehicleAction}
            state={vehicleState}
            onCancel={() => setShowAddVehicle(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Vehicle switcher */}
      {vehicles.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {vehicles.map((v) => {
            const active = v.id === selectedId;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => switchVehicle(v.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs tracking-wider transition-colors ${
                  active
                    ? "bg-accent text-surface"
                    : "border text-foreground hover:border-foreground/30"
                }`}
              >
                <Icon name="car" className="h-3.5 w-3.5" />
                {v.plate}
              </button>
            );
          })}
        </div>
      )}

      {/* Vehicle hero + stats */}
      <div className="rounded-xl border border-accent/15 bg-accent-soft p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-surface shadow-sm">
            <Icon name="car" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{selectedVehicle?.model ?? "—"}</p>
            <p className="font-mono text-xs tracking-wider text-muted">
              {selectedVehicle?.plate ?? "—"}
            </p>
          </div>
          <WorkshopBadge
            status={isVerifiedPlace(entries[0]?.place) ? "verified" : "pending"}
            className="ml-auto self-start"
          />
        </div>
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

      {/* Add another vehicle */}
      <div className="mt-3">
        {showAddVehicle ? (
          <AddVehicleForm
            action={vehicleAction}
            state={vehicleState}
            onCancel={() => setShowAddVehicle(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowAddVehicle(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            {t.addVehicle}
          </button>
        )}
      </div>

      {/* Log a new service */}
      <form action={logAction} className="mt-4 rounded-xl border bg-surface p-4">
        <h2 className="text-sm font-semibold">{t.recordTitle}</h2>
        <p className="mt-0.5 text-xs text-muted">{t.recordSubtitle}</p>

        <input type="hidden" name="vehicle_id" value={selectedId ?? ""} />
        <input type="hidden" name="service_code" value={serviceCode ?? ""} />
        <input type="hidden" name="city" value={cityValue} />

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

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <ServiceSelect
            className="min-w-0 flex-1"
            value={cityIdx}
            onChange={setCityIdx}
            options={t.cities}
            placeholder={t.cityPlaceholder}
          />
          <input
            name="mechanic"
            aria-label={t.mechanicLabel}
            placeholder={t.mechanicPlaceholder}
            maxLength={80}
            className="min-w-0 flex-1 rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-foreground focus:bg-surface"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SubmitButton label={t.recordBtn} />
          {logState.ok && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-positive/10 px-3 py-1.5 text-xs font-medium text-positive [animation:popIn_.12s_ease-out]">
              <Icon name="check" className="h-3.5 w-3.5" /> {t.recordedOwn}
            </span>
          )}
          {logState.error && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-negative/10 px-3 py-1.5 text-xs font-medium text-negative">
              {t.errSave}
            </span>
          )}
        </div>
      </form>

      {/* History */}
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
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <p className="inline-flex items-center gap-1 text-xs text-muted">
                        <Icon name="pin" /> {entry.place}
                      </p>
                      {isVerifiedPlace(entry.place) && (
                        <WorkshopBadge status="verified" />
                      )}
                    </div>
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

function AddVehicleForm({
  action,
  state,
  onCancel,
}: {
  action: (formData: FormData) => void;
  state: { ok: boolean; error: string | null };
  onCancel: () => void;
}) {
  const { t } = useLang();
  return (
    <form action={action} className="rounded-xl border bg-surface p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="model"
          required
          aria-label={t.vehicleModelPlaceholder}
          placeholder={t.vehicleModelPlaceholder}
          maxLength={80}
          className="min-w-0 flex-1 rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-foreground focus:bg-surface"
        />
        <input
          name="plate"
          required
          aria-label={t.vehiclePlatePlaceholder}
          placeholder={t.vehiclePlatePlaceholder}
          maxLength={20}
          className="min-w-0 flex-1 rounded-lg border bg-surface-2 px-3 py-2.5 font-mono text-sm uppercase tracking-wider outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-foreground focus:bg-surface"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SubmitButton label={t.saveVehicle} />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2"
        >
          {t.cancel}
        </button>
        {state.error && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-negative/10 px-3 py-1.5 text-xs font-medium text-negative">
            {t.errSave}
          </span>
        )}
      </div>
    </form>
  );
}
