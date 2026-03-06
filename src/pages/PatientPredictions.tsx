import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, Activity, Info, Loader2, Heart, Droplets, User, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";

interface FieldConfig {
  key: string; label: string; placeholder: string; unit: string;
  min: number; max: number; step: number; defaultValue: string; group: string;
}

const FIELDS: FieldConfig[] = [
  { key: "age", label: "Age", placeholder: "21-81", unit: "years", min: 1, max: 120, step: 1, defaultValue: "", group: "Basic Info" },
  { key: "pregnancies", label: "Pregnancies", placeholder: "0-17", unit: "times", min: 0, max: 17, step: 1, defaultValue: "0", group: "Basic Info" },
  { key: "glucose", label: "Glucose Level", placeholder: "70-200", unit: "mg/dL", min: 0, max: 300, step: 1, defaultValue: "", group: "Blood Markers" },
  { key: "bloodPressure", label: "Blood Pressure", placeholder: "40-122", unit: "mm Hg", min: 0, max: 200, step: 1, defaultValue: "", group: "Blood Markers" },
  { key: "insulin", label: "Insulin", placeholder: "14-846", unit: "μU/mL", min: 0, max: 900, step: 1, defaultValue: "", group: "Blood Markers" },
  { key: "skinThickness", label: "Skin Thickness", placeholder: "7-99", unit: "mm", min: 0, max: 99, step: 1, defaultValue: "", group: "Lifestyle Indicators" },
  { key: "bmi", label: "BMI", placeholder: "18.5-67", unit: "kg/m²", min: 0, max: 100, step: 0.1, defaultValue: "", group: "Lifestyle Indicators" },
  { key: "diabetesPedigree", label: "Diabetes Pedigree", placeholder: "0.078-2.42", unit: "", min: 0, max: 3, step: 0.001, defaultValue: "", group: "Lifestyle Indicators" },
];

const GROUP_ICONS: Record<string, React.ElementType> = {
  "Basic Info": User, "Blood Markers": Droplets, "Lifestyle Indicators": Heart,
};
const GROUP_GRADIENTS: Record<string, string> = {
  "Basic Info": "from-primary to-[hsl(280,80%,55%)]",
  "Blood Markers": "from-accent to-[hsl(190,70%,40%)]",
  "Lifestyle Indicators": "from-[hsl(340,82%,52%)] to-[hsl(15,90%,55%)]",
};
const GROUPS = ["Basic Info", "Blood Markers", "Lifestyle Indicators"];

const riskStyles: Record<string, { bg: string; text: string; border: string; label: string; Icon: React.ElementType; gradient: string }> = {
  Low: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", label: "Low Risk", Icon: Activity, gradient: "from-emerald-500 to-teal-500" },
  Moderate: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30", label: "Moderate Risk", Icon: TrendingUp, gradient: "from-amber-500 to-orange-500" },
  High: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30", label: "High Risk", Icon: AlertTriangle, gradient: "from-red-500 to-rose-500" },
};

interface TopFactor { feature: string; impact: number; }
interface PredictionResult {
  riskProbability: number; riskPercentage: number; riskLevel: string;
  confidence: number; top_factors: TopFactor[]; pattern_detected: string;
  counterfactual: string; explanation: string;
}

