import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ShieldCheck, Trash2, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface InsurancePolicy {
  id: string;
  provider_name: string;
  policy_number: string;
  plan_type: string | null;
  coverage_start: string;
  coverage_end: string | null;
  premium_amount: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  expired: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  cancelled: "bg-muted text-muted-foreground",
};

const Insurance = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    provider_name: "",
    policy_number: "",
    plan_type: "",
    coverage_start: new Date().toISOString().split("T")[0],
    coverage_end: "",
    premium_amount: "",
    status: "active",
    notes: "",
  });

  const fetchPolicies = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("insurance_policies")
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to fetch insurance policies.");
    } else {
      setPolicies((data as InsurancePolicy[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPolicies();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !form.provider_name || !form.policy_number) {
      toast.error("Provider name and policy number are required.");
      return;
    }
    const { error } = await supabase.from("insurance_policies").insert({
      patient_id: user.id,
      provider_name: form.provider_name,
      policy_number: form.policy_number,
      plan_type: form.plan_type || null,
      coverage_start: form.coverage_start,
      coverage_end: form.coverage_end || null,
      premium_amount: form.premium_amount ? parseFloat(form.premium_amount) : null,
      status: form.status,
      notes: form.notes || null,
    });
    if (error) {
      toast.error("Failed to add policy.");
    } else {
      toast.success("Policy added!");
      setIsOpen(false);
      setForm({ provider_name: "", policy_number: "", plan_type: "", coverage_start: new Date().toISOString().split("T")[0], coverage_end: "", premium_amount: "", status: "active", notes: "" });
      fetchPolicies();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("insurance_policies").delete().eq("id", id);
    if (error) toast.error("Failed to delete.");
    else { toast.success("Deleted."); fetchPolicies(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Insurance Tracker</h1>
          <p className="text-sm text-muted-foreground">Manage your insurance policies & coverage</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
              <Plus className="h-4 w-4" /> Add Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider text-primary">Add Insurance Policy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Provider Name *</Label>
                <Input value={form.provider_name} onChange={(e) => setForm((p) => ({ ...p, provider_name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Policy Number *</Label>
                <Input value={form.policy_number} onChange={(e) => setForm((p) => ({ ...p, policy_number: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Plan Type</Label>
                <Select value={form.plan_type} onValueChange={(v) => setForm((p) => ({ ...p, plan_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="dental">Dental</SelectItem>
                    <SelectItem value="vision">Vision</SelectItem>
                    <SelectItem value="life">Life</SelectItem>
                    <SelectItem value="disability">Disability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Coverage Start</Label>
                  <Input type="date" value={form.coverage_start} onChange={(e) => setForm((p) => ({ ...p, coverage_start: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Coverage End</Label>
                  <Input type="date" value={form.coverage_end} onChange={(e) => setForm((p) => ({ ...p, coverage_end: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Monthly Premium (₹)</Label>
                <Input type="number" value={form.premium_amount} onChange={(e) => setForm((p) => ({ ...p, premium_amount: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="mt-1" rows={2} />
              </div>
              <Button onClick={handleAdd} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Save Policy</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : policies.length === 0 ? (
        <Card className="border-border glass">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShieldCheck className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No insurance policies yet. Add your first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {policies.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border glass group">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{p.provider_name}</h3>
                      <Badge className={statusColors[p.status] || "bg-muted text-muted-foreground"}>{p.status}</Badge>
                      {p.plan_type && <Badge variant="outline" className="capitalize">{p.plan_type}</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Policy #: {p.policy_number}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(p.coverage_start).toLocaleDateString()} – {p.coverage_end ? new Date(p.coverage_end).toLocaleDateString() : "Ongoing"}</span>
                      {p.premium_amount && <span>₹{p.premium_amount}/mo</span>}
                    </div>
                    {p.notes && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Insurance;
