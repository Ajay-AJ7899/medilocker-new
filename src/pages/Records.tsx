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
import { Plus, FileText, Calendar, Upload, Trash2, Download, Paperclip, Brain, Bone, Eye, Radio, AlertTriangle, Loader2, Sparkles, Stethoscope, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

const categories = [
  { value: "consultation", label: "Consultation" },
  { value: "diagnosis", label: "Diagnosis" },
  { value: "medication", label: "Medication" },
  { value: "surgery", label: "Surgery" },
  { value: "chronic_condition", label: "Chronic Condition" },
  { value: "treatment_plan", label: "Treatment Plan" },
  { value: "lab_result", label: "Lab Result" },
  { value: "allergy", label: "Allergy" },
  { value: "vaccination", label: "Vaccination" },
];

const scanTypes = [
  { value: "xray", label: "X-Ray", icon: Bone, gradient: "gradient-primary", desc: "Radiographic imaging" },
  { value: "ct", label: "CT Scan", icon: Radio, gradient: "gradient-accent", desc: "Computed tomography" },
  { value: "mri", label: "MRI", icon: Brain, gradient: "gradient-warm", desc: "Magnetic resonance" },
  { value: "ultrasound", label: "Ultrasound", icon: Eye, gradient: "gradient-sunny", desc: "Sonographic imaging" },
];

const categoryColors: Record<string, string> = {
  consultation: "bg-primary/15 text-primary",
  diagnosis: "bg-destructive/15 text-destructive",
  medication: "bg-[hsl(160,84%,39%)]/15 text-[hsl(160,84%,39%)]",
  surgery: "bg-[hsl(38,92%,50%)]/15 text-[hsl(38,92%,50%)]",
  chronic_condition: "bg-[hsl(280,80%,55%)]/15 text-[hsl(280,80%,55%)]",
  treatment_plan: "bg-accent/15 text-accent",
  lab_result: "bg-[hsl(38,92%,50%)]/15 text-[hsl(38,92%,50%)]",
  allergy: "bg-[hsl(340,82%,52%)]/15 text-[hsl(340,82%,52%)]",
  vaccination: "bg-accent/15 text-accent",
};

const categoryGradients: Record<string, string> = {
  consultation: "gradient-primary",
  diagnosis: "gradient-warm",
  medication: "gradient-accent",
  surgery: "gradient-sunny",
  chronic_condition: "gradient-primary",
  treatment_plan: "gradient-accent",
  lab_result: "gradient-sunny",
  allergy: "gradient-warm",
  vaccination: "gradient-accent",
};

interface MedicalDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
}

interface MedicalRecord {
  id: string;
  category: string;
  title: string;
  description: string | null;
  record_date: string;
  metadata: Record<string, unknown>;
  created_at: string;
  added_by: string | null;
  is_urgent: boolean;
  ai_analysis: string | null;
}

interface DoctorInfo {
  full_name: string | null;
  phone_number: string | null;
  wallet_address: string;
}

