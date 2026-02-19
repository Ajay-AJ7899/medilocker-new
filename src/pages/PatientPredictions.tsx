import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_PREDICTIONS, type PredictionData } from "@/lib/mockPredictions";

const riskColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-500 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-red-500/10 text-red-500 border-red-500/30",
};


const PatientPredictions = () => {
  const [selected, setSelected] = useState<PredictionData | null>(MOCK_PREDICTIONS[1] || null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await fetch("http://localhost:8000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pregnancies: 2,
            glucose: 150,
            bloodPressure: 80,
            skinThickness: 25,
            insulin: 120,
            bmi: 32.5,
            diabetesPedigree: 0.7,
            age: 45
          })
        });

        if (res.ok) {
          const result = await res.json();
          console.log(result);

          const riskLevelMap: Record<string, "low" | "medium" | "high" | "critical"> = {
            "Low": "low",
            "Moderate": "medium",
            "High": "high"
          };

          setSelected({
            id: "api-pred",
            patient_id: "current-user",
            predicted_disease: "Diabetes Risk Assessment",
            confidence: result.riskPercentage,
            risk_level: riskLevelMap[result.riskLevel] || "medium",
            explainability: [],
            prevention: [],
            reference_links: [],
            status: "pending",
            created_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Failed to fetch prediction:", error);
      }
    };

    fetchPrediction();
  }, []);

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Brain className="mb-4 h-16 w-16 opacity-30" />
        <p className="text-lg font-medium">No predictions yet</p>
        <p className="text-sm">Your health predictions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Health Predictions</h1>
        <p className="text-muted-foreground">AI-powered health risk analysis</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Predicted Condition</p>
              <p className="font-semibold text-foreground">{selected.predicted_disease}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="text-2xl font-bold text-foreground">{selected.confidence}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <AlertTriangle className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Risk Level</p>
              <Badge variant="outline" className={riskColors[selected.risk_level]}>
                {selected.risk_level === 'low' ? "NOT DETECTED" : selected.risk_level.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
.    </div>
  );
};

export default PatientPredictions;
