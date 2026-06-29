"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useLang } from "./LanguageProvider";
import { Icon } from "./icons";
import { getProfile, updateProfile, type ProfileData } from "@/lib/profile-actions";
import {
  updateVehicle,
  removeVehicle,
  type OwnerVehicle,
} from "@/lib/owner-actions";
import { changePassword } from "@/lib/account-actions";
import { ReminderPrefs } from "./ReminderPrefs";

// `getProfile` is referenced here only to keep the profile data seam imported
// alongside its mutation — the page already invokes it server-side.
void getProfile;

// Shared input + button class strings, lifted from the existing form surfaces
// (register/auth/owner) so every control on this page matches the design system.
const INPUT =
  "w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-foreground focus:bg-surface";
const LABEL = "block text-xs font-medium text-muted";
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40";
const CARD = "rounded-xl border bg-surface p-5";

/** Bilingual back link used by the server page header. */
export function BackToLogLink() {
  const { t } = useLang();
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
    >
      <Icon name="chevron" className="h-4 w-4 rotate-90" />
      {t.backToLog}
    </Link>
  );
}

/**
 * Account settings — profile, vehicles, security. Server-rendered profile +
 * vehicles arrive as props; every mutation rides a useActionState server action
 * (updateProfile / updateVehicle / removeVehicle / changePassword) so the page
 * stays a thin client over the existing data seams. When signed out, only a
 * sign-in prompt renders.
 */
