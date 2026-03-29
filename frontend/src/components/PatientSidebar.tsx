interface SidebarPatient {
  id: string;
  name: string;
  age: number;
  appointment_date: string;
  risk_level: "low" | "medium" | "high";
  no_show_probability: number;
}

interface PatientSidebarProps {
  patients: SidebarPatient[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const riskColors = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export default function PatientSidebar({ patients, selectedId, onSelect }: PatientSidebarProps) {
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's Schedule</p>
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {patients.map((p) => {
          const apptDate = new Date(p.appointment_date).toLocaleDateString("en-US", {
            month: "short", day: "numeric",
          });
          const isSelected = p.id === selectedId;
          return (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p.id)}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${isSelected ? "bg-blue-50 border-l-2 border-blue-600" : "border-l-2 border-transparent"}`}
              >
                <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Age {p.age} · {apptDate}</p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${riskColors[p.risk_level]}`}>
                  {p.risk_level} risk · {Math.round(p.no_show_probability * 100)}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
