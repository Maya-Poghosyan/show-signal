import { useEffect, useState } from "react";
import type { PatientWithPrediction, Patient, PredictionResult } from "./types";
import PatientSidebar from "./components/PatientSidebar";
import PatientCard from "./components/PatientCard";

function toPatient(p: PatientWithPrediction): Patient {
  return {
    id: p.id,
    name: p.name,
    dob: p.dob,
    gender: p.gender,
    mrn: p.mrn,
    age: p.age,
    specialty: p.specialty,
    appointmentTime: p.appointment_time,
    appointmentDate: p.appointment_date,
    appointmentShift: p.appointment_shift,
    city: p.city,
    under12: p.under_12_years_old,
    over60: p.over_60_years_old,
    needsCompanion: p.patient_needs_companion,
    disability: p.disability,
    rainyDayBefore: p.rainy_day_before,
    stormDayBefore: p.storm_day_before,
    rainIntensity: p.rain_intensity,
    heatIntensity: p.heat_intensity,
    avgTemp: p.average_temp_day,
    avgRain: p.average_rain_day,
  };
}

function toPrediction(p: PatientWithPrediction): PredictionResult {
  return {
    no_show_probability: p.no_show_probability,
    risk_level: p.risk_level,
    risk_factors: p.risk_factors,
  };
}

export default function App() {
  const [patients, setPatients] = useState<PatientWithPrediction[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then((data: PatientWithPrediction[]) => {
        setPatients(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const selected = patients.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-950 text-white px-6 py-3 flex items-center gap-4 shadow z-10">
        <span className="font-bold text-lg tracking-tight">ShowSignal</span>
        <span className="text-blue-300 text-sm">· Patient Schedule · Today</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Loading patients...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500 text-sm">
            {error} — is the backend running?
          </div>
        ) : (
          <>
            <PatientSidebar
              patients={patients}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <main className="flex-1 overflow-y-auto p-6">
              {selected ? (
                <PatientCard
                  patient={toPatient(selected)}
                  prediction={toPrediction(selected)}
                />
              ) : (
                <p className="text-gray-400 text-sm">Select a patient from the list.</p>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}
