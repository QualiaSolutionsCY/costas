// Δίγλωσσο λεξικό — Ελληνικά / English. UI strings + sample data.
export type Lang = "el" | "en";

export type SeedEntry = { date: string; place: string; note: string };
export type MechSeedEntry = { date: string; plate: string; work: string };

export type Translation = {
  tagline: string;
  nav: { log: string; vehicles: string; settings: string };
  sidebarNote: string;
  topbarTitle: string;
  openMenu: string;
  entries: (n: number) => string;
  recordTitle: string;
  recordSubtitle: string;
  placePlaceholder: string;
  notePlaceholder: string;
  recordBtn: string;
  historyTitle: string;
  servicedAt: string;
  // mechanic
  workshopCity: string;
  mechCertified: string;
  mechSubtitle: string;
  plateLabel: string;
  platePlaceholder: string;
  workLabel: string;
  servicePlaceholder: string;
  serviceOptions: string[];
  dateLabel: string;
  mechRecordBtn: string;
  recordedTo: (plate: string) => string;
  recentTitle: string;
  seedLog: SeedEntry[];
  mechanicSeed: MechSeedEntry[];
  // registration
  regTitle: string;
  regSubtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  serialLabel: string;
  serialPlaceholder: string;
  certLabel: string;
  certHint: string;
  shopDefaultLabel: string;
  submitReg: string;
  regDone: string;
  regDoneSub: string;
  changeFile: string;
  removeFile: string;
  registerAnother: string;
  registerLink: string;
};