export function SettingsClient({
  profile,
  vehicles,
  reminderPrefs,
}: {
  profile: ProfileData | null;
  vehicles: OwnerVehicle[];
  reminderPrefs: { inApp: boolean; email: boolean; advanceDays: number } | null;
}) {
  const { t } = useLang();

  if (profile === null) {
    return (
      <div className={CARD}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent ring-1 ring-accent/15">
            <Icon name="key" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{t.settingsSignedOut}</h2>
            <p className="mt-0.5 text-xs text-muted">{t.settingsSignedOutHint}</p>
            <Link href="/login" className={`${PRIMARY_BTN} mt-4`}>
              <Icon name="key" className="h-4 w-4" />
              {t.signInBtn}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileForm profile={profile} />
      <VehiclesSection vehicles={vehicles} />
      <SecurityForm />
      <ReminderPrefs prefs={reminderPrefs} />
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────────────── */

function ProfileForm({ profile }: { profile: ProfileData }) {
  const { t } = useLang();
  const [state, action, pending] = useActionState(updateProfile, {
    ok: false,
    error: null,
  });

  return (
    <section className={CARD}>
      <SectionHead icon="users" title={t.profileSection} />
      <form action={action} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="settings-name" className={LABEL}>
            {t.nameLabel}
          </label>
          <input
            id="settings-name"
            name="full_name"
            type="text"
            defaultValue={profile.full_name ?? ""}
            placeholder={t.namePlaceholder}
            className={INPUT}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="settings-phone" className={LABEL}>
            {t.phoneLabel}
          </label>
          <input
            id="settings-phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            placeholder={t.phonePlaceholder}
            className={INPUT}
          />
        </div>

        {state.ok ? (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-positive">
            <Icon name="check" className="h-4 w-4" />
            {t.profileSaved}
          </p>
        ) : state.error ? (
          <p className="text-xs font-medium text-negative">{t.errSave}</p>
        ) : null}

        <button type="submit" disabled={pending} className={PRIMARY_BTN}>
          {pending ? (
            <>
              <Icon name="spinner" className="h-4 w-4" />
              {t.saving}
            </>
          ) : (
            t.saveProfile
          )}
        </button>
      </form>
    </section>
  );
}

/* ── Vehicles ────────────────────────────────────────────────────────── */

function VehiclesSection({ vehicles }: { vehicles: OwnerVehicle[] }) {
  const { t } = useLang();

  return (
    <section className={CARD}>
      <SectionHead icon="car" title={t.vehiclesSection} />
      {vehicles.length === 0 ? (
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed bg-surface-2 py-10 text-center">
          <Icon name="car" className="h-6 w-6 text-muted" />
          <p className="mt-2 text-sm font-medium">{t.historyEmpty}</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {vehicles.map((v) => (
            <VehicleRow key={v.id} vehicle={v} />
          ))}
        </ul>
      )}
    </section>
  );
}

function VehicleRow({ vehicle }: { vehicle: OwnerVehicle }) {
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // "VW Golf · 2019" — year only when truthy, never a literal "null".
  const subtitle = [vehicle.model, vehicle.year]
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join(" · ");

  return (
    <li className="rounded-lg border bg-surface">
      <div className="flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-surface shadow-sm">
          <Icon name="car" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {subtitle || vehicle.plate}
          </p>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            {vehicle.plate}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            aria-expanded={editing}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            {t.editVehicle}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-negative transition-colors hover:bg-surface-2"
          >
            {t.removeVehicle}
          </button>
        </div>
      </div>

      {editing && (
        <EditVehicleForm vehicle={vehicle} onDone={() => setEditing(false)} />
      )}

      {confirming && (
        <RemoveConfirm
          vehicle={vehicle}
          onCancel={() => setConfirming(false)}
        />
      )}
    </li>
  );
}

function EditVehicleForm({
  vehicle,
  onDone,
}: {
  vehicle: OwnerVehicle;
  onDone: () => void;
}) {
  const { t } = useLang();
  const [state, action, pending] = useActionState(updateVehicle, {
    ok: false,
    error: null,
  });

  return (
    <form
      action={action}
      className="space-y-3 border-t bg-surface-2/40 p-4"
    >
      <input type="hidden" name="id" value={vehicle.id} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor={`model-${vehicle.id}`} className={LABEL}>
            {t.vehicleModelPlaceholder}
          </label>
          <input
            id={`model-${vehicle.id}`}
            name="model"
            type="text"
            defaultValue={vehicle.model ?? ""}
            placeholder={t.vehicleModelPlaceholder}
            className={INPUT}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`year-${vehicle.id}`} className={LABEL}>
            {t.yearLabel}
          </label>
          <input
            id={`year-${vehicle.id}`}
            name="year"
            type="text"
            inputMode="numeric"
            defaultValue={vehicle.year ?? ""}
            placeholder={t.yearPlaceholder}
            className={INPUT}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`plate-${vehicle.id}`} className={LABEL}>
          {t.plateLabel}
        </label>
        <input
          id={`plate-${vehicle.id}`}
          name="plate"
          type="text"
          defaultValue={vehicle.plate}
          placeholder={t.vehiclePlatePlaceholder}
          className={`${INPUT} uppercase tracking-wider placeholder:normal-case`}
        />
      </div>

      {state.error ? (
        <p className="text-xs font-medium text-negative">{t.errSave}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className={PRIMARY_BTN}>
          {pending ? (
            <>
              <Icon name="spinner" className="h-4 w-4" />
              {t.saving}
            </>
          ) : (
            t.saveVehicle
          )}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
        >
          {t.cancel}
        </button>
        {state.ok ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-positive">
            <Icon name="check" className="h-4 w-4" />
            {t.profileSaved}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function RemoveConfirm({
  vehicle,
  onCancel,
}: {
  vehicle: OwnerVehicle;
  onCancel: () => void;
}) {
  const { t } = useLang();
  const [state, action, pending] = useActionState(removeVehicle, {
    ok: false,
    error: null,
  });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.confirmRemove}
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-xl border bg-surface p-5 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.28)] animate-[popIn_.12s_ease-out]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-negative">
            <Icon name="car" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{t.confirmRemove}</h3>
            <p className="mt-0.5 text-xs text-muted">{t.confirmRemoveHint}</p>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted">
              {vehicle.plate}
            </p>
          </div>
        </div>

        {state.error ? (
          <p className="mt-3 text-xs font-medium text-negative">{t.errSave}</p>
        ) : null}

        <form action={action} className="mt-5 flex items-center justify-end gap-2">
          <input type="hidden" name="id" value={vehicle.id} />
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-negative px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {pending ? (
              <>
                <Icon name="spinner" className="h-4 w-4" />
                {t.saving}
              </>
            ) : (
              t.removeVehicle
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Security ────────────────────────────────────────────────────────── */

function SecurityForm() {
  const { t } = useLang();
  const [state, action, pending] = useActionState(changePassword, {
    ok: false,
    error: null,
  });

  // Map the server action's machine-readable token to a bilingual message,
  // reusing the existing auth-lifecycle error strings (mismatch / save).
  const errorMessage =
    state.error === "mismatch"
      ? t.errPwMismatch
      : state.error
        ? t.errSave
        : null;

  return (
    <section className={CARD}>
      <SectionHead icon="shield" title={t.securitySection} />
      <form action={action} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="settings-password" className={LABEL}>
            {t.newPassword}
          </label>
          <input
            id="settings-password"
            name="password"
            type="password"
            autoComplete="new-password"
            className={INPUT}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="settings-confirm" className={LABEL}>
            {t.confirmPassword}
          </label>
          <input
            id="settings-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            className={INPUT}
          />
        </div>

        {state.ok ? (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-positive">
            <Icon name="check" className="h-4 w-4" />
            {t.passwordChanged}
          </p>
        ) : errorMessage ? (
          <p className="text-xs font-medium text-negative">{errorMessage}</p>
        ) : null}

        <button type="submit" disabled={pending} className={PRIMARY_BTN}>
          {pending ? (
            <>
              <Icon name="spinner" className="h-4 w-4" />
              {t.saving}
            </>
          ) : (
            t.changePassword
          )}
        </button>
      </form>
    </section>
  );
}

/* ── shared ──────────────────────────────────────────────────────────── */

function SectionHead({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent ring-1 ring-accent/15">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
    </div>
  );
}
