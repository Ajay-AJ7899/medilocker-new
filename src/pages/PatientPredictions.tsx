import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, Activity, Info, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";

// ─── Field config ───────────────────────────────────────────
interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: string;
}

const FIELDS: FieldConfig[] = [
  { key: "pregnancies", label: "Pregnancies", placeholder: "0-17", unit: "times", min: 0, max: 17, step: 1, defaultValue: "0" },
  { key: "glucose", label: "Glucose Level", placeholder: "70-200", unit: "mg/dL", min: 0, max: 300, step: 1, defaultValue: "" },
  { key: "bloodPressure", label: "Blood Pressure", placeholder: "40-122", unit: "mm Hg", min: 0, max: 200, step: 1, defaultValue: "" },
  { key: "skinThickness", label: "Skin Thickness", placeholder: "7-99", unit: "mm", min: 0, max: 99, step: 1, defaultValue: "" },
  { key: "insulin", label: "Insulin", placeholder: "14-846", unit: "μU/mL", min: 0, max: 900, step: 1, defaultValue: "" },
  { key: "bmi", label: "BMI", placeholder: "18.5-67", unit: "kg/m²", min: 0, max: 100, step: 0.1, defaultValue: "" },
  { key: "diabetesPedigree", label: "Diabetes Pedigree", placeholder: "0.078-2.42", unit: "", min: 0, max: 3, step: 0.001, defaultValue: "" },
  { key: "age", label: "Age", placeholder: "21-81", unit: "years", min: 1, max: 120, step: 1, defaultValue: "" },
];

// ─── Risk level styling ─────────────────────────────────────
const riskStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Low: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", label: "Low Risk" },
  Moderate: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30", label: "Moderate Risk" },
  High: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30", label: "High Risk" },
};

// ─── Result type ────────────────────────────────────────────
interface TopFactor {
  feature: string;
  impact: number;
}

interface PredictionResult {
  riskProbability: number;
  riskPercentage: number;
  riskLevel: string;
  confidence: number;
  top_factors: TopFactor[];
  pattern_detected: string;
  counterfactual: string;
  explanation: string;
}

// ─── Component ──────────────────────────────────────────────
const PatientPredictions = () => {
  const [formValues, setFormValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, f.defaultValue]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = FIELDS.every((f) => formValues[f.key] !== "");

  const handlePredict = async () => {
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = {
        pregnancies: parseFloat(formValues.pregnancies),
        glucose: parseFloat(formValues.glucose),
        bloodPressure: parseFloat(formValues.bloodPressure),
        skinThickness: parseFloat(formValues.skinThickness),
        insulin: parseFloat(formValues.insulin),
        bmi: parseFloat(formValues.bmi),
        diabetesPedigree: parseFloat(formValues.diabetesPedigree),
        age: parseFloat(formValues.age),
      };

      const res = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data: PredictionResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("Prediction failed:", err);
      setError(err.message || "Failed to get prediction. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const riskStyle = result ? riskStyles[result.riskLevel] || riskStyles.Moderate : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* ── Title ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Diabetes Risk Prediction</h1>
        <p className="mt-1 text-muted-foreground">
          Enter patient information to generate an explainable diabetes risk assessment
        </p>
      </motion.div>

      {/* ── Input Form ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/60">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Patient Information</h2>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">All fields are required for accurate prediction</p>

            <div className="grid gap-5 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm font-medium text-foreground">
                    {field.label}
                  </Label>
                  <div className="relative">
                    <Input
                      id={field.key}
                      type="number"
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={formValues[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="pr-16"
                    />
                    {field.unit && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {field.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Predict Button */}
            <Button
              onClick={handlePredict}
              disabled={!isFormValid || loading}
              className="mt-8 w-full bg-gradient-to-r from-teal-500 to-cyan-500 py-6 text-base font-semibold text-white shadow-lg transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing…
                </span>
              ) : (
                "Predict Diabetes Risk"
              )}
            </Button>

            {/* Disclaimer */}
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                This tool provides risk assessment support. Always consult with healthcare professionals for medical decisions.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Error ──────────────────────────────────────── */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="flex items-center gap-3 p-5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Results ────────────────────────────────────── */}
      <AnimatePresence>
        {result && riskStyle && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Risk Level */}
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <AlertTriangle className={`h-8 w-8 ${riskStyle.text}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Risk Level</p>
                    <Badge variant="outline" className={`${riskStyle.bg} ${riskStyle.text} ${riskStyle.border} text-sm`}>
                      {riskStyle.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Confidence */}
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Confidence Score</p>
                    <p className="text-2xl font-bold text-foreground">{result.confidence}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Probability */}
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <Brain className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Risk Probability</p>
                    <p className="text-2xl font-bold text-foreground">{result.riskPercentage}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>


            {/* ── LLM Clinical Explanation ── */}
            {result.explanation && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Brain className="h-5 w-5 text-primary" />
                    Clinical Explanation
                  </h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{result.explanation}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientPredictions;
