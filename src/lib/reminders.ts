import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getEntries } from "@/lib/owner-actions";
import type { OwnerVehicle, OwnerEntry } from "@/lib/owner-actions";

// Derive-from-data reminder engine. Reminders are NOT stored rows — they are
// computed at read time from a vehicle's service history: the latest MOT entry
// implies the next MOT is due 12 months later, and the latest non-MOT service
// implies the next service is due 12 months later. The only persisted state is
// per-cycle dismissal (public.reminder_dismissals), which this seam subtracts so
// a dismissed reminder stays gone until a NEW cycle (a fresh due date) appears.
//
// computeReminders / sortReminders are PURE (no IO) and safe to unit-test;
// getRemindersForVehicles / getReminderBadgeCount are the async data seam.

export type ReminderKind = "mot" | "service";

export type Reminder = {
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string | null;
  kind: ReminderKind;
  /** ISO yyyy-mm-dd when the next MOT/service is due. */
  dueOn: string;
  /** Whole days from today to dueOn; negative means overdue. */
  daysUntil: number;
  status: "overdue" | "soon" | "upcoming";
  /** ISO yyyy-mm-dd of the entry this reminder was derived from. */
  lastServicedOn: string | null;
};

const DEFAULT_ADVANCE_DAYS = 30;
const MS_PER_DAY = 86_400_000;

/**
 * Adds `n` months to an ISO yyyy-mm-dd date, clamping the day to the target
 * month's length (e.g. 2024-01-31 + 1mo → 2024-02-29). Re-serializes to
 * yyyy-mm-dd. No date library — uses a UTC Date to avoid timezone drift.
 */
function addMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  // Month index is 0-based; (m - 1) + n can roll the year over naturally.
  const targetYear = y + Math.floor((m - 1 + n) / 12);
  const targetMonth = ((((m - 1 + n) % 12) + 12) % 12) + 1; // 1-based
  // Last day of the target month (day 0 of the next month, UTC).
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  const mm = String(targetMonth).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${targetYear}-${mm}-${dd}`;
}

/** UTC midnight for an ISO yyyy-mm-dd, so day math is timezone-stable. */
function isoToUtcMidnight(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** A date defaulted to `new Date()` reduced to UTC midnight (time zeroed). */
function todayUtcMidnight(today: Date): number {
  return Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
}

function buildReminder(
  vehicle: { id: string; plate: string; model: string | null },
  kind: ReminderKind,
  basis: OwnerEntry,
  todayMs: number,
  advanceDays: number,
): Reminder {
  const dueOn = addMonths(basis.serviced_on, 12);
  const daysUntil = Math.floor((isoToUtcMidnight(dueOn) - todayMs) / MS_PER_DAY);
  const status: Reminder["status"] =
    daysUntil < 0 ? "overdue" : daysUntil <= advanceDays ? "soon" : "upcoming";
  return {
    vehicleId: vehicle.id,
    vehiclePlate: vehicle.plate,
    vehicleModel: vehicle.model,
    kind,
    dueOn,
    daysUntil,
    status,
    lastServicedOn: basis.serviced_on,
  };
}

/**
 * PURE: derives the MOT and next-service reminders for one vehicle from its
 * entries (already newest-first). For each kind, the latest qualifying entry is
 * the basis; +12 months is the due date. A kind with no qualifying entry yields
 * no reminder (no basis to compute from). `today` defaults to now; only its
 * date part is used.
 */
export function computeReminders(
  vehicle: { id: string; plate: string; model: string | null },
  entries: OwnerEntry[],
  opts?: { advanceDays?: number; today?: Date },
): Reminder[] {
  const advanceDays = opts?.advanceDays ?? DEFAULT_ADVANCE_DAYS;
  const todayMs = todayUtcMidnight(opts?.today ?? new Date());
  const reminders: Reminder[] = [];

  // Entries are newest-first, so the first match is the latest of its kind.
  const latestMot = entries.find((e) => e.service_code === "mot");
  if (latestMot) {
    reminders.push(
      buildReminder(vehicle, "mot", latestMot, todayMs, advanceDays),
    );
  }

  const latestService = entries.find((e) => e.service_code !== "mot");
  if (latestService) {
    reminders.push(
      buildReminder(vehicle, "service", latestService, todayMs, advanceDays),
    );
  }

  return reminders;
}

/** PURE: ascending by dueOn — most overdue / soonest first. */
export function sortReminders(rs: Reminder[]): Reminder[] {
  return [...rs].sort((a, b) => (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0));
}

/**
 * Data seam: computes reminders across every vehicle, then subtracts any that
 * have been dismissed for their exact (vehicleId, kind, dueOn) cycle. A new
 * cycle (fresh due date) re-surfaces even after a prior dismissal. Returns the
 * survivors sorted soonest-first. Reads via the anon-friendly demo RLS.
 */
export async function getRemindersForVehicles(
  vehicles: OwnerVehicle[],
  opts?: { advanceDays?: number },
): Promise<Reminder[]> {
  const all: Reminder[] = [];
  for (const vehicle of vehicles) {
    const entries = await getEntries(vehicle.id);
    all.push(
      ...computeReminders(
        { id: vehicle.id, plate: vehicle.plate, model: vehicle.model },
        entries,
        { advanceDays: opts?.advanceDays },
      ),
    );
  }

  const supabase = await createClient();
  const { data: dismissals } = await supabase
    .from("reminder_dismissals")
    .select("vehicle_id, reminder_kind, due_on");

  const dismissed = new Set(
    (dismissals ?? []).map(
      (d) => `${d.vehicle_id}|${d.reminder_kind}|${d.due_on}`,
    ),
  );

  const survivors = all.filter(
    (r) => !dismissed.has(`${r.vehicleId}|${r.kind}|${r.dueOn}`),
  );

  return sortReminders(survivors);
}

/**
 * The bell-badge number: count of live (non-dismissed) reminders that are
 * overdue or due soon. 'upcoming' reminders are not counted.
 */
export async function getReminderBadgeCount(
  vehicles: OwnerVehicle[],
  opts?: { advanceDays?: number },
): Promise<number> {
  const reminders = await getRemindersForVehicles(vehicles, opts);
  return reminders.filter(
    (r) => r.status === "overdue" || r.status === "soon",
  ).length;
}
