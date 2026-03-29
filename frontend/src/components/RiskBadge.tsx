interface RiskBadgeProps {
  level: "low" | "medium" | "high";
  probability: number;
}

const colors = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

export default function RiskBadge({ level, probability }: RiskBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${colors[level]}`}>
      <span className="capitalize">{level} Risk</span>
      <span className="opacity-70">·</span>
      <span>{Math.round(probability * 100)}% no-show probability</span>
    </div>
  );
}
