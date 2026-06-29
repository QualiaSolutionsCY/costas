// Cyprus plates are written with letters that exist in BOTH the Greek and Latin
// alphabets (ΚΧΡ looks identical to KXP but is a different byte string). Owners
// type on a Latin keyboard, workshops may type Greek — so we canonicalize every
// plate to a single Latin, upper-cased, single-spaced form. This is what makes
// "one vehicle, both sides" work: owner and mechanic resolve to the SAME row.

const GREEK_TO_LATIN: Record<string, string> = {
  Α: "A", Β: "B", Ε: "E", Ζ: "Z", Η: "H", Ι: "I", Κ: "K",
  Μ: "M", Ν: "N", Ο: "O", Ρ: "P", Τ: "T", Υ: "Y", Χ: "X",
};

export function normalizePlate(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .split("")
    .map((ch) => GREEK_TO_LATIN[ch] ?? ch)
    .join("")
    .replace(/\s+/g, " ");
}
