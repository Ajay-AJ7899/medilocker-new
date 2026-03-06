import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Heart, FileText, QrCode, MessageCircle, Activity, Pill, Calendar, Plus, ArrowUpRight, TrendingUp, Sparkles, User } from "lucide-react";
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

  const firstName = profile?.full_name?.split(" ")[0] || "User";
  const patientCode = (profile as any)?.patient_code || null;

  const stats = [
    {
      label: "Health Score",
      value: latestScore !== null ? latestScore : "—",
      valueClass: latestScore !== null ? getScoreColor(latestScore) : "text-muted-foreground",
      icon: Heart,
      gradient: "from-primary to-[hsl(280,80%,55%)]",
      glow: "hsl(250 85% 65% / 0.15)",
    },
    {
      label: "Records",
      value: recordCount,
      valueClass: "text-foreground",
      icon: FileText,
      gradient: "from-accent to-[hsl(190,70%,40%)]",
      glow: "hsl(172 80% 45% / 0.15)",
    },
    {
      label: "Allergies",
      value: profile?.allergies?.length ?? 0,
      valueClass: "text-foreground",
      icon: Pill,
      gradient: "from-[hsl(340,82%,52%)] to-[hsl(15,90%,55%)]",
      glow: "hsl(340 82% 52% / 0.15)",
    },
    {
      label: "Blood Type",
      value: profile?.blood_type || "—",
      valueClass: "text-foreground",
      icon: Activity,
      gradient: "from-[hsl(38,92%,50%)] to-[hsl(25,95%,53%)]",
      glow: "hsl(38 92% 50% / 0.15)",
    },
  ];

  const quickActions = [
    { label: "Add Record", icon: Plus, to: "/records?add=true", gradient: "from-primary to-[hsl(280,80%,55%)]" },
    { label: "My QR Code", icon: QrCode, to: "/qr-code", gradient: "from-accent to-[hsl(190,70%,40%)]" },
    { label: "Predictions", icon: TrendingUp, to: "/my-predictions", gradient: "from-[hsl(340,82%,52%)] to-[hsl(15,90%,55%)]" },
    { label: "AI Chat", icon: MessageCircle, to: "/chatbot", gradient: "from-[hsl(38,92%,50%)] to-[hsl(25,95%,53%)]" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-accent shadow-lg animate-float">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-primary via-[hsl(280,80%,60%)] to-accent bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Your <span className="text-primary font-medium">health at a glance</span> — powered by Arogya AI
            </p>
          </div>
        </div>
      </motion.div>

      {/* Patient ID Card */}
      {patientCode && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass-card rounded-2xl border-0 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-accent via-primary to-accent animate-gradient-shift bg-[length:200%_200%]" />
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-accent shadow-lg">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Your Patient ID</p>
                <p className="text-xl font-bold font-mono tracking-widest bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{patientCode}</p>
              </div>
              <p className="text-xs text-muted-foreground max-w-[140px] text-right">Share this ID with your doctor for record access</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative"
          >
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
              style={{ background: s.glow }}
            />
            <Card className="relative glass-card overflow-hidden rounded-2xl border-0">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
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
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
          Quick <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Actions</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ label, icon: Icon, to, gradient }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Button
                variant="ghost"
                onClick={() => navigate(to)}
                className="h-auto w-full flex-col gap-3 glass-card rounded-2xl border-0 py-8 group hover:bg-transparent"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_0_25px_hsl(250_85%_65%/0.3)]`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
