import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Costas · Δημιουργία λογαριασμού",
  description:
    "Δημιούργησε λογαριασμό Costas για να καταγράφεις το ιστορικό του αυτοκινήτου σου.",
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
