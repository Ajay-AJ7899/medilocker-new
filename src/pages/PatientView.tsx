import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Droplets, Phone, User, FileText, Calendar, Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface PatientProfile {
  full_name: string | null;
  blood_type: string | null;
  phone_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  allergies: string[];
  date_of_birth: string | null;
}

interface Record {
  id: string;
  category: string;
  title: string;
  description: string | null;
  record_date: string;
}

const PatientView = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { isAuthenticated, hasRole } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;

    if (!isAuthenticated) {
      setError("Please connect your MetaMask wallet to view patient records.");
      setIsLoading(false);
      return;
    }

    if (!hasRole("doctor") && !hasRole("admin")) {
      setError("Only authenticated doctors can view patient records.");
      setIsLoading(false);
      return;
    }

    const fetchPatient = async () => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, blood_type, phone_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, allergies, date_of_birth")
        .eq("user_id", patientId)
        .maybeSingle();

      if (profileError || !profileData) {
        setError("Patient not found.");
        setIsLoading(false);
        return;
      }

      setProfile(profileData as PatientProfile);

      const { data: recordsData } = await supabase
        .from("medical_records")
        .select("id, category, title, description, record_date")
        .eq("patient_id", patientId)
        .order("record_date", { ascending: false });

      setRecords((recordsData as Record[]) || []);
      setIsLoading(false);
    };

    fetchPatient();
  }, [patientId, isAuthenticated, hasRole]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border glass">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Shield className="mb-4 h-12 w-12 text-primary" />
            <h2 className="font-display text-xl font-bold tracking-wider text-foreground">
              Access Required
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Emergency Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-destructive/30 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display tracking-wider text-destructive">
                <AlertTriangle className="h-5 w-5" />
                EMERGENCY INFORMATION
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Patient Name</p>
                    <p className="font-semibold text-foreground">{profile?.full_name || "Unknown"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Droplets className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-xs text-muted-foreground">Blood Type</p>
                    <p className="font-display text-xl font-bold text-destructive">
                      {profile?.blood_type || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {profile?.allergies && profile.allergies.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-destructive">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map((a) => (
                      <Badge key={a} className="bg-destructive/20 text-destructive">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile?.emergency_contact_name && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Emergency Contact ({profile.emergency_contact_relationship})
                    </p>
                    <p className="font-semibold text-foreground">
                      {profile.emergency_contact_name} — {profile.emergency_contact_phone}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Medical Records */}
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold tracking-wider text-foreground">
            Medical History
          </h2>
          {records.length === 0 ? (
            <Card className="border-border glass">
              <CardContent className="p-8 text-center text-muted-foreground">
                No medical records found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {records.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-border glass">
                    <CardContent className="flex items-start gap-4 p-4">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{r.title}</h3>
                          <Badge variant="secondary">{r.category.replace("_", " ")}</Badge>
                        </div>
                        {r.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.record_date).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientView;
