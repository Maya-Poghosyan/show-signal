export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: string;
  mrn: string;
  age: number;
  specialty: string;
  appointmentTime: string;
  appointmentDate: string;
  appointmentShift: string;
  city: string;
  under12: number;
  over60: number;
  needsCompanion: number;
  disability: string;
  rainyDayBefore: number;
  stormDayBefore: number;
  rainIntensity: string;
  heatIntensity: string;
  avgTemp: number;
  avgRain: number;
}

export interface PredictionResult {
  no_show_probability: number;
  risk_level: "low" | "medium" | "high";
  risk_factors: string[];
}

// Shape returned by GET /patients (snake_case from Python)
export interface PatientWithPrediction {
  id: string;
  name: string;
  dob: string;
  gender: string;
  mrn: string;
  age: number;
  specialty: string;
  appointment_time: string;
  appointment_date: string;
  appointment_shift: string;
  city: string;
  under_12_years_old: number;
  over_60_years_old: number;
  patient_needs_companion: number;
  disability: string;
  rainy_day_before: number;
  storm_day_before: number;
  rain_intensity: string;
  heat_intensity: string;
  average_temp_day: number;
  average_rain_day: number;
  no_show_probability: number;
  risk_level: "low" | "medium" | "high";
  risk_factors: string[];
}
