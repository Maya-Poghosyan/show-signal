import { useState } from "react";
import { MessageSquare, CheckCircle, Loader2 } from "lucide-react";

interface OutreachButtonProps {
  patientId: string;
  patientName: string;
  appointmentDate: string;
}

export default function OutreachButton({ patientId, patientName, appointmentDate }: OutreachButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleOutreach() {
    setStatus("loading");
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          patient_name: patientName,
          appointment_date: appointmentDate,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
        <CheckCircle className="w-5 h-5" />
        SMS sent — agent will handle replies automatically
      </div>
    );
  }

  return (
    <button
      onClick={handleOutreach}
      disabled={status === "loading"}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
    >
      {status === "loading" ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageSquare className="w-4 h-4" />
      )}
      {status === "loading" ? "Sending..." : "Reach Out"}
      {status === "error" && <span className="text-red-300 ml-1">· Failed, retry?</span>}
    </button>
  );
}
