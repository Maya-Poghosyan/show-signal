import { AlertTriangle } from "lucide-react";

interface RiskFactorListProps {
  factors: string[];
}

export default function RiskFactorList({ factors }: RiskFactorListProps) {
  if (factors.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Contributing Risk Factors
      </p>
      <ul className="space-y-1">
        {factors.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
