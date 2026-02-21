import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Heart, FileText, QrCode, MessageCircle, Activity, Pill, Calendar, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DoctorDashboard from "./DoctorDashboard";

const Dashboard = () => {
  const { profile, hasRole, user, activeRole } = useAuth();
  const navigate = useNavigate();
  const [recordCount, setRecordCount] = useState(0);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const isDoctor = activeRole === "doctor";

  useEffect(() => {
    if (!user || isDoctor) return;
    supabase
      .from("medical_records")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", user.id)
      .then(({ count }) => setRecordCount(count ?? 0));

    supabase
      .from("health_scores")
      .select("score")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLatestScore(data?.score ?? null));
  }, [user, isDoctor]);

  if (isDoctor) return <DoctorDashboard />;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-health-excellent";
    if (score >= 60) return "text-health-good";
    if (score >= 40) return "text-health-fair";
    if (score >= 20) return "text-health-poor";
    return "text-health-critical";
  };

  const stats = [
    {
      label: "Health Score",
      value: latestScore !== null ? latestScore : "—",
      valueClass: latestScore !== null ? getScoreColor(latestScore) : "text-muted-foreground",
      icon: Heart,
      gradient: "gradient-primary",
    },
    {
      label: "Records",
      value: recordCount,
      valueClass: "text-foreground",
      icon: FileText,
      gradient: "gradient-accent",
    },
    {
      label: "Allergies",
      value: profile?.allergies?.length ?? 0,
      valueClass: "text-foreground",
      icon: Pill,
      gradient: "gradient-warm",
    },
    {
      label: "Blood Type",
      value: profile?.blood_type || "—",
      valueClass: "text-foreground",
      icon: Activity,
      gradient: "gradient-sunny",
    },
  ];

  const quickActions = [
    { label: "Add Record", icon: Plus, to: "/records?add=true", color: "from-primary to-primary" },
    { label: "My QR Code", icon: QrCode, to: "/qr-code", color: "from-accent to-accent" },
    { label: "Predictions", icon: Heart, to: "/my-predictions", color: "from-[hsl(340,82%,52%)] to-[hsl(340,82%,52%)]" },
    { label: "AI Chat", icon: MessageCircle, to: "/chatbot", color: "from-[hsl(38,92%,50%)] to-[hsl(38,92%,50%)]" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {profile?.full_name?.split(" ")[0] || "User"}
          </span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          {hasRole("doctor") ? "Doctor Dashboard" : hasRole("admin") ? "Admin Dashboard" : "Your health at a glance"}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
            <Card className="card-glow card-hover overflow-hidden">
              <CardContent className="flex items-center gap-4 p-5 relative">
                {/* Decorative corner */}
                <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-[0.07]" style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))` }} />
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${s.gradient} shadow-sm`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.valueClass}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ label, icon: Icon, to, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
              <Button
                variant="outline"
                onClick={() => navigate(to)}
                className="h-auto w-full flex-col gap-3 border-border/60 bg-card py-7 card-hover card-glow group"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-sm transition-transform group-hover:scale-110`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
