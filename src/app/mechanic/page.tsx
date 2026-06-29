import { MechanicLog } from "@/components/MechanicLog";

export const metadata = {
  title: "Costas · Πλευρά Συνεργείου",
};

// No auth gate — login is optional. Anonymous mechanics can resolve a plate,
// tap the car, and register a job. The visual flow lives entirely client-side
// in MechanicLog; history loads per-plate via the getPlateHistory server action.
export default function MechanicPage() {
  return (
    <div className="min-h-screen bg-background">
      <MechanicLog />
    </div>
  );
}
