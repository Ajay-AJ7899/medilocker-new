import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertTriangle, Shield, ExternalLink, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_PREDICTIONS, type PredictionData } from "@/lib/mockPredictions";
import { generatePredictionPDF } from "@/lib/generatePredictionPDF";
import { RiskSummaryCard } from "@/components/predictions/RiskSummaryCard";
import { ShapExplanationCard } from "@/components/predictions/ShapExplanationCard";
import { PredictionChat } from "@/components/predictions/PredictionChat";

const riskColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-500 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-red-500/10 text-red-500 border-red-500/30",
};

const PatientPredictions = () => {
  const [predictions] = useState<PredictionData[]>(MOCK_PREDICTIONS);
  const [selected, setSelected] = useState<PredictionData | null>(MOCK_PREDICTIONS[0] || null);

  const handleDownloadPDF = () => {
    if (!selected) return;
    generatePredictionPDF(selected, undefined, undefined, false);
  };

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

      {/* Prediction selector */}
      {predictions.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {predictions.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`flex-shrink-0 rounded-lg border px-4 py-2.5 text-left text-sm transition-all ${
                selected.id === p.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:border-primary/30"
              }`}
            >
              <p className="font-medium">{p.predicted_disease}</p>
              <p className="text-xs text-muted-foreground">{p.confidence}% confidence</p>
            </button>
          ))}
        </div>
      )}

      {/* Summary metric cards */}
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
                {selected.risk_level.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="summary">Risk Summary</TabsTrigger>
          <TabsTrigger value="shap">SHAP</TabsTrigger>
          <TabsTrigger value="explain">Why this?</TabsTrigger>
          <TabsTrigger value="prevention">Prevention</TabsTrigger>
          <TabsTrigger value="references">Learn More</TabsTrigger>
          <TabsTrigger value="chat">Ask AI</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <RiskSummaryCard prediction={selected} />
        </TabsContent>

        <TabsContent value="shap">
          <ShapExplanationCard prediction={selected} />
        </TabsContent>

        <TabsContent value="explain">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why this prediction?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selected.explainability.map((f, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{f.factor}</span>
                    <span className="text-sm font-bold text-primary">{f.contribution}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${f.contribution}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prevention">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                What you can do
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {selected.prevention.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground">{p}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="references">
          <Card>
            <CardHeader><CardTitle className="text-lg">Learn More</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selected.reference_links.map((ref, i) => (
                <a
                  key={i}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{ref.title}</p>
                    <p className="text-xs text-muted-foreground">{ref.source}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <PredictionChat
            prediction={selected}
            showSummary={true}
          />
        </TabsContent>
      </Tabs>

      <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
        <FileDown className="h-4 w-4" />
        Download Report (PDF)
      </Button>
    </div>
  );
};

export default PatientPredictions;
