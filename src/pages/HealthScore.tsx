import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Heart, Activity, Pill, AlertTriangle, Calendar, TrendingUp } from "lucide-react";

interface HealthFactor {
  label: string;
  value: number;
  max: number;
  icon: typeof Heart;
  color: string;
}

const HealthScore = () => {
  const { user, profile } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get record counts by category
      const { data: records } = await supabase
        .from("medical_records")
        .select("category")
        .eq("patient_id", user.id);

      const counts: Record<string, number> = {};
      records?.forEach((r) => {
        counts[r.category] = (counts[r.category] || 0) + 1;
      });
      setRecordCounts(counts);

      // Calculate score
      let s = 70; // base
      const allergyCount = profile?.allergies?.length || 0;
      s -= allergyCount * 3;
      const chronicCount = counts["chronic_condition"] || 0;
      s -= chronicCount * 5;
      const checkups = counts["consultation"] || 0;
      s += Math.min(checkups * 2, 10);
      const vaccinations = counts["vaccination"] || 0;
      s += Math.min(vaccinations * 2, 10);
      s = Math.max(0, Math.min(100, s));
      setScore(s);

      // Save score snapshot
      await supabase.from("health_scores").insert({
        patient_id: user.id,
        score: s,
        factors: {
          allergy_count: allergyCount,
          chronic_conditions: chronicCount,
          checkups,
          vaccinations,
        },
      });
    };

    fetchData();
  }, [user, profile]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return "hsl(142, 71%, 45%)";
    if (s >= 60) return "hsl(171, 77%, 50%)";
    if (s >= 40) return "hsl(45, 93%, 58%)";
    if (s >= 20) return "hsl(25, 95%, 53%)";
    return "hsl(0, 72%, 51%)";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    if (s >= 20) return "Poor";
    return "Critical";
  };

  const factors: HealthFactor[] = [
    {
      label: "Allergies",
      value: profile?.allergies?.length || 0,
      max: 5,
      icon: AlertTriangle,
      color: "text-health-fair",
    },
    {
      label: "Chronic Conditions",
      value: recordCounts["chronic_condition"] || 0,
      max: 5,
      icon: Activity,
      color: "text-health-poor",
    },
    {
      label: "Checkups",
      value: recordCounts["consultation"] || 0,
      max: 10,
      icon: Calendar,
      color: "text-health-good",
    },
    {
      label: "Medications",
      value: recordCounts["medication"] || 0,
      max: 10,
      icon: Pill,
      color: "text-health-fair",
    },
    {
      label: "Vaccinations",
      value: recordCounts["vaccination"] || 0,
      max: 10,
      icon: TrendingUp,
      color: "text-health-excellent",
    },
  ];

  const circumference = 2 * Math.PI * 90;
  const progress = score !== null ? ((100 - score) / 100) * circumference : circumference;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">
          Health Score
        </h1>
        <p className="text-sm text-muted-foreground">Your overall health assessment</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Gauge */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-border glass">
            <CardContent className="flex flex-col items-center p-8">
              <div className="relative">
                <svg width="220" height="220" className="-rotate-90">
                  <circle
                    cx="110"
                    cy="110"
                    r="90"
                    fill="none"
                    stroke="hsl(220, 16%, 18%)"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="110"
                    cy="110"
                    r="90"
                    fill="none"
                    stroke={score !== null ? getScoreColor(score) : "transparent"}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: progress }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="font-display text-5xl font-bold"
                    style={{ color: score !== null ? getScoreColor(score) : undefined }}
                  >
                    {score ?? "—"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {score !== null ? getScoreLabel(score) : "Calculating..."}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Factors */}
        <div className="space-y-3">
          {factors.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Card className="border-border glass">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{f.label}</span>
                      <span className={`font-display text-lg font-bold ${f.color}`}>
                        {f.value}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((f.value / f.max) * 100, 100)}%`,
                          backgroundColor: "hsl(171, 77%, 50%)",
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <Card className="border-border glass">
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-wider text-primary">
            Tips to Improve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Schedule regular health checkups every 6 months</li>
            <li>• Keep your vaccination records up to date</li>
            <li>• Track medication compliance carefully</li>
            <li>• Update your allergy information promptly</li>
            <li>• Use the AI chatbot for personalized health recommendations</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthScore;
