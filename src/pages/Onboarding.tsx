import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, User, Phone, Droplets, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const update = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
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
          onboarding_complete: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Profile setup complete!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      title: "Personal Info",
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Full Name *</Label>
            <Input
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              placeholder="John Doe"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => update("date_of_birth", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      ),
      canNext: form.full_name.trim().length > 0,
    },
    {
      title: "Medical Info",
      icon: Droplets,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Blood Type</Label>
            <Select value={form.blood_type} onValueChange={(v) => update("blood_type", v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select blood type" />
              </SelectTrigger>
              <SelectContent>
                {bloodTypes.map((bt) => (
                  <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Known Allergies</Label>
            <Input
              value={form.allergies}
              onChange={(e) => update("allergies", e.target.value)}
              placeholder="Penicillin, Peanuts (comma separated)"
              className="mt-1"
            />
          </div>
        </div>
      ),
      canNext: true,
    },
    {
      title: "Emergency Contact",
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Your Phone Number</Label>
            <Input
              value={form.phone_number}
              onChange={(e) => update("phone_number", e.target.value)}
              placeholder="+1 234 567 8900"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Emergency Contact Name</Label>
            <Input
              value={form.emergency_contact_name}
              onChange={(e) => update("emergency_contact_name", e.target.value)}
              placeholder="Jane Doe"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Emergency Contact Phone</Label>
            <Input
              value={form.emergency_contact_phone}
              onChange={(e) => update("emergency_contact_phone", e.target.value)}
              placeholder="+1 234 567 8900"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Relationship</Label>
            <Input
              value={form.emergency_contact_relationship}
              onChange={(e) => update("emergency_contact_relationship", e.target.value)}
              placeholder="Spouse, Parent, etc."
              className="mt-1"
            />
          </div>
        </div>
      ),
      canNext: true,
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <div className="absolute inset-0 bg-[linear-gradient(hsl(220_16%_18%/0.3)_1px,transparent_1px),linear-gradient(to_right,hsl(220_16%_18%/0.3)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg px-4"
      >
        <Card className="border-border glass">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <currentStep.icon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-display tracking-wider text-primary">
              {currentStep.title}
            </CardTitle>
            <CardDescription>
              Step {step + 1} of {steps.length} — Set up your MediLocker profile
            </CardDescription>
            {/* Progress bar */}
            <div className="mt-4 flex gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-primary glow-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep.content}
            <div className="flex gap-3">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!currentStep.canNext}
                  className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                >
                  {isSubmitting ? "Saving..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
