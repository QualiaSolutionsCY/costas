// Language-stable service codes. A service logged in Greek still renders in
// English (and vice versa) because the persisted value is a stable code, not a
// localized string. This array is INDEX-ALIGNED to `t.serviceOptions` in
// src/lib/i18n.ts — keep the order in lock-step with that array.
//
// index 0  full_service  → "Full service" / "Πλήρες service"
// index 1  service_oil   → "Service & oil change" / "Service & λάδια"
// index 2  brakes        → "Brake replacement" / "Αλλαγή φρένων"
// index 3  tyres         → "Tyre change" / "Αλλαγή ελαστικών"
// index 4  alignment     → "Wheel alignment" / "Ευθυγράμμιση"
// index 5  diagnostic    → "Diagnostic check" / "Διαγνωστικός έλεγχος"
// index 6  mot           → "MOT" / "ΜΟΤ"
// index 7  bodywork      → "Body & paint" / "Φανοποιΐα & βαφή"
// index 8  clutch        → "Clutch replacement" / "Αλλαγή συμπλέκτη"
// index 9  other         → "Other" / "Άλλο"
export const SERVICE_CODES = [
  "full_service",
  "service_oil",
  "brakes",
  "tyres",
  "alignment",
  "diagnostic",
  "mot",
  "bodywork",
  "clutch",
  "other",
] as const;

export type ServiceCode = (typeof SERVICE_CODES)[number];

/**
 * Maps a serviceOptions index to its stable service code. Returns null for a
 * negative index (e.g. the "nothing selected" sentinel of -1).
 */
export function serviceCodeFromIndex(i: number): ServiceCode | null {
  if (i < 0) return null;
  return SERVICE_CODES[i] ?? null;
}

/**
 * Localizes a stored service code to a display string. `options` is the active
 * language's `t.serviceOptions`. Falls back to the raw code if it is not a
 * known service code (forward-compatible with codes added later).
 */
export function localizeServiceCode(code: string, options: string[]): string {
  const index = (SERVICE_CODES as readonly string[]).indexOf(code);
  if (index < 0) return code;
  return options[index] ?? code;
}
