import { RegisterForm } from "@/components/RegisterForm";

export const metadata = {
  title: "Costas · Εγγραφή Συνεργείου",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <RegisterForm />
    </div>
  );
}
