import type { Metadata } from "next";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Costas · Εγγραφή Συνεργείου",
  description:
    "Εγγραφή συνεργείου στο δίκτυο πιστοποιημένων μηχανικών της Costas.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <RegisterForm />
    </div>
  );
}
