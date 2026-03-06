import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Search, FileText, UserCheck, Plus, Clock, Brain, Activity, TrendingUp, ArrowUpRight, Stethoscope, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DoctorDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [recordsAdded, setRecordsAdded] = useState(0);
  const [recentRecords, setRecentRecords] = useState<{ id: string; title: string; category: string; record_date: string; is_urgent: boolean }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("medical_records")
      .select("id", { count: "exact", head: true })
      .eq("added_by", user.id)
      .then(({ count }) => setRecordsAdded(count ?? 0));

    supabase
      .from("medical_records")
      .select("id, title, category, record_date, is_urgent")
      .eq("added_by", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentRecords(data ?? []));
  }, [user]);

  const categoryLabel = (c: string) =>
    c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const stats = [
    {
      label: "Records Added",
      value: recordsAdded,
      icon: FileText,
      gradient: "from-primary to-[hsl(280,80%,55%)]",
      glow: "hsl(250 85% 65% / 0.15)",
    },
    {
      label: "Predictions",
      value: "View",
      icon: Brain,
      gradient: "from-accent to-[hsl(190,70%,40%)]",
      glow: "hsl(172 80% 45% / 0.15)",
      action: () => navigate("/predictions"),
    },
    {
      label: "Search Patient",
      value: "Go",
      icon: Search,
      gradient: "from-[hsl(340,82%,52%)] to-[hsl(15,90%,55%)]",
      glow: "hsl(340 82% 52% / 0.15)",
      action: () => navigate("/patients"),
    },
  ];

  const quickActions = [
    { label: "Prediction Dashboard", icon: Brain, to: "/predictions", gradient: "from-primary to-[hsl(280,80%,55%)]" },
    { label: "Search Patient", icon: Search, to: "/patients", gradient: "from-accent to-[hsl(190,70%,40%)]" },
    { label: "Add Record", icon: Plus, to: "/patients", gradient: "from-[hsl(340,82%,52%)] to-[hsl(15,90%,55%)]" },
  ];

  const firstName = profile?.full_name?.split(" ")[0] || "Doctor";
  const lastName = profile?.full_name?.split(" ").slice(1).join(" ") || "";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-lg animate-glow-pulse">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome, <span className="bg-gradient-to-r from-primary via-[hsl(280,80%,60%)] to-accent bg-clip-text text-transparent">Dr. {firstName}</span>
              {lastName && <span className="text-foreground"> {lastName}</span>}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-accent" />
              Manage patient records & <span className="text-primary font-medium">AI predictions</span> from your dashboard
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative cursor-pointer"
            onClick={s.action}
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
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </div>
                {s.action && (
                  <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
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
        <div className="grid gap-3 sm:grid-cols-3">
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

      {/* Recent Records */}
      {recentRecords.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
            Recently <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Added</span>
          </h2>
          <Card className="glass-card rounded-2xl border-0 overflow-hidden">
            <CardContent className="p-0">
              {recentRecords.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className={`flex items-center gap-3 px-5 py-4 group hover:bg-muted/30 transition-colors ${i < recentRecords.length - 1 ? "border-b border-border/20" : ""}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-sm transition-transform group-hover:scale-105">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{categoryLabel(r.category)} · {new Date(r.record_date).toLocaleDateString()}</p>
                  </div>
                  {r.is_urgent && (
                    <Badge className="bg-destructive/20 text-destructive border-0 text-xs animate-pulse">
                      URGENT
                    </Badge>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default DoctorDashboard;
