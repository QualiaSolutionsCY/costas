import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";
import { getSessionRole } from "@/lib/session";

export const metadata = {
  title: "Costas · Εγγραφή Συνεργείου",
};

export default async function RegisterPage() {
  const role = await getSessionRole();
  if (!role) redirect("/welcome");

  return (
    <div className="min-h-screen bg-background">
      <RegisterForm />
    </div>
  );
}
