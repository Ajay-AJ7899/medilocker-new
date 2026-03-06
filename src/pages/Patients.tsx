import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, UserCheck, Plus, Upload, Paperclip, X, Building2, User, Droplets, AlertTriangle, Calendar, Brain, Bone, Eye, Radio, Sparkles, Loader2, Stethoscope, Heart, Phone, Shield, FileText, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

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

interface PatientProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  patient_code: string | null;
  blood_type: string | null;
  date_of_birth: string | null;
  allergies: string[] | null;
  phone_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

const Patients = () => {
  const { user, profile } = useAuth();
  const [searchCode, setSearchCode] = useState("");
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [files, setFiles] = useState<File[]>([]);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedScanType, setSelectedScanType] = useState("");
  const [markUrgent, setMarkUrgent] = useState(false);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [patientDocuments, setPatientDocuments] = useState<Record<string, any[]>>({});
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [newRecord, setNewRecord] = useState({
    category: "",
    title: "",
    description: "",
    record_date: new Date().toISOString().split("T")[0],
    hospital_name: "",
  });

  const doctorName = profile?.full_name || "Doctor";

  const searchPatient = async () => {
    if (!searchCode.trim()) { toast.error("Enter a patient code."); return; }
    setIsSearching(true);
    setPatient(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, patient_code, blood_type, date_of_birth, allergies, phone_number, emergency_contact_name, emergency_contact_phone")
      .eq("patient_code", searchCode.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      toast.error("Patient not found. Check the code.");
    } else {
      setPatient(data as PatientProfile);
      toast.success(`Patient found: ${(data as PatientProfile).full_name || "Unknown"}`);
      // Auto-fetch records
      fetchPatientRecords((data as PatientProfile).user_id);
    }
    setIsSearching(false);
  };

  const fetchPatientRecords = async (patientUserId: string) => {
    setIsLoadingRecords(true);
    const { data: recs } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patientUserId)
      .order("is_urgent", { ascending: false })
      .order("record_date", { ascending: false });

    const records = recs || [];
    setPatientRecords(records);

    if (records.length > 0) {
      const recordIds = records.map((r: any) => r.id);
      const { data: docs } = await supabase
        .from("medical_documents")
        .select("*")
        .in("record_id", recordIds);
      if (docs) {
        const grouped: Record<string, any[]> = {};
        docs.forEach((d: any) => {
          if (d.record_id) {
            if (!grouped[d.record_id]) grouped[d.record_id] = [];
            grouped[d.record_id].push(d);
          }
        });
        setPatientDocuments(grouped);
      }
    }
    setIsLoadingRecords(false);
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (selected.length + docFiles.length > 5) { toast.error("Maximum 5 files allowed."); return; }
      setDocFiles((prev) => [...prev, ...selected]);
    }
  };

  const handleUploadDocuments = async () => {
    if (!user || !patient || docFiles.length === 0) {
      toast.error("Select files to upload.");
      return;
    }
    setIsUploadingDocs(true);
    try {
      for (const file of docFiles) {
        const filePath = `${patient.user_id}/standalone/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("medical-documents").upload(filePath, file);
        if (uploadError) { console.error("Upload error:", uploadError); continue; }
        const { data: urlData } = supabase.storage.from("medical-documents").getPublicUrl(filePath);
        await supabase.from("medical_documents").insert({
          patient_id: patient.user_id,
          file_name: file.name,
          file_url: urlData.publicUrl || filePath,
          file_type: file.type || "unknown",
          file_size: file.size,
          uploaded_by: user.id,
        });
      }
      toast.success(`${docFiles.length} document(s) uploaded to ${patient.full_name || "patient"}'s records!`);
      setDocFiles([]);
      fetchPatientRecords(patient.user_id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload documents.");
    } finally {
      setIsUploadingDocs(false);
    }
  };

  const handleDocDownload = async (doc: any) => {
    try {
      const urlParts = doc.file_url.split("/medical-documents/");
      const filePath = urlParts.length > 1 ? urlParts[urlParts.length - 1] : null;
      if (filePath) {
        const { data } = await supabase.storage.from("medical-documents").createSignedUrl(decodeURIComponent(filePath), 60);
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
    } catch {
      toast.error("Failed to download file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (selected.length + files.length > 5) { toast.error("Maximum 5 files allowed."); return; }
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const uploadFiles = async (recordId: string, patientUserId: string) => {
    for (const file of files) {
      const filePath = `${patientUserId}/${recordId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("medical-documents").upload(filePath, file);
      if (uploadError) { console.error("Upload error:", uploadError); continue; }
      const { data: urlData } = supabase.storage.from("medical-documents").getPublicUrl(filePath);
      await supabase.from("medical_documents").insert({
        patient_id: patientUserId,
        record_id: recordId,
        file_name: file.name,
        file_url: urlData.publicUrl || filePath,
        file_type: file.type || "unknown",
        file_size: file.size,
        uploaded_by: user?.id || null,
      });
    }
  };

  const handleAddRecord = async () => {
    if (!user || !patient || !newRecord.category || !newRecord.title) {
      toast.error("Fill in required fields (category & title).");
      return;
    }
    setIsUploading(true);
    const description = [newRecord.description, newRecord.hospital_name ? `Hospital: ${newRecord.hospital_name}` : ""].filter(Boolean).join("\n");
    const metadata: Record<string, unknown> = {};
    if (selectedScanType) metadata.scan_type = selectedScanType;

    const { data: insertedRecord, error } = await supabase.from("medical_records").insert({
      patient_id: patient.user_id,
      added_by: user.id,
      category: newRecord.category as any,
      title: newRecord.title,
      description: description || null,
      record_date: newRecord.record_date,
      is_urgent: markUrgent,
      metadata,
    } as any).select("id").single();

    if (error || !insertedRecord) { toast.error("Failed to add record."); setIsUploading(false); return; }
    if (files.length > 0) await uploadFiles(insertedRecord.id, patient.user_id);

    toast.success(`Record added for ${patient.full_name || "patient"}!`);

    if (selectedScanType) {
      setIsAnalyzing(true);
      try {
        const { data: aiData } = await supabase.functions.invoke("analyze-scan", {
          body: {
            recordId: insertedRecord.id,
            recordTitle: newRecord.title,
            category: newRecord.category,
            scanType: selectedScanType,
            description: description,
            patientContext: {
              name: patient.full_name,
              bloodType: patient.blood_type,
              allergies: patient.allergies,
            },
          },
        });
        if (aiData?.analysis) {
          await supabase.from("medical_records")
            .update({ ai_analysis: aiData.analysis, is_urgent: aiData.isUrgent || markUrgent } as any)
            .eq("id", insertedRecord.id);
          toast.success(aiData.isUrgent ? "⚠️ AI flagged this as URGENT!" : "AI analysis complete.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    }

    setFiles([]);
    setSelectedScanType("");
    setMarkUrgent(false);
    setNewRecord({ category: "", title: "", description: "", record_date: new Date().toISOString().split("T")[0], hospital_name: "" });
    setIsUploading(false);
    // Refresh records view
    if (patient) fetchPatientRecords(patient.user_id);
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-lg animate-glow-pulse">
          <Stethoscope className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Dr. {doctorName.split(" ")[0]}'s</span> Patient Panel
          </h1>
          <p className="text-sm text-muted-foreground">Search a patient by code to view details or <span className="text-primary font-medium">add records</span></p>
        </div>
      </div>

      {/* Search */}
      <Card className="glass-card rounded-2xl border-0 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary animate-gradient-shift bg-[length:200%_200%]" />
        <CardContent className="p-5">
          <Label className="text-xs font-medium text-muted-foreground">Patient Code</Label>
          <div className="mt-1.5 flex gap-3">
            <Input
              placeholder="e.g. A1B2C3D4"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && searchPatient()}
              className="font-mono tracking-wider rounded-xl"
            />
            <Button onClick={searchPatient} disabled={isSearching} className="gap-2 btn-gradient rounded-xl">
              <Search className="h-4 w-4" />
              {isSearching ? "..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient found */}
      <AnimatePresence>
        {patient && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Patient badge */}
            <Card className="glass-card rounded-2xl border-0 overflow-hidden">
              <div className="h-1 w-full gradient-accent" />
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent shadow-lg text-white text-xl font-bold">
                  {patient.full_name ? patient.full_name.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-foreground">{patient.full_name || "Unknown Patient"}</p>
                  <p className="text-xs font-mono text-accent font-bold tracking-widest mt-0.5">ID: {patient.patient_code}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="font-mono text-primary">#{patient.patient_code}</span>
                    {patient.blood_type && <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{patient.blood_type}</span>}
                    {patient.date_of_birth && <span>{calculateAge(patient.date_of_birth)} yrs</span>}
                  </div>
                </div>
                <Badge className="bg-primary/15 text-primary border-0 rounded-full">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-muted rounded-xl">
                <TabsTrigger value="details" className="rounded-lg text-xs">Details</TabsTrigger>
                <TabsTrigger value="records" className="rounded-lg text-xs">Records</TabsTrigger>
                <TabsTrigger value="upload" className="rounded-lg text-xs">Upload Docs</TabsTrigger>
                <TabsTrigger value="add-record" className="rounded-lg text-xs">Add Record</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details">
                <Card className="glass-card rounded-2xl border-0">
                  <CardContent className="p-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { icon: User, label: "Full Name", value: patient.full_name, gradient: "gradient-primary" },
                        { icon: Droplets, label: "Blood Type", value: patient.blood_type, gradient: "gradient-accent" },
                        { icon: Calendar, label: "Age", value: patient.date_of_birth ? `${calculateAge(patient.date_of_birth)} years` : "N/A", gradient: "gradient-warm" },
                        { icon: AlertTriangle, label: "Allergies", value: patient.allergies?.length ? patient.allergies.join(", ") : "None", gradient: "gradient-sunny" },
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 rounded-xl glass-card p-3"
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.gradient} shadow-sm`}>
                            <item.icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className="text-sm font-medium text-foreground">{item.value || "N/A"}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {patient.phone_number && (
                      <div className="flex items-center gap-3 rounded-xl glass-card p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-sm">
                          <Phone className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium text-foreground">{patient.phone_number}</p>
                        </div>
                      </div>
                    )}
                    {patient.emergency_contact_name && (
                      <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/20">
                          <Shield className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="text-xs text-destructive font-medium">Emergency Contact</p>
                          <p className="text-sm font-medium text-foreground">{patient.emergency_contact_name} — {patient.emergency_contact_phone}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* View Records Tab */}
              <TabsContent value="records">
                <Card className="glass-card rounded-2xl border-0">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {patient.full_name}'s Medical Records
                      </span>
                      <Badge className="ml-auto bg-primary/15 text-primary border-0 text-xs">{patientRecords.length} records</Badge>
                    </h3>
                    {isLoadingRecords ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : patientRecords.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No medical records found for this patient.</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {patientRecords.map((rec: any, i: number) => {
                          const scanType = rec.metadata?.scan_type;
                          return (
                            <motion.div
                              key={rec.id}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className={`rounded-xl glass-card p-3 ${rec.is_urgent ? "border border-destructive/30 glow-urgent" : ""}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${rec.is_urgent ? "bg-destructive/20" : "gradient-primary"} shadow-sm`}>
                                  <FileText className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-foreground">{rec.title}</p>
                                    {rec.is_urgent && (
                                      <Badge className="bg-destructive/20 text-destructive border-0 text-xs animate-pulse">URGENT</Badge>
                                    )}
                                    {scanType && (
                                      <Badge className="bg-accent/15 text-accent border-0 text-xs">
                                        {scanTypes.find(s => s.value === scanType)?.label || scanType}
                                      </Badge>
                                    )}
                                  </div>
                                  {rec.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rec.description}</p>}
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(rec.record_date).toLocaleDateString()}
                                    {rec.added_by === user?.id && <span className="text-primary ml-2">• Added by you</span>}
                                  </p>
                                  {rec.ai_analysis && (
                                    <div className="mt-2 rounded-lg border border-accent/20 bg-accent/5 p-2">
                                      <p className="text-xs text-accent flex items-center gap-1 mb-0.5"><Sparkles className="h-3 w-3" /> AI Analysis</p>
                                      <p className="text-xs text-muted-foreground line-clamp-2">{rec.ai_analysis}</p>
                                    </div>
                                  )}
                                  {patientDocuments[rec.id] && patientDocuments[rec.id].length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {patientDocuments[rec.id].map((doc: any) => (
                                        <button
                                          key={doc.id}
                                          onClick={() => handleDocDownload(doc)}
                                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
                                        >
                                          <Paperclip className="h-3 w-3" />
                                          {doc.file_name}
                                          <Download className="h-3 w-3 opacity-50" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Upload Documents Tab */}
              <TabsContent value="upload">
                <Card className="glass-card rounded-2xl border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-accent">
                        <Upload className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent font-bold">Upload Documents</span>
                      <span className="text-xs text-muted-foreground ml-auto">to {patient.full_name || "patient"}'s file</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border-2 border-dashed border-accent/20 bg-accent/5 p-6 hover:border-accent/40 transition-colors">
                      <label className="flex cursor-pointer flex-col items-center gap-2">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent shadow-lg">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-foreground">Upload scans, reports, prescriptions</span>
                        <span className="text-xs text-muted-foreground">PDF, Images, DICOM files (max 5)</span>
                        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.dicom" onChange={handleDocFileChange} className="hidden" />
                      </label>
                    </div>
                    {docFiles.length > 0 && (
                      <div className="space-y-1.5">
                        {docFiles.map((file, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl glass-card px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="h-3 w-3 shrink-0 text-accent" />
                              <span className="truncate text-sm text-foreground">{file.name}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)}KB)</span>
                            </div>
                            <button onClick={() => setDocFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <Button
                          onClick={handleUploadDocuments}
                          disabled={isUploadingDocs}
                          className="w-full btn-gradient rounded-xl py-4 mt-2"
                        >
                          {isUploadingDocs ? (
                            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</span>
                          ) : (
                            <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Upload {docFiles.length} file(s) to {patient.full_name?.split(" ")[0]}'s Records</span>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Add Record Tab */}
              <TabsContent value="add-record">
                <Card className="glass-card rounded-2xl border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
                        <Plus className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">New Medical Record</span>
                      <span className="text-xs text-muted-foreground ml-auto">for {patient.full_name || "patient"}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Category *</Label>
                        <Select value={newRecord.category} onValueChange={(v) => setNewRecord((p) => ({ ...p, category: v }))}>
                          <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input type="date" value={newRecord.record_date} onChange={(e) => setNewRecord((p) => ({ ...p, record_date: e.target.value }))} className="mt-1 rounded-xl" />
                      </div>
                    </div>

                    {/* Scan Type Selector */}
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
                      <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Hospital / Clinic</Label>
                      <Input value={newRecord.hospital_name} onChange={(e) => setNewRecord((p) => ({ ...p, hospital_name: e.target.value }))} className="mt-1 rounded-xl" placeholder="e.g. City General Hospital" />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea value={newRecord.description} onChange={(e) => setNewRecord((p) => ({ ...p, description: e.target.value }))} className="mt-1 rounded-xl" rows={2} placeholder="Optional notes..." />
                    </div>

                    {/* Urgent toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <Label className="text-sm text-destructive font-medium">Mark as Urgent</Label>
                      </div>
                      <Switch checked={markUrgent} onCheckedChange={setMarkUrgent} />
                    </div>

                    {/* File Upload */}
                    <div>
                      <Label className="flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Attach Documents</Label>
                      <div className="mt-2 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-4 hover:border-primary/40 transition-colors">
                        <label className="flex cursor-pointer flex-col items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary shadow-sm">
                            <Upload className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Upload scans, reports, prescriptions</span>
                          <span className="text-xs text-muted-foreground">PDF, Images, DICOM (max 5 files)</span>
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
                              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedScanType && (
                      <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
                        <p className="text-xs text-accent">
                          <Sparkles className="inline h-3 w-3 mr-1" />
                          AI will analyze this <span className="font-bold">{scanTypes.find(s => s.value === selectedScanType)?.label}</span> and flag urgent findings automatically.
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleAddRecord}
                      disabled={isUploading || isAnalyzing}
                      className="w-full btn-gradient rounded-xl py-5 text-base font-semibold"
                    >
                      {isUploading ? (
                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
                      ) : isAnalyzing ? (
                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> AI Analyzing...</span>
                      ) : (
                        <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add Record for {patient.full_name?.split(" ")[0] || "Patient"}</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Patients;
