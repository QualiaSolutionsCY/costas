import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Costas · Καλωσήρθες",
  description:
    "Ξεκίνα με την Costas — διάλεξε ρόλο και μπες στην εφαρμογή.",
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
