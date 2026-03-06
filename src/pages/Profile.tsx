import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Save, Copy, QrCode, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const Profile = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    blood_type: "",
    phone_number: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    allergies: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        date_of_birth: profile.date_of_birth || "",
        blood_type: profile.blood_type || "",
        phone_number: profile.phone_number || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
        emergency_contact_relationship: profile.emergency_contact_relationship || "",
        allergies: profile.allergies?.join(", ") || "",
      });
    }
  }, [profile]);

  const update = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const allergiesArr = form.allergies
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          date_of_birth: form.date_of_birth || null,
          blood_type: form.blood_type || null,
          phone_number: form.phone_number || null,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_phone: form.emergency_contact_phone || null,
          emergency_contact_relationship: form.emergency_contact_relationship || null,
          allergies: allergiesArr,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const patientCode = (profile as any)?.patient_code || null;

  const copyPatientId = () => {
    if (patientCode) {
      navigator.clipboard.writeText(patientCode);
      toast.success("Patient ID copied!");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-lg">
          <User className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{profile?.full_name || "Your"}</span> Profile
          </h1>
          <p className="text-sm text-muted-foreground">Manage your personal & emergency information</p>
        </div>
      </div>

      {/* Patient ID Card */}
      {patientCode && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card rounded-2xl border-0 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-accent via-primary to-accent animate-gradient-shift bg-[length:200%_200%]" />
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent shadow-lg">
                <QrCode className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Your Arogya AI Patient ID
                </p>
                <p className="text-2xl font-bold font-mono tracking-[0.3em] bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {patientCode}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copyPatientId} className="gap-1.5 rounded-xl border-primary/30 hover:border-primary/60">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="glass-card rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg tracking-wider">
            <User className="h-5 w-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Blood Type</Label>
              <Select value={form.blood_type} onValueChange={(v) => update("blood_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{bloodTypes.map((bt) => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input value={form.phone_number} onChange={(e) => update("phone_number", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Allergies (comma separated)</Label>
            <Input value={form.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="Penicillin, Peanuts" className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-wider">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Contact Name</Label>
              <Input value={form.emergency_contact_name} onChange={(e) => update("emergency_contact_name", e.target.value)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input value={form.emergency_contact_phone} onChange={(e) => update("emergency_contact_phone", e.target.value)} className="mt-1 rounded-xl" />
            </div>
          </div>
          <div>
            <Label>Relationship</Label>
            <Input value={form.emergency_contact_relationship} onChange={(e) => update("emergency_contact_relationship", e.target.value)} className="mt-1 rounded-xl" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 btn-gradient rounded-xl shadow-lg">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Wallet info */}
      <Card className="glass-card rounded-2xl border-0">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Connected Wallet:</span>{" "}
            {profile?.wallet_address || "Not connected"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
