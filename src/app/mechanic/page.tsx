import { MechanicLog } from "@/components/MechanicLog";

export const metadata = {
  title: "Costas · Πλευρά Συνεργείου",
};

export default function MechanicPage() {
  return (
    <div className="min-h-screen bg-background">
      <MechanicLog />
    </div>
  );
}
