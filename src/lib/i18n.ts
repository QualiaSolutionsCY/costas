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
  // auth lifecycle: signup + forgot password
  signUpTitle: string;
  signUpSubtitle: string;
  signUpBtn: string;
  signingUp: string;
  confirmPasswordLabel: string;
  errPwMismatch: string;
  errEmailExists: string;
  haveAccount: string;
  noAccount: string;
  signUpLink: string;
  forgotPassword: string;
  forgotTitle: string;
  forgotSubtitle: string;
  sendResetBtn: string;
  resetSent: string;
  resetSentSub: string;
  // auth lifecycle: reset-password completion
  resetPwTitle: string;
  resetPwSub: string;
  resetLinkExpired: string;
  setNewPassword: string;
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
  // admin: workshop verification review
  adminTitle: string;
  adminSubtitle: string;
  adminPending: (n: number) => string;
  adminEmpty: string;
  adminSerial: string;
  adminRegistered: string;
  adminCert: string;
  adminNoCert: string;
  // workshop verification badges + review actions
  certified: string;
  pendingReview: string;
  rejected: string;
  approve: string;
  reject: string;
  rejectReason: string;
  confirmReject: string;
  adminApproved: string;
  adminRejected: string;
  // settings: profile, vehicles, security
  profileSection: string;
  vehiclesSection: string;
  securitySection: string;
  settingsPageSubtitle: string;
  phoneLabel: string;
  phonePlaceholder: string;
  saveProfile: string;
  profileSaved: string;
  editVehicle: string;
  removeVehicle: string;
  confirmRemove: string;
  confirmRemoveHint: string;
  yearLabel: string;
  yearPlaceholder: string;
  changePassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordChanged: string;
  settingsSignedOut: string;
  settingsSignedOutHint: string;
  saving: string;
  backToLog: string;
  // M4: booking — owner books a service, workshop sees incoming requests
  bookTitle: string;
  bookSubtitle: string;
  bookWorkshopLabel: string;
  bookWorkshopPlaceholder: string;
  bookWorkshopFreeHint: string;
  bookServiceLabel: string;
  bookDateLabel: string;
  bookPlateLabel: string;
  bookNoteLabel: string;
  bookNotePlaceholder: string;
  bookSubmit: string;
  bookSubmitting: string;
  bookSent: string;
  bookError: string;
  myBookingsTitle: string;
  myBookingsEmpty: string;
  incomingTitle: string;
  incomingSubtitle: string;
  incomingEmpty: string;
  bookingConfirm: string;
  bookingMarkDone: string;
  bookingCancel: string;
  statusRequested: string;
  statusConfirmed: string;
  statusDone: string;
  statusCancelled: string;
  bookCta: string;
  // M5: reminders & notifications
  remindersTitle: string;
  remindersSubtitle: string;
  remindersEmpty: string;
  reminderMot: string;
  reminderService: string;
  reminderDueOn: (date: string) => string;
  reminderOverdue: (n: number) => string;
  reminderInDays: (n: number) => string;
  reminderDismiss: string;
  reminderBasedOn: (date: string) => string;
  notificationsLabel: string;
  notificationsCount: (n: number) => string;
  // M5: reminder preferences (consumed by the prefs task)
  reminderPrefsSection: string;
  reminderPrefsInApp: string;
  reminderPrefsEmail: string;
  reminderPrefsAdvance: string;
  reminderPrefsSaved: string;
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
    signUpTitle: "Εγγραφή",
    signUpSubtitle: "Δημιούργησε λογαριασμό οδηγού.",
    signUpBtn: "Εγγραφή",
    signingUp: "Εγγραφή…",
    confirmPasswordLabel: "Επιβεβαίωση κωδικού",
    errPwMismatch: "Οι κωδικοί δεν ταιριάζουν.",
    errEmailExists: "Το email χρησιμοποιείται ήδη.",
    haveAccount: "Έχεις λογαριασμό;",
    noAccount: "Δεν έχεις λογαριασμό;",
    signUpLink: "Εγγραφή",
    forgotPassword: "Ξέχασα τον κωδικό",
    forgotTitle: "Επαναφορά κωδικού",
    forgotSubtitle: "Στείλε σύνδεσμο επαναφοράς στο email σου.",
    sendResetBtn: "Αποστολή συνδέσμου",
    resetSent: "Έλεγξε τα εισερχόμενά σου",
    resetSentSub: "Σου στείλαμε σύνδεσμο επαναφοράς κωδικού.",
    resetPwTitle: "Νέος κωδικός",
    resetPwSub: "Όρισε έναν νέο κωδικό για τον λογαριασμό σου.",
    resetLinkExpired: "Ο σύνδεσμος επαναφοράς δεν ισχύει ή έληξε.",
    setNewPassword: "Ορισμός κωδικού",
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
    adminTitle: "Επαλήθευση Συνεργείων",
    adminSubtitle: "Συνεργεία σε αναμονή έγκρισης.",
    adminPending: (n) => `${n} σε αναμονή`,
    adminEmpty: "Κανένα συνεργείο σε αναμονή",
    adminSerial: "Σειριακός",
    adminRegistered: "Εγγραφή",
    adminCert: "Προβολή πιστοποιητικού",
    adminNoCert: "Χωρίς πιστοποιητικό",
    certified: "Πιστοποιημένο",
    pendingReview: "Σε αναμονή",
    rejected: "Απορρίφθηκε",
    approve: "Έγκριση",
    reject: "Απόρριψη",
    rejectReason: "Λόγος απόρριψης",
    confirmReject: "Επιβεβαίωση",
    adminApproved: "Εγκρίθηκε",
    adminRejected: "Απορρίφθηκε",
    profileSection: "Προφίλ",
    vehiclesSection: "Οχήματα",
    securitySection: "Ασφάλεια",
    settingsPageSubtitle: "Διαχειρίσου το προφίλ, τα οχήματα και την ασφάλειά σου.",
    phoneLabel: "Τηλέφωνο",
    phonePlaceholder: "π.χ. 99 123456",
    saveProfile: "Αποθήκευση προφίλ",
    profileSaved: "Το προφίλ αποθηκεύτηκε",
    editVehicle: "Επεξεργασία",
    removeVehicle: "Αφαίρεση",
    confirmRemove: "Είσαι σίγουρος;",
    confirmRemoveHint: "Το όχημα θα διαγραφεί οριστικά.",
    yearLabel: "Έτος",
    yearPlaceholder: "π.χ. 2019",
    changePassword: "Αλλαγή κωδικού",
    newPassword: "Νέος κωδικός",
    confirmPassword: "Επιβεβαίωση κωδικού",
    passwordChanged: "Ο κωδικός άλλαξε",
    settingsSignedOut: "Συνδέσου για να δεις τις ρυθμίσεις σου",
    settingsSignedOutHint: "Χρειάζεται λογαριασμός για προφίλ και ασφάλεια.",
    saving: "Αποθήκευση…",
    backToLog: "Πίσω",
    bookTitle: "Κλείσε ραντεβού σέρβις",
    bookSubtitle: "Διάλεξε συνεργείο, υπηρεσία και ημερομηνία.",
    bookWorkshopLabel: "Συνεργείο",
    bookWorkshopPlaceholder: "Διάλεξε ή γράψε συνεργείο",
    bookWorkshopFreeHint: "Δεν το βρίσκεις; Γράψε το όνομα.",
    bookServiceLabel: "Υπηρεσία",
    bookDateLabel: "Ημερομηνία",
    bookPlateLabel: "Πινακίδα (προαιρετικό)",
    bookNoteLabel: "Σημείωση (προαιρετικό)",
    bookNotePlaceholder: "π.χ. θόρυβος στα φρένα",
    bookSubmit: "Στείλε αίτημα",
    bookSubmitting: "Αποστολή…",
    bookSent: "Το αίτημα στάλθηκε.",
    bookError: "Κάτι πήγε στραβά. Δοκίμασε ξανά.",
    myBookingsTitle: "Τα ραντεβού μου",
    myBookingsEmpty: "Δεν έχεις ραντεβού ακόμα.",
    incomingTitle: "Εισερχόμενα ραντεβού",
    incomingSubtitle: "Αιτήματα πελατών για σέρβις.",
    incomingEmpty: "Δεν υπάρχουν αιτήματα.",
    bookingConfirm: "Επιβεβαίωση",
    bookingMarkDone: "Ολοκληρώθηκε",
    bookingCancel: "Ακύρωση",
    statusRequested: "Σε αναμονή",
    statusConfirmed: "Επιβεβαιωμένο",
    statusDone: "Ολοκληρωμένο",
    statusCancelled: "Ακυρωμένο",
    bookCta: "Κλείσε ραντεβού",
    remindersTitle: "Υπενθυμίσεις",
    remindersSubtitle: "Επερχόμενα ΜΟΤ και σέρβις, υπολογισμένα από το ιστορικό σου.",
    remindersEmpty: "Όλα εντάξει — δεν υπάρχουν επερχόμενες υπενθυμίσεις.",
    reminderMot: "ΜΟΤ",
    reminderService: "Επόμενο σέρβις",
    reminderDueOn: (date) => `Λήγει ${date}`,
    reminderOverdue: (n) => `Εκπρόθεσμο κατά ${n} ημέρες`,
    reminderInDays: (n) => `Σε ${n} ημέρες`,
    reminderDismiss: "Απόρριψη",
    reminderBasedOn: (date) => `Με βάση το τελευταίο: ${date}`,
    notificationsLabel: "Υπενθυμίσεις",
    notificationsCount: (n) => `${n} υπενθυμίσεις`,
    reminderPrefsSection: "Υπενθυμίσεις",
    reminderPrefsInApp: "Ειδοποιήσεις στην εφαρμογή",
    reminderPrefsEmail: "Ειδοποιήσεις email",
    reminderPrefsAdvance: "Προειδοποίηση (ημέρες)",
    reminderPrefsSaved: "Αποθηκεύτηκε",
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
    signUpTitle: "Sign up",
    signUpSubtitle: "Create an owner account.",
    signUpBtn: "Sign up",
    signingUp: "Signing up…",
    confirmPasswordLabel: "Confirm password",
    errPwMismatch: "Passwords don't match.",
    errEmailExists: "That email is already registered.",
    haveAccount: "Have an account?",
    noAccount: "No account yet?",
    signUpLink: "Sign up",
    forgotPassword: "Forgot password",
    forgotTitle: "Reset password",
    forgotSubtitle: "Send a reset link to your email.",
    sendResetBtn: "Send reset link",
    resetSent: "Check your inbox",
    resetSentSub: "We've sent you a password reset link.",
    resetPwTitle: "New password",
    resetPwSub: "Set a new password for your account.",
    resetLinkExpired: "This reset link is invalid or expired.",
    setNewPassword: "Set password",
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
    adminTitle: "Workshop Verification",
    adminSubtitle: "Workshops awaiting approval.",
    adminPending: (n) => `${n} pending`,
    adminEmpty: "No workshops pending review",
    adminSerial: "Serial",
    adminRegistered: "Registered",
    adminCert: "View certificate",
    adminNoCert: "No certificate",
    certified: "Certified",
    pendingReview: "Pending",
    rejected: "Rejected",
    approve: "Approve",
    reject: "Reject",
    rejectReason: "Reason for rejection",
    confirmReject: "Confirm",
    adminApproved: "Approved",
    adminRejected: "Rejected",
    profileSection: "Profile",
    vehiclesSection: "Vehicles",
    securitySection: "Security",
    settingsPageSubtitle: "Manage your profile, vehicles and security.",
    phoneLabel: "Phone",
    phonePlaceholder: "e.g. 99 123456",
    saveProfile: "Save profile",
    profileSaved: "Profile saved",
    editVehicle: "Edit",
    removeVehicle: "Remove",
    confirmRemove: "Are you sure?",
    confirmRemoveHint: "This vehicle will be permanently deleted.",
    yearLabel: "Year",
    yearPlaceholder: "e.g. 2019",
    changePassword: "Change password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    passwordChanged: "Password changed",
    settingsSignedOut: "Sign in to see your settings",
    settingsSignedOutHint: "An account is needed for profile and security.",
    saving: "Saving…",
    backToLog: "Back",
    bookTitle: "Book a service",
    bookSubtitle: "Pick a workshop, service and date.",
    bookWorkshopLabel: "Workshop",
    bookWorkshopPlaceholder: "Choose or type a workshop",
    bookWorkshopFreeHint: "Can't find it? Type the name.",
    bookServiceLabel: "Service",
    bookDateLabel: "Date",
    bookPlateLabel: "Plate (optional)",
    bookNoteLabel: "Note (optional)",
    bookNotePlaceholder: "e.g. noise on braking",
    bookSubmit: "Send request",
    bookSubmitting: "Sending…",
    bookSent: "Request sent.",
    bookError: "Something went wrong. Try again.",
    myBookingsTitle: "My bookings",
    myBookingsEmpty: "No bookings yet.",
    incomingTitle: "Incoming bookings",
    incomingSubtitle: "Customer service requests.",
    incomingEmpty: "No requests.",
    bookingConfirm: "Confirm",
    bookingMarkDone: "Mark done",
    bookingCancel: "Cancel",
    statusRequested: "Requested",
    statusConfirmed: "Confirmed",
    statusDone: "Done",
    statusCancelled: "Cancelled",
    bookCta: "Book a service",
    remindersTitle: "Reminders",
    remindersSubtitle: "Upcoming MOT and service dates, computed from your history.",
    remindersEmpty: "All clear — no upcoming reminders.",
    reminderMot: "MOT",
    reminderService: "Next service",
    reminderDueOn: (date) => `Due ${date}`,
    reminderOverdue: (n) => `Overdue by ${n} days`,
    reminderInDays: (n) => `In ${n} days`,
    reminderDismiss: "Dismiss",
    reminderBasedOn: (date) => `Based on last: ${date}`,
    notificationsLabel: "Reminders",
    notificationsCount: (n) => `${n} reminders`,
    reminderPrefsSection: "Reminders",
    reminderPrefsInApp: "In-app notifications",
    reminderPrefsEmail: "Email notifications",
    reminderPrefsAdvance: "Advance notice (days)",
    reminderPrefsSaved: "Saved",
  },
};
