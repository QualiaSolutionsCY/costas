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
  recordedOwn: string;
  statServices: string;
  statLast: string;
  statNone: string;
  historyEmpty: string;
  historyEmptyHint: string;
  loading: string;
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
  jobsToday: (n: number) => string;
  recentEmpty: string;
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
  submitting: string;
  // auth
  loginTitle: string;
  loginSubtitle: string;
  emailLabel: string;
  passwordLabel: string;
  signInBtn: string;
  signingIn: string;
  signOut: string;
  loginError: string;
  demoHint: string;
  // flow states / errors
  placeLabel: string;
  errService: string;
  errPlate: string;
  errSave: string;
  loadError: string;
  retry: string;
  viewCert: string;
  // owner: multi-vehicle + city + which-mechanic
  cityLabel: string;
  cityPlaceholder: string;
  cities: string[];
  mechanicLabel: string;
  mechanicPlaceholder: string;
  addVehicle: string;
  vehicleModelPlaceholder: string;
  vehiclePlatePlaceholder: string;
  saveVehicle: string;
  cancel: string;
  selectVehicle: string;
  // owner ⇄ mechanic toggle
  ownerView: string;
  mechanicView: string;
  // mechanic: visual car flow
  plateFirstHint: string;
  tapWhatYouFixed: string;
  suggestedService: string;
  registerJob: string;
  carHistory: string;
  partWheels: string;
  partBrakes: string;
  partEngine: string;
  partBody: string;
  partLights: string;
  partWindshield: string;
  partSuspension: string;
  partExhaust: string;
  // onboarding intro
  onbTitle: string;
  onbSub: string;
  onbFeat1: string;
  onbFeat2: string;
  onbFeat3: string;
  onbStart: string;
  // welcome / role chooser
  welcomeTitle: string;
  welcomeSubtitle: string;
  roleOwnerTitle: string;
  roleOwnerDesc: string;
  roleMechTitle: string;
  roleMechDesc: string;
  useEmailInstead: string;
  // navigation panels
  vehiclesSubtitle: string;
  settingsSubtitle: string;
  openLog: string;
  prefLanguage: string;
  prefLanguageHint: string;
  settingsAbout: string;
  settingsAboutText: string;
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
    recordedOwn: "Καταχωρήθηκε στο ιστορικό σου",
    statServices: "Καταγραφές",
    statLast: "Τελευταίο",
    statNone: "—",
    historyEmpty: "Καμία καταγραφή ακόμα",
    historyEmptyHint: "Πρόσθεσε το πρώτο σέρβις παραπάνω.",
    loading: "Φόρτωση…",
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
    jobsToday: (n) => `${n} σήμερα`,
    recentEmpty: "Καμία καταγραφή ακόμα",
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
    submitting: "Υποβολή…",
    loginTitle: "Σύνδεση",
    loginSubtitle: "Συνδέσου για να δεις το ιστορικό σου.",
    emailLabel: "Email",
    passwordLabel: "Κωδικός",
    signInBtn: "Σύνδεση",
    signingIn: "Σύνδεση…",
    signOut: "Αποσύνδεση",
    loginError: "Λάθος email ή κωδικός.",
    demoHint: "Demo · owner@costas.demo ή mechanic@costas.demo · costas123",
    placeLabel: "Πού έγινε;",
    errService: "Διάλεξε υπηρεσία.",
    errPlate: "Πρόσθεσε πινακίδα πριν αποθηκεύσεις.",
    errSave: "Κάτι πήγε στραβά. Δοκίμασε ξανά.",
    loadError: "Αποτυχία φόρτωσης.",
    retry: "Δοκίμασε ξανά",
    viewCert: "Προβολή πιστοποιητικού",
    cityLabel: "Πόλη",
    cityPlaceholder: "Διάλεξε πόλη",
    cities: ["Λευκωσία", "Λεμεσός", "Λάρνακα", "Πάφος", "Αμμόχωστος", "Παραλίμνι", "Κερύνεια"],
    mechanicLabel: "Συνεργείο / μηχανικός",
    mechanicPlaceholder: "π.χ. AutoCheck",
    addVehicle: "Προσθήκη οχήματος",
    vehicleModelPlaceholder: "π.χ. VW Golf 2019",
    vehiclePlatePlaceholder: "π.χ. ΚΧΡ 412",
    saveVehicle: "Αποθήκευση",
    cancel: "Άκυρο",
    selectVehicle: "Επιλογή οχήματος",
    ownerView: "Οδηγός",
    mechanicView: "Συνεργείο",
    plateFirstHint: "Βάλε πρώτα τον αριθμό πινακίδας.",
    tapWhatYouFixed: "Διάλεξε τι έφτιαξες",
    suggestedService: "Προτεινόμενη υπηρεσία",
    registerJob: "Καταχώρηση στο όχημα",
    carHistory: "Ιστορικό οχήματος",
    partWheels: "Τροχοί / ελαστικά",
    partBrakes: "Φρένα",
    partEngine: "Κινητήρας",
    partBody: "Αμάξωμα",
    partLights: "Φώτα",
    partWindshield: "Παρμπρίζ",
    partSuspension: "Ανάρτηση",
    partExhaust: "Εξάτμιση",
    onbTitle: "Το βιβλίο σέρβις του αυτοκινήτου σου",
    onbSub: "Όλο το ιστορικό σέρβις σε ένα μέρος — γραμμένο από τον οδηγό και το συνεργείο.",
    onbFeat1: "Κατέγραψε κάθε σέρβις με πόλη και συνεργείο",
    onbFeat2: "Ο μηχανικός καταχωρεί εργασίες οπτικά, πάνω στο αυτοκίνητο",
    onbFeat3: "Ένα ιστορικό, και από τις δύο πλευρές του πάγκου",
    onbStart: "Ξεκίνα",
    welcomeTitle: "Καλώς ήρθες στο Costas",
    welcomeSubtitle: "Πώς θα χρησιμοποιήσεις την εφαρμογή;",
    roleOwnerTitle: "Είμαι οδηγός",
    roleOwnerDesc: "Κράτα το ιστορικό σέρβις του αυτοκινήτου σου.",
    roleMechTitle: "Είμαι μηχανικός",
    roleMechDesc: "Καταχώρησε εργασίες στο ιστορικό των οχημάτων.",
    useEmailInstead: "Σύνδεση με email",
    vehiclesSubtitle: "Τα οχήματα που παρακολουθείς.",
    settingsSubtitle: "Προτιμήσεις λογαριασμού.",
    openLog: "Άνοιγμα βιβλίου",
    prefLanguage: "Γλώσσα",
    prefLanguageHint: "Η γλώσσα της εφαρμογής",
    settingsAbout: "Σχετικά",
    settingsAboutText: "Costas — δίγλωσσο βιβλίο σέρβις αυτοκινήτου για την Κύπρο.",
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
    recordedOwn: "Logged to your history",
    statServices: "Records",
    statLast: "Last",
    statNone: "—",
    historyEmpty: "No services logged yet",
    historyEmptyHint: "Add the first service above.",
    loading: "Loading…",
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
    jobsToday: (n) => `${n} today`,
    recentEmpty: "No entries yet",
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
    submitting: "Submitting…",
    loginTitle: "Sign in",
    loginSubtitle: "Sign in to see your history.",
    emailLabel: "Email",
    passwordLabel: "Password",
    signInBtn: "Sign in",
    signingIn: "Signing in…",
    signOut: "Sign out",
    loginError: "Wrong email or password.",
    demoHint: "Demo · owner@costas.demo or mechanic@costas.demo · costas123",
    placeLabel: "Where?",
    errService: "Pick a service.",
    errPlate: "Add a plate before saving.",
    errSave: "Something went wrong. Try again.",
    loadError: "Couldn't load.",
    retry: "Try again",
    viewCert: "View certificate",
    cityLabel: "City",
    cityPlaceholder: "Select city",
    cities: ["Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Paralimni", "Kyrenia"],
    mechanicLabel: "Workshop / mechanic",
    mechanicPlaceholder: "e.g. AutoCheck",
    addVehicle: "Add vehicle",
    vehicleModelPlaceholder: "e.g. VW Golf 2019",
    vehiclePlatePlaceholder: "e.g. ΚΧΡ 412",
    saveVehicle: "Save",
    cancel: "Cancel",
    selectVehicle: "Select vehicle",
    ownerView: "Owner",
    mechanicView: "Mechanic",
    plateFirstHint: "Enter the plate number first.",
    tapWhatYouFixed: "Tap what you fixed",
    suggestedService: "Suggested service",
    registerJob: "Register to vehicle",
    carHistory: "Vehicle history",
    partWheels: "Wheels / tyres",
    partBrakes: "Brakes",
    partEngine: "Engine",
    partBody: "Body",
    partLights: "Lights",
    partWindshield: "Windshield",
    partSuspension: "Suspension",
    partExhaust: "Exhaust",
    onbTitle: "Your car's service logbook",
    onbSub: "The whole service history in one place — written from both the owner and the workshop.",
    onbFeat1: "Log every service with city and workshop",
    onbFeat2: "The mechanic logs jobs visually, right on the car",
    onbFeat3: "One history, from both sides of the counter",
    onbStart: "Get started",
    welcomeTitle: "Welcome to Costas",
    welcomeSubtitle: "How will you use the app?",
    roleOwnerTitle: "I'm a car owner",
    roleOwnerDesc: "Keep your car's full service history.",
    roleMechTitle: "I'm a mechanic",
    roleMechDesc: "Log jobs into vehicles' service history.",
    useEmailInstead: "Sign in with email",
    vehiclesSubtitle: "The vehicles you're tracking.",
    settingsSubtitle: "Account preferences.",
    openLog: "Open log",
    prefLanguage: "Language",
    prefLanguageHint: "The app's language",
    settingsAbout: "About",
    settingsAboutText: "Costas — a bilingual car service log for Cyprus.",
  },
};
