import { AlertTriangle, TrendingUp, ShieldCheck, Flame, Heart, Droplets, Activity, Dna } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PredictionData } from "@/lib/mockPredictions";

const riskConfig: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType; angle: number }> = {
  low:      { label: "Low Risk",      color: "text-emerald-500",  bg: "bg-emerald-500",  Icon: ShieldCheck,    angle: 30 },
  medium:   { label: "Medium Risk",   color: "text-amber-500",    bg: "bg-amber-500",    Icon: TrendingUp,     angle: 75 },
  high:     { label: "High Risk",     color: "text-orange-500",   bg: "bg-orange-500",   Icon: AlertTriangle,  angle: 120 },
  critical: { label: "Critical Risk", color: "text-red-500",      bg: "bg-red-500",      Icon: Flame,          angle: 160 },
};

const factorIcons: Record<string, React.ElementType> = {
  "Fasting Blood Glucose": Droplets,
  "BMI": Activity,
  "Family History": Dna,
  "HbA1c Levels": Heart,
  "Systolic BP": Activity,
  "Sodium Intake": Droplets,
  "Stress Levels": Heart,
};

interface Props {
  prediction: PredictionData;
}

/** Semicircular SVG gauge */
const GaugeMeter = ({ angle, label, color }: { angle: number; label: string; color: string }) => {
  const r = 80;
  const cx = 100;
  const cy = 95;
  const startAngle = -180;
  const endAngle = 0;
  const totalArc = endAngle - startAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number) => {
    const s = toRad(start);
    const e = toRad(end);
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  // needle angle: map 0-180 range angle to -180..0 degrees
  const needleDeg = startAngle + (angle / 180) * totalArc;
  const needleRad = toRad(needleDeg);
  const needleLen = r - 12;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-full max-w-[240px]">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142, 71%, 45%)" />
            <stop offset="35%" stopColor="hsl(45, 93%, 58%)" />
            <stop offset="65%" stopColor="hsl(25, 95%, 53%)" />
            <stop offset="100%" stopColor="hsl(0, 72%, 51%)" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <path d={arcPath(-180, 0)} fill="none" stroke="hsl(var(--secondary))" strokeWidth="14" strokeLinecap="round" />
        {/* Gradient arc */}
        <path d={arcPath(-180, 0)} fill="none" stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round" />
        {/* Needle */}
        <motion.line
          x1={cx} y1={cy} x2={nx} y2={ny}
          stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round"
          initial={{ x2: cx - needleLen, y2: cy }}
          animate={{ x2: nx, y2: ny }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
        <circle cx={cx} cy={cy} r="5" fill="hsl(var(--foreground))" />
        {/* Labels */}
        <text x="15" y="108" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="Inter">Low</text>
        <text x="170" y="108" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="Inter">Critical</text>
      </svg>
      <span className={`-mt-1 text-sm font-semibold ${color}`}>{label}</span>
    </div>
  );
};

export const RiskSummaryCard = ({ prediction }: Props) => {
  const cfg = riskConfig[prediction.risk_level] ?? riskConfig.medium;
  const { Icon } = cfg;

  const topFactors = [...prediction.explainability]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  return (
    <Card className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg}/10`}>
            <Icon className={`h-5 w-5 ${cfg.color}`} />
          </div>
          Risk Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Semicircular gauge */}
        <GaugeMeter angle={cfg.angle} label={cfg.label} color={cfg.color} />

        {/* Confidence ring — larger with label */}
        <div className="flex items-center gap-5 rounded-xl border border-border bg-secondary/20 p-5">
          <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2.5" />
              <motion.circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="100"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 100 - prediction.confidence }}
                transition={{ duration: 1.2, delay: 0.3 }}
              />
            </svg>
            <div className="text-center">
              <span className="text-base font-bold text-foreground">{prediction.confidence}%</span>
              <p className="text-[9px] text-muted-foreground leading-tight">sure</p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-foreground">{prediction.predicted_disease}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Model confidence score</p>
          </div>
        </div>

        {/* Top contributing factors with themed icons */}
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Top Contributing Factors</p>
          <TooltipProvider>
            <div className="space-y-2">
              {topFactors.map((f, i) => {
                const FactorIcon = factorIcons[f.factor] || Activity;
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2.5 cursor-default transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <FactorIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{f.factor}</span>
                        </div>
                        <span className={`text-sm font-bold ${cfg.color}`}>{f.contribution}%</span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[220px]">
                      <p className="text-xs">{f.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};
