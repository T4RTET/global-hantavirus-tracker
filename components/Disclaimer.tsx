import { ShieldAlert } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
      <p>
        This tracker aggregates publicly reported data and is not a medical authority. Counts distinguish confirmed,
        suspected, deaths, and monitoring reports; ambiguous or social-only reports are excluded from confirmed totals.
      </p>
    </div>
  );
}