const Records = () => {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [documents, setDocuments] = useState<Record<string, MedicalDocument[]>>({});
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedScanType, setSelectedScanType] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState({
    category: "",
    title: "",
    description: "",
    record_date: new Date().toISOString().split("T")[0],
  });
  const [files, setFiles] = useState<File[]>([]);

  const fetchRecords = async () => {
    if (!user) return;
    setIsLoading(true);
    let query = supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", user.id)
      .order("is_urgent", { ascending: false })
      .order("record_date", { ascending: false });

    if (filter !== "all") {
      query = query.eq("category", filter as any);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
      toast.error("Failed to fetch records.");
    } else {
      const recs = (data as MedicalRecord[]) || [];
      setRecords(recs);

      // Fetch doctor names for records added by others
      const doctorIds = [...new Set(recs.filter(r => r.added_by && r.added_by !== user.id).map(r => r.added_by!))];
      if (doctorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", doctorIds);
        if (profiles) {
          const names: Record<string, string> = {};
          profiles.forEach((p: any) => { names[p.user_id] = p.full_name || "Doctor"; });
          setDoctorNames(names);
        }
      }

      if (recs.length > 0) {
        const recordIds = recs.map(r => r.id);
        const { data: docs } = await supabase
          .from("medical_documents")
          .select("*")
          .in("record_id", recordIds);

        if (docs) {
          const grouped: Record<string, MedicalDocument[]> = {};
          (docs as MedicalDocument[]).forEach(d => {
            const rid = (d as any).record_id;
            if (rid && !grouped[rid]) grouped[rid] = [];
            if (rid) grouped[rid].push(d);
          });
          setDocuments(grouped);
        }
      } else {
        setDocuments({});
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, [user, filter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (selected.length + files.length > 5) { toast.error("Maximum 5 files allowed."); return; }
      setFiles(prev => [...prev, ...selected]);
    }
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleAdd = async () => {
    if (!user || !newRecord.category || !newRecord.title) {
      toast.error("Please fill in the required fields.");
      return;
    }

    try {
      const metadata: Record<string, unknown> = {};
      if (selectedScanType) metadata.scan_type = selectedScanType;

      const { data: record, error } = await supabase
        .from("medical_records")
        .insert({
          patient_id: user.id,
          added_by: user.id,
          category: newRecord.category as any,
          title: newRecord.title,
          description: newRecord.description || null,
          record_date: newRecord.record_date,
          metadata,
        } as any)
        .select()
        .single();

      if (error) throw error;

      if (files.length > 0 && record) {
        for (const file of files) {
          const filePath = `${user.id}/${record.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("medical-documents")
            .upload(filePath, file);

          if (uploadError) { console.error(uploadError); continue; }
          const { data: urlData } = supabase.storage
            .from("medical-documents")
            .getPublicUrl(filePath);

          await supabase.from("medical_documents").insert({
            patient_id: user.id,
            record_id: record.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user.id,
          });
        }
      }

      toast.success("Record added!");
      setIsOpen(false);
      setNewRecord({ category: "", title: "", description: "", record_date: new Date().toISOString().split("T")[0] });
      setFiles([]);
      setSelectedScanType("");
      fetchRecords();

      if (selectedScanType && record) {
        analyzeRecord(record.id, newRecord.title, newRecord.category, selectedScanType, newRecord.description);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add record.");
    }
  };

  const analyzeRecord = async (recordId: string, title: string, category: string, scanType: string, description: string) => {
    setIsAnalyzing(recordId);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-scan", {
        body: { recordId, recordTitle: title, category, scanType, description },
      });
      if (error) throw error;
      if (data?.analysis) {
        await supabase.from("medical_records")
          .update({ ai_analysis: data.analysis, is_urgent: data.isUrgent || false } as any)
          .eq("id", recordId);
        toast.success(data.isUrgent ? "⚠️ AI flagged this as URGENT!" : "AI analysis complete.");
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
      toast.error("AI analysis failed.");
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("medical_records").delete().eq("id", id);
    if (error) toast.error("Failed to delete record.");
    else { toast.success("Record deleted."); fetchRecords(); }
  };

  const handleDownload = async (record: MedicalRecord) => {
    let doctorInfo: DoctorInfo | null = null;
    if (record.added_by && record.added_by !== user?.id) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone_number, wallet_address")
        .eq("user_id", record.added_by)
        .maybeSingle();
      if (data) doctorInfo = data as DoctorInfo;
    }
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(33, 37, 41);
    doc.text("Arogya - Medical Report", 20, 25);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date(record.record_date).toLocaleDateString()}`, 20, 40);
    doc.text(`Category: ${categories.find(c => c.value === record.category)?.label || record.category}`, 20, 48);
    doc.setFontSize(16);
    doc.setTextColor(33, 37, 41);
    doc.text(record.title, 20, 62);
    if (record.description) {
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(record.description, 170);
      doc.text(lines, 20, 72);
    }
    if (doctorInfo) {
      const yStart = record.description ? 72 + (doc.splitTextToSize(record.description, 170).length * 6) + 15 : 80;
      doc.setDrawColor(59, 130, 246);
      doc.line(20, yStart, 190, yStart);
      doc.setFontSize(13);
      doc.setTextColor(59, 130, 246);
      doc.text("Doctor Information", 20, yStart + 10);
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(`Name: ${doctorInfo.full_name || "N/A"}`, 20, yStart + 20);
      doc.text(`Phone: ${doctorInfo.phone_number || "N/A"}`, 20, yStart + 28);
    }
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()} via Arogya`, 20, 285);
    doc.save(`${record.title.replace(/\s+/g, "_")}_report.pdf`);
    toast.success("Report downloaded!");
  };

  const handleFileDownload = async (doc: MedicalDocument) => {
    try {
      const urlParts = doc.file_url.split("/medical-documents/");
      const filePath = urlParts.length > 1 ? urlParts[urlParts.length - 1] : null;
      if (filePath) {
        const { data, error } = await supabase.storage
          .from("medical-documents")
          .createSignedUrl(decodeURIComponent(filePath), 60);
        if (data?.signedUrl) {
          const link = document.createElement("a");
          link.href = data.signedUrl;
          link.download = doc.file_name;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(`Downloading ${doc.file_name}`);
          return;
        }
      }
      window.open(doc.file_url, "_blank");
      toast.success(`Opening ${doc.file_name}`);
    } catch {
      toast.error("Failed to download file.");
    }
  };

  const getScanIcon = (scanType: string) => {
    const found = scanTypes.find(s => s.value === scanType);
    return found ? found.icon : FileText;
  };

  const patientName = profile?.full_name || "Patient";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-accent shadow-lg animate-float">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{patientName}'s</span> Records
            </h1>
            <p className="text-sm text-muted-foreground">
              Your complete <span className="text-primary font-medium">medical history</span> — secured & organized
            </p>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 btn-gradient rounded-xl shadow-md">
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong border-border/30 sm:max-w-lg rounded-2xl neon-border">
            <DialogHeader>
              <DialogTitle className="font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Add Medical Record
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <Label>Category *</Label>
                <Select value={newRecord.category} onValueChange={(v) => setNewRecord((p) => ({ ...p, category: v }))}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scan Type Selector - Enhanced */}
              <div>
                <Label className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Medical Imaging Type
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {scanTypes.map(({ value, label, icon: Icon, gradient, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedScanType(selectedScanType === value ? "" : value)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        selectedScanType === value
                          ? "border-primary/50 bg-primary/10 text-primary glow-primary"
                          : "border-border/30 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selectedScanType === value ? gradient : "bg-muted"} transition-all`}>
                        <Icon className={`h-5 w-5 ${selectedScanType === value ? "text-white" : ""}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Title *</Label>
                <Input value={newRecord.title} onChange={(e) => setNewRecord((p) => ({ ...p, title: e.target.value }))} className="mt-1 rounded-xl" placeholder="e.g. Chest X-Ray Report" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newRecord.description} onChange={(e) => setNewRecord((p) => ({ ...p, description: e.target.value }))} className="mt-1 rounded-xl" rows={3} placeholder="Notes about the record..." />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={newRecord.record_date} onChange={(e) => setNewRecord((p) => ({ ...p, record_date: e.target.value }))} className="mt-1 rounded-xl" />
              </div>

              {/* File Upload */}
              <div>
                <Label className="flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Attach Documents</Label>
                <div className="mt-2 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-4 hover:border-primary/40 transition-colors">
                  <label className="flex cursor-pointer flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-sm">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Upload reports, scans, prescriptions</span>
                    <span className="text-xs text-muted-foreground">PDF, Images, DICOM, Docs (max 5 files)</span>
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.dicom" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl glass-card px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-3 w-3 shrink-0 text-primary" />
                          <span className="truncate text-sm text-foreground">{file.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)}KB)</span>
                        </div>
                        <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedScanType && (
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
                  <p className="text-xs text-accent">
                    <Sparkles className="inline h-3 w-3 mr-1" />
                    AI will automatically analyze this <span className="font-bold">{scanTypes.find(s => s.value === selectedScanType)?.label}</span> scan and flag urgent findings.
                  </p>
                </div>
              )}

              <Button onClick={handleAdd} className="w-full btn-gradient rounded-xl py-5 text-base font-semibold">Save Record</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scan Type Quick Filters */}
      <div className="grid grid-cols-4 gap-3">
        {scanTypes.map(({ value, label, icon: Icon, gradient }) => {
          const count = records.filter(r => (r.metadata as any)?.scan_type === value).length;
          return (
            <motion.button
              key={value}
              whileHover={{ y: -2 }}
              onClick={() => setFilter(filter === value ? "all" : value as any)}
              className={`glass-card rounded-2xl p-4 text-center transition-all border-0 ${filter === value ? "glow-primary" : ""}`}
            >
              <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${gradient} shadow-sm mb-2`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{count}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={filter === "all" ? "btn-gradient rounded-full shadow-sm" : "rounded-full border-border/30"}
        >
          All ({records.length})
        </Button>
        {categories.map((c) => (
          <Button
            key={c.value}
            size="sm"
            variant={filter === c.value ? "default" : "outline"}
            onClick={() => setFilter(c.value)}
            className={filter === c.value ? "btn-gradient rounded-full shadow-sm" : "rounded-full border-border/30"}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {/* Records list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : records.length === 0 ? (
        <Card className="glass-card rounded-2xl border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl gradient-primary mb-4 animate-float">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">No records yet</p>
            <p className="text-muted-foreground text-sm">Add your first medical record or ask your <span className="text-primary font-medium">doctor to add one</span>.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {records.map((record, i) => {
              const scanType = (record.metadata as any)?.scan_type;
              const ScanIcon = scanType ? getScanIcon(scanType) : FileText;
              const addedByDoctor = record.added_by && record.added_by !== user?.id;
              const doctorName = addedByDoctor ? doctorNames[record.added_by!] : null;

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className={`glass-card rounded-2xl border-0 card-hover group overflow-hidden ${record.is_urgent ? "glow-urgent" : ""}`}>
                    <CardContent className="flex items-start gap-4 p-5 relative">
                      {/* Left accent bar */}
                      <div className={`absolute left-0 top-0 h-full w-1 ${record.is_urgent ? "bg-destructive" : categoryGradients[record.category] || "gradient-primary"}`} />
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${categoryGradients[record.category] || "gradient-primary"} shadow-sm transition-transform group-hover:scale-105`}>
                        <ScanIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{record.title}</h3>
                          <Badge className={`${categoryColors[record.category] || "bg-muted text-muted-foreground"} border-0 rounded-full text-xs font-medium`}>
                            {categories.find((c) => c.value === record.category)?.label || record.category}
                          </Badge>
                          {scanType && (
                            <Badge className="bg-accent/15 text-accent border-0 rounded-full text-xs">
                              {scanTypes.find(s => s.value === scanType)?.label}
                            </Badge>
                          )}
                          {record.is_urgent && (
                            <Badge className="bg-destructive/20 text-destructive border-0 rounded-full text-xs animate-pulse font-bold">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              URGENT
                            </Badge>
                          )}
                        </div>
                        {record.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{record.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(record.record_date).toLocaleDateString()}
                          </span>
                          {addedByDoctor && (
                            <span className="flex items-center gap-1 text-primary font-medium">
                              <Stethoscope className="h-3 w-3" />
                              Added by Dr. {doctorName || "Doctor"}
                            </span>
                          )}
                          {!addedByDoctor && record.added_by && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Self-added
                            </span>
                          )}
                        </div>

                        {/* AI Analysis */}
                        {record.ai_analysis && (
                          <div className={`mt-3 rounded-xl border p-3 text-sm ${record.is_urgent ? "border-destructive/20 bg-destructive/5" : "border-accent/20 bg-accent/5"}`}>
                            <p className="text-xs font-semibold text-accent mb-1 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> AI Analysis
                            </p>
                            <p className="text-muted-foreground text-xs leading-relaxed">{record.ai_analysis}</p>
                          </div>
                        )}

                        {isAnalyzing === record.id && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-accent">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Analyzing with AI...
                          </div>
                        )}

                        {documents[record.id] && documents[record.id].length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                              <Paperclip className="h-3 w-3" /> Attached Documents ({documents[record.id].length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {documents[record.id].map((doc) => (
                                <button
                                  key={doc.id}
                                  onClick={() => handleFileDownload(doc)}
                                  className="inline-flex items-center gap-1.5 rounded-xl glass-card px-3 py-1.5 text-xs text-primary hover:glow-primary transition-all font-medium"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {doc.file_name}
                                  <Download className="h-3 w-3 opacity-50" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {scanType && !record.ai_analysis && (
                          <Button variant="ghost" size="icon" onClick={() => analyzeRecord(record.id, record.title, record.category, scanType, record.description || "")} className="text-accent hover:text-accent rounded-xl" title="AI Analyze">
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(record)} className="text-muted-foreground hover:text-primary rounded-xl" title="Download Report">
                          <Download className="h-4 w-4" />
                        </Button>
                        {(!record.added_by || record.added_by === user?.id) && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(record.id)} className="text-muted-foreground hover:text-destructive rounded-xl">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Records;
