import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Search, FileText, UserCheck, Plus, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DoctorDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [recordsAdded, setRecordsAdded] = useState(0);
  const [recentRecords, setRecentRecords] = useState<{ id: string; title: string; category: string; record_date: string }[]>([]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("medical_records")
      .select("id", { count: "exact", head: true })
      .eq("added_by", user.id)
      .then(({ count }) => setRecordsAdded(count ?? 0));

    supabase
      .from("medical_records")
      .select("id, title, category, record_date")
      .eq("added_by", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentRecords(data ?? []));
  }, [user]);

  const categoryLabel = (c: string) =>
    c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, Dr.{" "}
          <span className="text-primary">{profile?.full_name?.split(" ").pop() || "Doctor"}</span>
        </h1>
        <p className="mt-1 text-muted-foreground">Manage patient records from your dashboard</p>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Records Added</p>
                <p className="text-2xl font-bold text-foreground">{recordsAdded}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quick Action</p>
                <Button size="sm" className="mt-1 gap-2" onClick={() => navigate("/patients")}>
                  <Search className="h-3.5 w-3.5" /> Search Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={() => navigate("/patients")}
            className="h-auto flex-col gap-2 py-6 hover:bg-primary/5 hover:border-primary/30"
          >
            <Search className="h-6 w-6 text-primary" />
            <span className="text-sm">Search Patient</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/patients")}
            className="h-auto flex-col gap-2 py-6 hover:bg-primary/5 hover:border-primary/30"
          >
            <Plus className="h-6 w-6 text-primary" />
            <span className="text-sm">Add Record</span>
          </Button>
        </div>
      </div>

      {/* Recent Records */}
      {recentRecords.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recently Added</h2>
          <Card>
            <CardContent className="p-0">
              {recentRecords.map((r, i) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i < recentRecords.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{categoryLabel(r.category)} · {r.record_date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
