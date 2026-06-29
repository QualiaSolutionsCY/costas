import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Costas · Ξέχασες τον κωδικό σου",
  description: "Ζήτησε σύνδεσμο επαναφοράς κωδικού για τον λογαριασμό σου.",
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