const PatientPredictions = () => {
  const [formValues, setFormValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, f.defaultValue]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleChange = (key: string, value: string) => setFormValues((prev) => ({ ...prev, [key]: value }));
  const isFormValid = FIELDS.every((f) => formValues[f.key] !== "");

  const handlePredict = async () => {
    if (!isFormValid) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const body = {
        pregnancies: parseFloat(formValues.pregnancies), glucose: parseFloat(formValues.glucose),
        bloodPressure: parseFloat(formValues.bloodPressure), skinThickness: parseFloat(formValues.skinThickness),
        insulin: parseFloat(formValues.insulin), bmi: parseFloat(formValues.bmi),
        diabetesPedigree: parseFloat(formValues.diabetesPedigree), age: parseFloat(formValues.age),
      };
      const res = await fetch("/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data: PredictionResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to get prediction. Is the server running?");
    } finally { setLoading(false); }
  };

  const riskStyle = result ? riskStyles[result.riskLevel] || riskStyles.Moderate : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">
          Diabetes <span className="bg-gradient-to-r from-primary via-[hsl(280,80%,60%)] to-accent bg-clip-text text-transparent">Risk Prediction</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Enter patient info to generate an <span className="text-primary font-medium">explainable AI</span> risk assessment
        </p>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-strong rounded-2xl border-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary animate-gradient-shift bg-[length:200%_200%]" />
          <CardContent className="p-6 sm:p-8">
            {GROUPS.map((group, gi) => {
              const GroupIcon = GROUP_ICONS[group] || Activity;
              const gradient = GROUP_GRADIENTS[group] || "from-primary to-primary";
              const groupFields = FIELDS.filter((f) => f.group === group);
              return (
                <div key={group}>
                  {gi > 0 && <div className="my-6 border-t border-border/30" />}
                  <div className="mb-4 flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}>
                      <GroupIcon className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-sm font-bold text-foreground">{group}</h2>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {groupFields.map((field) => {
                      const val = formValues[field.key];
                      const num = parseFloat(val);
                      const inRange = val !== "" && !isNaN(num) && num >= field.min && num <= field.max;
                      return (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={field.key} className="text-sm font-medium text-foreground">{field.label}</Label>
                          <div className="relative">
                            <Input
                              id={field.key} type="number" placeholder={field.placeholder}
                              min={field.min} max={field.max} step={field.step} value={val}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              className={`pr-16 rounded-xl transition-all ${
                                val === "" ? "border-border/40" : inRange
                                  ? "border-emerald-500/40 focus-visible:ring-emerald-500/30 shadow-[0_0_10px_hsl(160_84%_39%/0.1)]"
                                  : "border-border/40"
                              }`}
                            />
                            {field.unit && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{field.unit}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="relative mt-8">
              {isFormValid && !loading && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/30 to-accent/30"
                  animate={{ scale: [1, 1.02, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
              )}
              <Button
                onClick={handlePredict} disabled={!isFormValid || loading}
                className="relative w-full rounded-xl btn-gradient py-6 text-base font-semibold shadow-lg hover:shadow-[0_0_30px_hsl(250_85%_65%/0.4)] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Analyzing…</span>
                ) : (
                  <span className="flex items-center gap-2"><Brain className="h-5 w-5" /> Predict Diabetes Risk</span>
                )}
              </Button>
            </div>

            <div className="mt-4 flex items-start gap-2 glass-card rounded-xl p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                This tool provides <span className="text-primary font-medium">risk assessment support</span>. Always consult with healthcare professionals.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-destructive/30 bg-destructive/5 rounded-2xl">
            <CardContent className="flex items-center gap-3 p-5">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && riskStyle && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5 }}
          >
            {/* Summary row */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Risk Level */}
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="glass-card rounded-2xl border-0 h-full">
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${riskStyle.gradient} shadow-lg`}>
                      <riskStyle.Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Risk Level</p>
                      <Badge variant="outline" className={`${riskStyle.bg} ${riskStyle.text} ${riskStyle.border} text-sm mt-0.5 font-bold`}>
                        {riskStyle.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Confidence */}
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="glass-card rounded-2xl border-0 h-full">
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className="relative flex h-12 w-12 items-center justify-center">
                      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                        <motion.circle
                          cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray="88"
                          initial={{ strokeDashoffset: 88 }}
                          animate={{ strokeDashoffset: 88 - (88 * result.confidence) / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <span className="text-[10px] font-bold text-primary">{result.confidence}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="text-xl font-bold text-foreground">{result.confidence}<span className="text-sm text-muted-foreground">%</span></p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Probability */}
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="glass-card rounded-2xl border-0 h-full">
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-lg">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Risk Probability</p>
                      <p className="text-xl font-bold text-foreground">{result.riskPercentage}<span className="text-sm text-muted-foreground">%</span></p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Explanation */}
            {result.explanation && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="glass-strong rounded-2xl border-0 overflow-hidden">
                  <div className={`h-1 w-full bg-gradient-to-r ${riskStyle.gradient}`} />
                  <CardContent className="p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary shadow-sm">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span>Clinical <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Explanation</span></span>
                    </h3>
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-muted-foreground prose-strong:text-foreground prose-headings:text-foreground">
                      <ReactMarkdown>{result.explanation}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientPredictions;
