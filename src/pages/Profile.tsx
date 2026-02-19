import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Save } from "lucide-react";

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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal and emergency information</p>
      </div>

      <Card className="border-border glass">
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

      <Card className="border-border glass">
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-wider">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Contact Name</Label>
              <Input value={form.emergency_contact_name} onChange={(e) => update("emergency_contact_name", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input value={form.emergency_contact_phone} onChange={(e) => update("emergency_contact_phone", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Relationship</Label>
            <Input value={form.emergency_contact_relationship} onChange={(e) => update("emergency_contact_relationship", e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Wallet info */}
      <Card className="border-border glass">
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
