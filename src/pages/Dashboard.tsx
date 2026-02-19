import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Heart, FileText, QrCode, MessageCircle, Activity, Pill, Calendar, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const quickActions = [
    { label: "Add Record", icon: Plus, to: "/records?add=true" },
    { label: "My QR Code", icon: QrCode, to: "/qr-code" },
    { label: "Health Score", icon: Heart, to: "/health-score" },
    { label: "AI Chat", icon: MessageCircle, to: "/chatbot" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold tracking-wider text-foreground">
          Welcome back,{" "}
          <span className="text-primary text-glow">
            {profile?.full_name?.split(" ")[0] || "User"}
          </span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          {hasRole("doctor") ? "Doctor Dashboard" : hasRole("admin") ? "Admin Dashboard" : "Your health at a glance"}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border glass">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className={`font-display text-2xl font-bold ${latestScore !== null ? getScoreColor(latestScore) : "text-muted-foreground"}`}>
                  {latestScore !== null ? latestScore : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border glass">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Records</p>
                <p className="font-display text-2xl font-bold text-foreground">{recordCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border glass">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Allergies</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {profile?.allergies?.length ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border glass">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Activity className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Type</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {profile?.blood_type || "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold tracking-wider text-foreground">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ label, icon: Icon, to }) => (
            <Button
              key={label}
              variant="outline"
              onClick={() => navigate(to)}
              className="h-auto flex-col gap-2 border-border bg-card py-6 hover:bg-primary/5 hover:border-primary/30"
            >
              <Icon className="h-6 w-6 text-primary" />
              <span className="text-sm">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
