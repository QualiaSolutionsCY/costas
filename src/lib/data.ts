// Costas — απλό βιβλίο σέρβις αυτοκινήτου.
// Κάθε φορά που το αυτοκίνητο πάει για σέρβις, καταγράφεται ΠΟΥ έγινε.
// Τα κείμενα UI + sample data ζουν στο lib/i18n.ts (δίγλωσσο).

export type NavKey = "log" | "vehicles" | "settings";
export type NavItem = { key: NavKey; icon: string };

export const navItems: NavItem[] = [
  { key: "log", icon: "wrench" },
  { key: "vehicles", icon: "car" },
  { key: "settings", icon: "settings" },
];

export const car = {
  model: "VW Golf 2019",
  plate: "ΚΧΡ 412",
};

export const workshop = {
  name: "AutoCheck",
};

export type LogEntry = { id: string; date: string; place?: string; note?: string };
export type WorkLog = { id: string; date: string; plate: string; work: string };
