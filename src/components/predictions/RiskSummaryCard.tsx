import { AlertTriangle, TrendingUp, ShieldCheck, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { PredictionData } from "@/lib/mockPredictions";

const riskConfig: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType; percent: number }> = {
  low:      { label: "Low Risk",      color: "text-green-500",  bg: "bg-green-500",  Icon: ShieldCheck,    percent: 20 },
  medium:   { label: "Medium Risk",   color: "text-yellow-500", bg: "bg-yellow-500", Icon: TrendingUp,     percent: 50 },
  high:     { label: "High Risk",     color: "text-orange-500", bg: "bg-orange-500", Icon: AlertTriangle,  percent: 75 },
  critical: { label: "Critical Risk", color: "text-red-500",    bg: "bg-red-500",    Icon: Flame,          percent: 95 },
};

interface Props {
  prediction: PredictionData;
}

export const RiskSummaryCard = ({ prediction }: Props) => {
  const cfg = riskConfig[prediction.risk_level] ?? riskConfig.medium;
  const { Icon } = cfg;

  const topFactors = [...prediction.explainability]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`h-5 w-5 ${cfg.color}`} />
          Risk Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Gauge bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Risk Meter</span>
            <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${cfg.percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${cfg.bg}`}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
          </div>
        </div>

        {/* Confidence ring */}
        <div className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
              <motion.circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="100"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 100 - prediction.confidence }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </svg>
            <span className="text-sm font-bold text-foreground">{prediction.confidence}%</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">{prediction.predicted_disease}</p>
            <p className="text-xs text-muted-foreground">Model confidence score</p>
          </div>
        </div>

        {/* Top contributing factors */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Top Contributing Factors</p>
          <div className="space-y-2">
            {topFactors.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2">
                <span className="text-sm text-foreground">{f.factor}</span>
                <span className={`text-sm font-bold ${cfg.color}`}>{f.contribution}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
