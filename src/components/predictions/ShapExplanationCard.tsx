import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";
import type { PredictionData } from "@/lib/mockPredictions";

interface Props {
  prediction: PredictionData;
}

export const ShapExplanationCard = ({ prediction }: Props) => {
  const sorted = [...prediction.explainability].sort((a, b) => b.contribution - a.contribution);
  const maxVal = sorted[0]?.contribution ?? 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart2 className="h-5 w-5 text-primary" />
          SHAP Feature Importance
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How much each factor pushed the prediction — higher bar = stronger influence
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.map((f, i) => {
          const widthPct = (f.contribution / maxVal) * 100;
          // Alternate positive/blue vs negative/amber for visual variety
          const isTop = i < Math.ceil(sorted.length / 2);
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{f.factor}</span>
                <span className={`font-bold ${isTop ? "text-primary" : "text-yellow-500"}`}>
                  +{f.contribution}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-6 rounded bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ delay: i * 0.08, duration: 0.55 }}
                    className={`h-full rounded ${isTop ? "bg-primary" : "bg-yellow-500/80"}`}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{f.description}</p>
            </div>
          );
        })}

        <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">How to read this:</strong> Each bar shows how strongly that factor
          pushed the AI toward this diagnosis. Blue bars are positive contributors; amber bars have moderate influence.
          Longer bar = stronger signal.
        </div>
      </CardContent>
    </Card>
  );
};