export const translations: Record<Lang, Translation> = {
  el: {
    tagline: "Βιβλίο Σέρβις",
    nav: { log: "Βιβλίο Σέρβις", vehicles: "Τα Οχήματά μου", settings: "Ρυθμίσεις" },
    sidebarNote: "Κράτα το πλήρες ιστορικό σέρβις του αυτοκινήτου σου — πού και πότε έγινε κάθε εργασία.",
    topbarTitle: "Βιβλίο Σέρβις",
    openMenu: "Άνοιγμα μενού",
    entries: (n) => `${n} καταχωρήσεις`,
    recordTitle: "Καταγραφή σέρβις",
    recordSubtitle: "Διάλεξε υπηρεσία και ημερομηνία.",
    placePlaceholder: "Πού έγινε; (π.χ. AutoCheck, Λευκωσία)",
    notePlaceholder: "Τι έγινε; (προαιρετικό)",
    recordBtn: "Καταγραφή",
    historyTitle: "Ιστορικό σέρβις",
    servicedAt: "Σέρβις στο",
    workshopCity: "Λευκωσία",
    mechCertified: "Πιστοποιημένο συνεργείο",
    mechSubtitle: "Καταχώρησε την εργασία στο ιστορικό του οχήματος.",
    plateLabel: "Πινακίδα οχήματος",
    platePlaceholder: "π.χ. ΚΧΡ 412",
    workLabel: "Τι έγινε",
    servicePlaceholder: "Διάλεξε υπηρεσία",
    serviceOptions: [
      "Πλήρες service",
      "Service & λάδια",
      "Αλλαγή φρένων",
      "Αλλαγή ελαστικών",
      "Ευθυγράμμιση",
      "Διαγνωστικός έλεγχος",
      "ΜΟΤ",
      "Φανοποιΐα & βαφή",
      "Αλλαγή συμπλέκτη",
      "Άλλο",
    ],
    dateLabel: "Ημερομηνία",
    mechRecordBtn: "Καταγραφή στο ιστορικό",
    recordedTo: (plate) => `Καταχωρήθηκε στο όχημα ${plate}`,
    recentTitle: "Πρόσφατες καταγραφές",
    seedLog: [
      { date: "2025-02-12", place: "AutoCheck, Λευκωσία", note: "Αλλαγή φρένων" },
      { date: "2024-11-03", place: "ProMotors, Λεμεσός", note: "Service & λάδια" },
      { date: "2024-07-21", place: "CarFix, Λάρνακα", note: "Αλλαγή συμπλέκτη" },
      { date: "2024-03-15", place: "SpeedCheck, Λευκωσία", note: "ΜΟΤ" },
    ],
    mechanicSeed: [
      { date: "2025-02-12", plate: "ΚΧΡ 412", work: "Αλλαγή τακάκια & δίσκοι φρένων" },
      { date: "2025-02-11", plate: "ΖΒΤ 559", work: "Service & αλλαγή λαδιών" },
      { date: "2025-02-10", plate: "ΜΝΛ 087", work: "Διαγνωστικός έλεγχος" },
      { date: "2025-02-08", plate: "ΗΠΚ 230", work: "Έλεγχος ΜΟΤ" },
    ],
    regTitle: "Εγγραφή Συνεργείου",
    regSubtitle: "Συμπλήρωσε τα στοιχεία σου για να ενεργοποιήσεις τον λογαριασμό μηχανικού.",
    nameLabel: "Ονοματεπώνυμο",
    namePlaceholder: "Το πλήρες όνομά σου",
    serialLabel: "Σειριακός αριθμός πιστοποιητικού",
    serialPlaceholder: "π.χ. CY-MOT-4471",
    certLabel: "Πιστοποιητικό",
    certHint: "Σύρε & άφησε ή κάνε κλικ για ανέβασμα (PDF, JPG, PNG)",
    shopDefaultLabel: "Κατάστημα (προεπιλογή)",
    submitReg: "Υποβολή εγγραφής",
    regDone: "Η εγγραφή υποβλήθηκε",
    regDoneSub: "Θα ειδοποιηθείς μόλις επαληθευτεί το πιστοποιητικό σου.",
    changeFile: "Αλλαγή αρχείου",
    removeFile: "Αφαίρεση",
    registerAnother: "Νέα εγγραφή",
    registerLink: "Εγγραφή συνεργείου",
  },
  en: {
    tagline: "Service Log",
    nav: { log: "Service Log", vehicles: "My Vehicles", settings: "Settings" },
    sidebarNote: "Keep the full service history of your car — where and when each job was done.",
    topbarTitle: "Service Log",
    openMenu: "Open menu",
    entries: (n) => `${n} entries`,
    recordTitle: "Log a service",
    recordSubtitle: "Pick a service and date.",
    placePlaceholder: "Where? (e.g. AutoCheck, Nicosia)",
    notePlaceholder: "What was done? (optional)",
    recordBtn: "Log",
    historyTitle: "Service history",
    servicedAt: "Serviced at",
    workshopCity: "Nicosia",
    mechCertified: "Certified workshop",
    mechSubtitle: "Add the job to the vehicle's history.",
    plateLabel: "Vehicle plate",
    platePlaceholder: "e.g. ΚΧΡ 412",
    workLabel: "What was done",
    servicePlaceholder: "Select a service",
    serviceOptions: [
      "Full service",
      "Service & oil change",
      "Brake replacement",
      "Tyre change",
      "Wheel alignment",
      "Diagnostic check",
      "MOT",
      "Body & paint",
      "Clutch replacement",
      "Other",
    ],
    dateLabel: "Date",
    mechRecordBtn: "Add to history",
    recordedTo: (plate) => `Recorded to vehicle ${plate}`,
    recentTitle: "Recent entries",
    seedLog: [
      { date: "2025-02-12", place: "AutoCheck, Nicosia", note: "Brake replacement" },
      { date: "2024-11-03", place: "ProMotors, Limassol", note: "Service & oil" },
      { date: "2024-07-21", place: "CarFix, Larnaca", note: "Clutch replacement" },
      { date: "2024-03-15", place: "SpeedCheck, Nicosia", note: "MOT" },
    ],
    mechanicSeed: [
      { date: "2025-02-12", plate: "ΚΧΡ 412", work: "Brake pads & discs replacement" },
      { date: "2025-02-11", plate: "ΖΒΤ 559", work: "Service & oil change" },
      { date: "2025-02-10", plate: "ΜΝΛ 087", work: "Diagnostic check" },
      { date: "2025-02-08", plate: "ΗΠΚ 230", work: "MOT test" },
    ],
    regTitle: "Workshop Registration",
    regSubtitle: "Fill in your details to activate your mechanic account.",
    nameLabel: "Full name",
    namePlaceholder: "Your full name",
    serialLabel: "Certificate serial number",
    serialPlaceholder: "e.g. CY-MOT-4471",
    certLabel: "Certificate",
    certHint: "Drag & drop or click to upload (PDF, JPG, PNG)",
    shopDefaultLabel: "Shop (default)",
    submitReg: "Submit registration",
    regDone: "Registration submitted",
    regDoneSub: "You'll be notified once your certificate is verified.",
    changeFile: "Change file",
    removeFile: "Remove",
    registerAnother: "New registration",
    registerLink: "Workshop registration",
  },
};
