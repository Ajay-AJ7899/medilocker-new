// Mock prediction data — will be replaced by real ML model output later

export interface PredictionData {
  id: string;
  patient_id: string;
  predicted_disease: string;
  confidence: number;
  risk_level: "low" | "medium" | "high" | "critical";
  explainability: ExplainFactor[];
  prevention: string[];
  reference_links: ReferenceLink[];
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface ExplainFactor {
  factor: string;
  contribution: number; // percentage
  description: string;
}

export interface ReferenceLink {
  title: string;
  url: string;
  source: string;
}

export const MOCK_PREDICTIONS: PredictionData[] = [
  {
    id: "pred-001",
    patient_id: "",
    predicted_disease: "Type 2 Diabetes Mellitus",
    confidence: 87.5,
    risk_level: "high",
    explainability: [
      { factor: "Fasting Blood Glucose", contribution: 35, description: "Elevated fasting glucose levels (126 mg/dL) indicate impaired glucose regulation" },
      { factor: "BMI", contribution: 25, description: "BMI of 31.2 falls in the obese category, a major risk factor" },
      { factor: "Family History", contribution: 20, description: "First-degree relative with Type 2 Diabetes" },
      { factor: "HbA1c Levels", contribution: 15, description: "HbA1c at 6.8% indicates pre-diabetic to diabetic range" },
      { factor: "Age", contribution: 5, description: "Age 52 increases risk for metabolic disorders" },
    ],
    prevention: [
      "Maintain a balanced diet with low glycemic index foods",
      "Exercise at least 150 minutes per week (moderate intensity)",
      "Monitor blood glucose levels regularly",
      "Reduce refined sugar and processed carbohydrate intake",
      "Maintain a healthy weight (target BMI < 25)",
      "Schedule regular check-ups every 3 months",
    ],
    reference_links: [
      { title: "ADA Standards of Care in Diabetes", url: "https://diabetesjournals.org/care", source: "American Diabetes Association" },
      { title: "Type 2 Diabetes Prevention", url: "https://www.cdc.gov/diabetes/prevention", source: "CDC" },
      { title: "Diabetes Risk Factors", url: "https://www.who.int/news-room/fact-sheets/detail/diabetes", source: "WHO" },
    ],
    status: "pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "pred-002",
    patient_id: "",
    predicted_disease: "Hypertension Stage 1",
    confidence: 72.3,
    risk_level: "medium",
    explainability: [
      { factor: "Systolic BP", contribution: 40, description: "Average systolic BP of 138 mmHg exceeds normal range" },
      { factor: "Sodium Intake", contribution: 25, description: "Dietary analysis shows high sodium consumption" },
      { factor: "Stress Levels", contribution: 20, description: "Self-reported chronic stress with elevated cortisol" },
      { factor: "Physical Inactivity", contribution: 15, description: "Sedentary lifestyle with < 60 min exercise/week" },
    ],
    prevention: [
      "Reduce sodium intake to less than 2,300 mg/day",
      "Practice stress management (meditation, yoga)",
      "Increase potassium-rich foods in diet",
      "Regular aerobic exercise (30 min/day, 5 days/week)",
      "Limit alcohol consumption",
      "Monitor blood pressure daily at home",
    ],
    reference_links: [
      { title: "ACC/AHA Hypertension Guidelines", url: "https://www.acc.org/guidelines", source: "American College of Cardiology" },
      { title: "High Blood Pressure Prevention", url: "https://www.heart.org/en/health-topics/high-blood-pressure", source: "AHA" },
    ],
    status: "pending",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];
