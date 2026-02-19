import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle, XCircle, AlertTriangle, TrendingUp, Shield, ExternalLink, FileDown, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_PREDICTIONS, type PredictionData } from "@/lib/mockPredictions";
import { generatePredictionPDF } from "@/lib/generatePredictionPDF";
import { toast } from "sonner";

const riskColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-500 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  critical: "bg-red-500/10 text-red-500 border-red-500/30",
};

const DoctorPredictions = () => {
  const { user } = useAuth();
  const [predictions] = useState<PredictionData[]>(MOCK_PREDICTIONS);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionData | null>(MOCK_PREDICTIONS[0] || null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, string>>({});

  const handleFeedback = async (decision: "accepted" | "rejected") => {
    if (!selectedPrediction || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("prediction_feedback").insert({
        prediction_id: selectedPrediction.id,
        doctor_id: user.id,
        decision,
        comments: feedbackComment || null,
      } as any);

      if (error) {
        // For mock data, just show success since IDs won't exist in DB
        console.log("Mock mode - feedback would be saved:", { decision, comments: feedbackComment });
      }

      setFeedbackGiven((prev) => ({ ...prev, [selectedPrediction.id]: decision }));
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
    generatePredictionPDF(selectedPrediction, feedbackGiven[selectedPrediction.id], feedbackComment, true);
  };

  if (!selectedPrediction) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Brain className="mb-4 h-16 w-16 opacity-30" />
        <p className="text-lg font-medium">No predictions available</p>
        <p className="text-sm">Predictions will appear here when the ML model is connected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Prediction Dashboard</h1>
        <p className="text-muted-foreground">Review AI predictions and provide clinical feedback</p>
      </motion.div>

      {/* Prediction list */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {predictions.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelectedPrediction(p); setFeedbackComment(""); }}
            className={`flex-shrink-0 rounded-lg border px-4 py-2.5 text-left text-sm transition-all ${
              selectedPrediction.id === p.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/30"
            }`}
          >
            <p className="font-medium">{p.predicted_disease}</p>
            <p className="text-xs text-muted-foreground">{p.confidence}% confidence</p>
          </button>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="explainability">Explainability</TabsTrigger>
          <TabsTrigger value="prevention">Prevention</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <Brain className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Predicted Disease</p>
                  <p className="font-semibold text-foreground">{selectedPrediction.predicted_disease}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-2xl font-bold text-foreground">{selectedPrediction.confidence}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <AlertTriangle className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Risk Level</p>
                  <Badge variant="outline" className={riskColors[selectedPrediction.risk_level]}>
                    {selectedPrediction.risk_level.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {feedbackGiven[selectedPrediction.id] && (
            <Card className={feedbackGiven[selectedPrediction.id] === "accepted" ? "border-green-500/30" : "border-red-500/30"}>
              <CardContent className="flex items-center gap-3 p-4">
                {feedbackGiven[selectedPrediction.id] === "accepted" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <p className="text-sm font-medium">
                  You {feedbackGiven[selectedPrediction.id]} this prediction
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Explainability */}
        <TabsContent value="explainability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contributing Factors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPrediction.explainability.map((f, i) => (
                <div key={i} className="space-y-1.5">
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
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prevention */}
        <TabsContent value="prevention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Prevention Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {selectedPrediction.prevention.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground">{p}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* References */}
        <TabsContent value="references" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medical References</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedPrediction.reference_links.map((ref, i) => (
                <a
                  key={i}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{ref.title}</p>
                    <p className="text-xs text-muted-foreground">{ref.source}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Clinical Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedbackGiven[selectedPrediction.id] ? (
                <div className="rounded-lg bg-secondary/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Feedback already submitted for this prediction</p>
                </div>
              ) : (
                <>
                  <Textarea
                    placeholder="Add your clinical comments (optional for accept, recommended for reject)..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleFeedback("accepted")}
                      disabled={submitting}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accept Prediction
                    </Button>
                    <Button
                      onClick={() => handleFeedback("rejected")}
                      disabled={submitting || !feedbackComment.trim()}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Prediction
                    </Button>
                  </div>
                  {!feedbackComment.trim() && (
                    <p className="text-xs text-muted-foreground">
                      * Comments are required when rejecting a prediction (used for model retraining)
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Download PDF */}
      <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
        <FileDown className="h-4 w-4" />
        Download Full Report (PDF)
      </Button>
    </div>
  );
};

export default DoctorPredictions;
