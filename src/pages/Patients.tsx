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
import { Search, UserCheck, Plus, Upload, Paperclip, X, Building2, User, Droplets, AlertTriangle, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const { user } = useAuth();
  const [searchCode, setSearchCode] = useState("");
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newRecord, setNewRecord] = useState({
    category: "",
    title: "",
    description: "",
    record_date: new Date().toISOString().split("T")[0],
    hospital_name: "",
  });

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
    }
    setIsSearching(false);
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

    const { data: insertedRecord, error } = await supabase.from("medical_records").insert({
      patient_id: patient.user_id,
      added_by: user.id,
      category: newRecord.category as any,
      title: newRecord.title,
      description: description || null,
      record_date: newRecord.record_date,
    }).select("id").single();

    if (error || !insertedRecord) { toast.error("Failed to add record."); setIsUploading(false); return; }
    if (files.length > 0) await uploadFiles(insertedRecord.id, patient.user_id);

    toast.success("Record added successfully!");
    setFiles([]);
    setNewRecord({ category: "", title: "", description: "", record_date: new Date().toISOString().split("T")[0], hospital_name: "" });
    setIsUploading(false);
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patient Management</h1>
        <p className="text-sm text-muted-foreground">Search a patient by their code to view details or add records</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-5">
          <Label className="text-xs font-medium text-muted-foreground">Patient Code</Label>
          <div className="mt-1.5 flex gap-3">
            <Input
              placeholder="e.g. A1B2C3D4"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && searchPatient()}
              className="font-mono tracking-wider"
            />
            <Button onClick={searchPatient} disabled={isSearching} className="gap-2">
              <Search className="h-4 w-4" />
              {isSearching ? "..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient found */}
      {patient && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Patient badge */}
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{patient.full_name || "Unknown"}</p>
              <p className="text-xs text-muted-foreground font-mono">Code: {patient.patient_code}</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Patient Details</TabsTrigger>
              <TabsTrigger value="add-record">Add Record</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                      <User className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <p className="text-sm font-medium">{patient.full_name || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                      <Droplets className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Blood Type</p>
                        <p className="text-sm font-medium">{patient.blood_type || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date of Birth / Age</p>
                        <p className="text-sm font-medium">{patient.date_of_birth || "N/A"} ({calculateAge(patient.date_of_birth)} yrs)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <div>
                        <p className="text-xs text-muted-foreground">Allergies</p>
                        <p className="text-sm font-medium">{patient.allergies?.length ? patient.allergies.join(", ") : "None"}</p>
                      </div>
                    </div>
                  </div>
                  {patient.phone_number && (
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{patient.phone_number}</p>
                    </div>
                  )}
                  {patient.emergency_contact_name && (
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Emergency Contact</p>
                      <p className="text-sm font-medium">{patient.emergency_contact_name} — {patient.emergency_contact_phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add Record Tab */}
            <TabsContent value="add-record">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="h-4 w-4 text-primary" />
                    New Medical Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Category *</Label>
                      <Select value={newRecord.category} onValueChange={(v) => setNewRecord((p) => ({ ...p, category: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={newRecord.record_date} onChange={(e) => setNewRecord((p) => ({ ...p, record_date: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label>Title *</Label>
                    <Input value={newRecord.title} onChange={(e) => setNewRecord((p) => ({ ...p, title: e.target.value }))} className="mt-1" placeholder="e.g. Blood Test Report" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Hospital / Clinic</Label>
                    <Input value={newRecord.hospital_name} onChange={(e) => setNewRecord((p) => ({ ...p, hospital_name: e.target.value }))} className="mt-1" placeholder="e.g. City General Hospital" />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={newRecord.description} onChange={(e) => setNewRecord((p) => ({ ...p, description: e.target.value }))} className="mt-1" rows={2} placeholder="Optional notes..." />
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label className="flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Attach Files</Label>
                    <div className="mt-2 rounded-lg border border-dashed border-border bg-secondary/30 p-4">
                      <label className="flex cursor-pointer flex-col items-center gap-1.5">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Upload reports, prescriptions</span>
                        <span className="text-xs text-muted-foreground">PDF, Images, Docs (max 5)</span>
                        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                    {files.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {files.map((file, i) => (
                          <div key={i} className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="h-3 w-3 shrink-0 text-primary" />
                              <span className="truncate text-sm">{file.name}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)}KB)</span>
                            </div>
                            <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button onClick={handleAddRecord} disabled={isUploading} className="w-full">
                    {isUploading ? "Saving..." : "Save Record"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
};

export default Patients;
