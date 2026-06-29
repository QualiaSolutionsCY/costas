import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Costas · Σύνδεση",
  description: "Συνδέσου στον λογαριασμό σου Costas.",
  robots: { index: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
