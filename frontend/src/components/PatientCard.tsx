import { User, Calendar, MapPin, Activity, CloudRain, Users } from "lucide-react";
import type { Patient, PredictionResult } from "../types";
import RiskBadge from "./RiskBadge";
import RiskFactorList from "./RiskFactorList";
import OutreachButton from "./OutreachButton";

interface PatientCardProps {
  patient: Patient;
  prediction: PredictionResult;
}

const specialtyLabel: Record<string, string> = {
  physiotherapy: "Physiotherapy",
  psychotherapy: "Psychotherapy",
  "speech therapy": "Speech Therapy",
  "occupational therapy": "Occupational Therapy",
  enf: "Nursing",
  assist: "Social Assistance",
  pedagogo: "Pedagogy",
  "sem especialidade": "General",
};

export default function PatientCard({ patient, prediction }: PatientCardProps) {
  const apptDate = new Date(patient.appointmentDate).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const flags = [
    patient.under12 && "Under 12",
    patient.over60 && "Over 60",
    patient.disability && patient.disability.trim() !== "" && `Disability: ${patient.disability}`,
  ].filter(Boolean) as string[];

  const weatherDesc = [
    patient.stormDayBefore && "Storm yesterday",
    patient.rainyDayBefore && !patient.stormDayBefore && "Rain yesterday",
    patient.rainIntensity !== "no_rain" && `${patient.rainIntensity} rain forecast`,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Epic-style header */}
      <div className="bg-blue-950 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{patient.name}</p>
            <p className="text-blue-200 text-xs">MRN: {patient.mrn}</p>
          </div>
        </div>
        <span className="text-blue-200 text-xs">Epic EMR</span>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Demographics + Appointment */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Patient Info</p>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                DOB: {patient.dob} · Age {patient.age}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                {patient.city}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Appointment</p>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                {apptDate}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {patient.appointmentTime} · {patient.appointmentShift}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {specialtyLabel[patient.specialty] ?? patient.specialty}
              </div>
            </div>
          </div>

          {flags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Patient Flags</p>
              <div className="flex flex-wrap gap-1.5">
                {flags.map((f) => (
                  <span key={f} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{f}</span>
                ))}
                {patient.needsCompanion === 1 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                    <Users className="w-3 h-3" /> Needs companion
                  </span>
                )}
              </div>
            </div>
          )}

          {weatherDesc.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Weather</p>
              <div className="flex flex-wrap gap-1.5">
                {weatherDesc.map((w) => (
                  <span key={w} className="flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded text-xs">
                    <CloudRain className="w-3 h-3" />{w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Risk Panel */}
        <div className="border-l border-gray-100 pl-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            No-Show Risk Assessment
          </p>
          <RiskBadge level={prediction.risk_level} probability={prediction.no_show_probability} />
          <RiskFactorList factors={prediction.risk_factors} />
          {prediction.risk_level !== "low" && (
            <div className="mt-5">
              <OutreachButton
                patientId={patient.id}
                patientName={patient.name}
                appointmentDate={apptDate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
