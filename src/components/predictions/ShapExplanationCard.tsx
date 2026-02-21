import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";
import type { PredictionData } from "@/lib/mockPredictions";

interface Props {
  prediction: PredictionData;
}

export const ShapExplanationCard = ({ prediction }: Props) => {
  const sorted = [...prediction.explainability].sort((a, b) => b.contribution - a.contribution);
  const maxVal = sorted[0]?.contribution ?? 100;
  const midpoint = Math.ceil(sorted.length / 2);

  return (
    <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <BarChart2 className="h-5 w-5 text-primary" />
          </div>
          SHAP Feature Importance
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How much each factor pushed the prediction — longer bar = stronger influence
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Subtle grid background */}
        <div className="relative rounded-lg bg-secondary/10 p-4" style={{
          backgroundImage: "linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}>
          <TooltipProvider>
            <div className="space-y-4">
              {sorted.map((f, i) => {
                const widthPct = (f.contribution / maxVal) * 100;
                const isTop = i < midpoint;
                const gradientClass = isTop
                  ? "from-primary to-indigo-500"
                  : "from-amber-400 to-orange-500";

                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="space-y-1 cursor-default group">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{f.factor}</span>
                          <span className={`font-bold tabular-nums ${isTop ? "text-primary" : "text-amber-500"}`}>
                            +{f.contribution}
                          </span>
                        </div>
                        <div className="flex items-center gap-0">
                          <div className="flex-1 h-5 rounded-full bg-secondary/60 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPct}%` }}
                              transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                              className={`h-full rounded-full bg-gradient-to-r ${gradientClass} relative`}
                            >
                              {/* Lollipop dot */}
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 + 0.5, duration: 0.2 }}
                                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-card ${isTop ? "bg-indigo-500" : "bg-orange-500"} shadow-sm`}
                              />
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px]">
                      <p className="text-xs">{f.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>

        <div className="mt-3 rounded-xl border border-border bg-secondary/20 p-3.5 text-xs text-muted-foreground">
          <strong className="text-foreground">How to read this:</strong> Each bar shows how strongly that factor
          pushed the AI toward this diagnosis. Blue–indigo bars are top contributors; amber–orange bars have moderate influence.
          Hover any bar for details.
        </div>
      </CardContent>
    </Card>
  );
};
