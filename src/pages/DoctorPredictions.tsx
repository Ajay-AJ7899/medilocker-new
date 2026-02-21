import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, CheckCircle, XCircle, AlertTriangle, TrendingUp, Shield,
  ExternalLink, FileDown, MessageSquare, Search, UserCheck,
  Stethoscope, BarChart2, Heart, Apple, Dumbbell, Pill, CalendarCheck, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateMockPredictionsForPatient, type PredictionData } from "@/lib/mockPredictions";
import { generatePredictionPDF } from "@/lib/generatePredictionPDF";
import { RiskSummaryCard } from "@/components/predictions/RiskSummaryCard";
import { ShapExplanationCard } from "@/components/predictions/ShapExplanationCard";
import { PredictionChat } from "@/components/predictions/PredictionChat";
import { toast } from "sonner";

interface PatientProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  patient_code: string | null;
  blood_type: string | null;
  date_of_birth: string | null;
  allergies: string[] | null;
}

const riskDotColors: Record<string, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const riskColors: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-red-500/10 text-red-500 border-red-500/30",
};

/** Simple hash to pick avatar color */
function nameToColor(name: string): string {
  const colors = [
    "from-primary to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-violet-500 to-purple-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAge(dob: string | null): string | null {
  if (!dob) return null;
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  return `${age} yrs`;
}

/** Pick a themed icon for prevention text */
function getPreventionIcon(text: string) {
  const t = text.toLowerCase();
  if (t.includes("diet") || t.includes("food") || t.includes("sugar") || t.includes("glycemic") || t.includes("sodium") || t.includes("potassium")) return Apple;
  if (t.includes("exercise") || t.includes("aerobic") || t.includes("physical")) return Dumbbell;
  if (t.includes("monitor") || t.includes("check-up") || t.includes("schedule")) return CalendarCheck;
  if (t.includes("medication") || t.includes("drug") || t.includes("avoid")) return Pill;
  if (t.includes("stress") || t.includes("meditation") || t.includes("yoga")) return Heart;
  if (t.includes("blood")) return Activity;
  return Shield;
}

const DoctorPredictions = () => {
  const { user } = useAuth();

  const [searchCode, setSearchCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [patient, setPatient] = useState<PatientProfile | null>(null);

  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionData | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, { decision: string; comment: string }>>({});

  const searchPatient = async () => {
    if (!searchCode.trim()) { toast.error("Enter a patient code."); return; }
    setIsSearching(true);
    setPatient(null);
    setPredictions([]);
    setSelectedPrediction(null);
    setFeedbackGiven({});

    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, patient_code, blood_type, date_of_birth, allergies")
      .eq("patient_code", searchCode.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      toast.error("Patient not found. Check the code.");
    } else {
      const p = data as PatientProfile;
      setPatient(p);
      const mockPreds = generateMockPredictionsForPatient(p.user_id, p.full_name, p.blood_type, p.allergies);
      setPredictions(mockPreds);
      setSelectedPrediction(mockPreds[0] || null);
      toast.success(`Patient found: ${p.full_name || "Unknown"}`);
    }
    setIsSearching(false);
  };

  const handleFeedback = async (decision: "accepted" | "rejected") => {
    if (!selectedPrediction || !user) return;
    if (decision === "rejected" && !feedbackComment.trim()) {
      toast.error("Please provide a rejection reason before rejecting.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("prediction_feedback").insert({
        prediction_id: selectedPrediction.id,
        doctor_id: user.id,
        decision,
        comments: feedbackComment || null,
      } as any);
      if (error) console.log("Mock mode - feedback would be saved:", { decision, comments: feedbackComment });
      setFeedbackGiven((prev) => ({
        ...prev,
        [selectedPrediction.id]: { decision, comment: feedbackComment },
      }));
      setFeedbackComment("");
      toast.success(`Prediction ${decision === "accepted" ? "accepted" : "rejected"} successfully`);
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedPrediction) return;
    const fb = feedbackGiven[selectedPrediction.id];
    generatePredictionPDF(selectedPrediction, fb?.decision, fb?.comment, true, patient?.full_name);
  };

  const fb = selectedPrediction ? feedbackGiven[selectedPrediction.id] : undefined;

  return (
    <div className="space-y-6">
      {/* ── Hero search ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute right-6 top-6 opacity-[0.06]">
          <Stethoscope className="h-32 w-32 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Find your patient</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter their unique code to view AI-powered predictions</p>

        <div className="mt-5 flex gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. A1B2C3D4"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && searchPatient()}
              className="pl-9 font-mono tracking-wider rounded-xl shadow-inner bg-background/80"
            />
          </div>
          <Button onClick={searchPatient} disabled={isSearching} className="rounded-xl gap-2 px-5">
            <Search className="h-4 w-4" />
            {isSearching ? "Searching…" : "Search"}
          </Button>
        </div>
      </motion.div>

      {/* ── Empty state ──────────────────────────────── */}
      {!patient && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
        >
          <div className="relative mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/5 border border-primary/10">
              <Stethoscope className="h-10 w-10 text-primary/30" />
            </div>
            <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary/20 animate-pulse" />
          </div>
          <p className="text-lg font-medium text-foreground/60">Ready when you are</p>
          <p className="text-sm mt-1">Enter a patient code above to get started</p>
        </motion.div>
      )}

      {/* ── Patient badge ────────────────────────────── */}
      {patient && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 rounded-xl border border-primary/15 bg-card p-4 shadow-sm overflow-hidden relative">
            {/* Accent strip */}
            <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${nameToColor(patient.full_name || "")}`} />
            {/* Avatar */}
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${nameToColor(patient.full_name || "")} text-white font-bold text-sm shadow-sm`}>
              {getInitials(patient.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{patient.full_name || "Unknown"}</p>
              <p className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
                <span className="font-mono">{patient.patient_code}</span>
                {getAge(patient.date_of_birth) && <span>· {getAge(patient.date_of_birth)}</span>}
                {patient.blood_type && <span>· {patient.blood_type}</span>}
                {patient.allergies?.length ? <span>· {patient.allergies.join(", ")}</span> : null}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Predictions ──────────────────────────────── */}
      {patient && selectedPrediction && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Prediction selector pills */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {predictions.map((p) => {
              const isActive = selectedPrediction.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPrediction(p); setFeedbackComment(""); }}
                  className={`flex-shrink-0 rounded-xl border px-4 py-3 text-left transition-all ${
                    isActive
                      ? "border-primary/30 bg-primary/5 shadow-md"
                      : "border-border bg-card hover:border-primary/20 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${riskDotColors[p.risk_level]}`} />
                    <span className="font-medium text-sm text-foreground">{p.predicted_disease}</span>
                  </div>
                  {/* Micro confidence bar */}
                  <div className="mt-2 h-1 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${p.confidence}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{p.confidence}% confidence</p>
                </button>
              );
            })}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1 bg-secondary/40 p-1 rounded-xl">
              <TabsTrigger value="overview" className="gap-1.5 rounded-lg text-xs"><Brain className="h-3.5 w-3.5" />Overview</TabsTrigger>
              <TabsTrigger value="risk" className="gap-1.5 rounded-lg text-xs"><AlertTriangle className="h-3.5 w-3.5" />Risk</TabsTrigger>
              <TabsTrigger value="shap" className="gap-1.5 rounded-lg text-xs"><BarChart2 className="h-3.5 w-3.5" />SHAP & Factors</TabsTrigger>
              <TabsTrigger value="prevention" className="gap-1.5 rounded-lg text-xs"><Shield className="h-3.5 w-3.5" />Prevention</TabsTrigger>
              <TabsTrigger value="chat" className="gap-1.5 rounded-lg text-xs"><MessageSquare className="h-3.5 w-3.5" />AI Chat</TabsTrigger>
              <TabsTrigger value="feedback" className="gap-1.5 rounded-lg text-xs"><CheckCircle className="h-3.5 w-3.5" />Feedback</TabsTrigger>
            </TabsList>

            {/* ── Overview ───────────────────────── */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Disease */}
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-indigo-500/20">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Predicted Disease</p>
                      <p className="font-semibold text-foreground">{selectedPrediction.predicted_disease}</p>
                    </div>
                  </CardContent>
                </Card>
                {/* Confidence with radial ring */}
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className="relative flex h-10 w-10 items-center justify-center">
                      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray="88" strokeDashoffset={88 - (88 * selectedPrediction.confidence) / 100} />
                      </svg>
                      <span className="text-[10px] font-bold text-foreground">{selectedPrediction.confidence}%</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="text-lg font-bold text-foreground">{selectedPrediction.confidence}%</p>
                    </div>
                  </CardContent>
                </Card>
                {/* Risk */}
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Risk Level</p>
                      <Badge variant="outline" className={riskColors[selectedPrediction.risk_level]}>
                        {selectedPrediction.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Last analyzed */}
              <p className="text-xs text-muted-foreground">
                Last analyzed: {new Date(selectedPrediction.created_at).toLocaleString()}
              </p>

              {/* Feedback summary */}
              <AnimatePresence>
                {fb && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className={fb.decision === "accepted" ? "border-emerald-500/30" : "border-red-500/30"}>
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-center gap-3">
                          {fb.decision === "accepted" ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                          <p className="text-sm font-medium">You {fb.decision} this prediction</p>
                        </div>
                        {fb.decision === "rejected" && fb.comment && (
                          <div className="ml-8 rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Rejection Reason:</p>
                            <p className="text-sm text-foreground">{fb.comment}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* ── Risk ───────────────────────────── */}
            <TabsContent value="risk">
              <RiskSummaryCard prediction={selectedPrediction} />
            </TabsContent>

            {/* ── SHAP & Factors ─────────────────── */}
            <TabsContent value="shap" className="space-y-4">
              <ShapExplanationCard prediction={selectedPrediction} />
              {/* Inline factors list */}
              <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader><CardTitle className="text-lg">Contributing Factors</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {selectedPrediction.explainability.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{f.factor}</span>
                        <span className="text-sm font-bold text-primary">{f.contribution}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${f.contribution}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Prevention ─────────────────────── */}
            <TabsContent value="prevention" className="space-y-4">
              <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Shield className="h-5 w-5 text-emerald-500" />
                    </div>
                    Prevention Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedPrediction.prevention.map((p, i) => {
                      const Icon = getPreventionIcon(p);
                      return (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${i % 2 === 0 ? "bg-secondary/20" : ""}`}
                        >
                          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                            <Icon className="h-4 w-4 text-emerald-500" />
                          </div>
                          <span className="text-sm text-foreground">{p}</span>
                        </motion.li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── AI Chat ────────────────────────── */}
            <TabsContent value="chat">
              <PredictionChat
                prediction={selectedPrediction}
                patientName={patient?.full_name}
                bloodType={patient?.blood_type}
                allergies={patient?.allergies}
                showSummary={true}
              />
            </TabsContent>

            {/* ── Feedback ───────────────────────── */}
            <TabsContent value="feedback" className="space-y-4">
              <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    Clinical Feedback
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Your clinical insight helps improve future predictions</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fb ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
                      <div className={`rounded-xl p-5 ${fb.decision === "accepted" ? "bg-emerald-500/5 border border-emerald-500/20" : "bg-red-500/5 border border-red-500/20"}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            {fb.decision === "accepted"
                              ? <CheckCircle className="h-8 w-8 text-emerald-500" />
                              : <XCircle className="h-8 w-8 text-red-500" />
                            }
                          </motion.div>
                          <div>
                            <p className="font-semibold text-foreground capitalize">
                              Prediction {fb.decision}
                            </p>
                            <p className="text-xs text-muted-foreground">Thank you for your feedback</p>
                          </div>
                        </div>
                        {fb.comment && (
                          <div className="rounded-lg bg-background/60 px-3 py-2">
                            <p className="text-xs text-muted-foreground mb-1">Comments:</p>
                            <p className="text-sm text-foreground">{fb.comment}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <Textarea
                        placeholder="Add your clinical comments (required for rejection, optional for acceptance)..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        rows={4}
                        className="rounded-xl"
                      />
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleFeedback("accepted")}
                          disabled={submitting}
                          className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm"
                        >
                          <CheckCircle className="h-4 w-4" /> Accept Prediction
                        </Button>
                        <Button
                          onClick={() => handleFeedback("rejected")}
                          disabled={submitting || !feedbackComment.trim()}
                          variant="outline"
                          className="flex-1 gap-2 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/5 hover:text-red-600"
                        >
                          <XCircle className="h-4 w-4" /> Reject Prediction
                        </Button>
                      </div>
                      {!feedbackComment.trim() && (
                        <p className="text-xs text-muted-foreground">
                          * <span className="text-red-400 font-medium">Rejection reason is required</span> — provide comments above to enable rejection
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* References collapsed here */}
              <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader><CardTitle className="text-lg">Medical References</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {selectedPrediction.reference_links.map((ref, i) => (
                    <motion.a
                      key={i}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-xl border border-border p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm hover:bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <ExternalLink className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{ref.title}</p>
                          <p className="text-xs text-muted-foreground">{ref.source}</p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </motion.a>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button variant="outline" onClick={handleDownloadPDF} className="gap-2 rounded-xl">
            <FileDown className="h-4 w-4" /> Download Full Report (PDF)
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default DoctorPredictions;
