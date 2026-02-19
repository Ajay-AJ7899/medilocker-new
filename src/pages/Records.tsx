import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, FileText, Calendar, Upload, Trash2, Download, Paperclip } from "lucide-react";
import { motion } from "framer-motion";
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

const categoryColors: Record<string, string> = {
  consultation: "bg-blue-500/20 text-blue-400",
  diagnosis: "bg-red-500/20 text-red-400",
  medication: "bg-green-500/20 text-green-400",
  surgery: "bg-orange-500/20 text-orange-400",
  chronic_condition: "bg-purple-500/20 text-purple-400",
  treatment_plan: "bg-cyan-500/20 text-cyan-400",
  lab_result: "bg-yellow-500/20 text-yellow-400",
  allergy: "bg-pink-500/20 text-pink-400",
  vaccination: "bg-teal-500/20 text-teal-400",
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
}

interface DoctorInfo {
  full_name: string | null;
  phone_number: string | null;
  wallet_address: string;
}

const Records = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [documents, setDocuments] = useState<Record<string, MedicalDocument[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [newRecord, setNewRecord] = useState({
    category: "",
    title: "",
    description: "",
    record_date: new Date().toISOString().split("T")[0],
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchRecords = async () => {
    if (!user) return;
    setIsLoading(true);
    let query = supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", user.id)
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

      // Fetch documents for all records
      if (recs.length > 0) {
        const recordIds = recs.map(r => r.id);
        const { data: docs, error: docsError } = await supabase
          .from("medical_documents")
          .select("*")
          .in("record_id", recordIds);
        
        if (docsError) {
          console.error("Error fetching documents:", docsError);
        } else if (docs) {
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

  const handleAdd = async () => {
    if (!user || !newRecord.category || !newRecord.title) {
      toast.error("Please fill in the required fields.");
      return;
    }

    try {
      // Insert record
      const { data: record, error } = await supabase
        .from("medical_records")
        .insert({
          patient_id: user.id,
          added_by: user.id,
          category: newRecord.category as any,
          title: newRecord.title,
          description: newRecord.description || null,
          record_date: newRecord.record_date,
        })
        .select()
        .single();

      if (error) throw error;

      // Upload file if present
      if (file && record) {
        const filePath = `${user.id}/${record.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("medical-documents")
          .upload(filePath, file);

        if (uploadError) {
          console.error(uploadError);
          toast.error("Record saved but file upload failed.");
        } else {
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
      setNewRecord({
        category: "",
        title: "",
        description: "",
        record_date: new Date().toISOString().split("T")[0],
      });
      setFile(null);
      fetchRecords();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add record.");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("medical_records").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete record.");
    } else {
      toast.success("Record deleted.");
      fetchRecords();
    }
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
    doc.text("MediLocker - Medical Report", 20, 25);

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
    doc.text(`Generated on ${new Date().toLocaleString()} via MediLocker`, 20, 285);

    doc.save(`${record.title.replace(/\s+/g, "_")}_report.pdf`);
    toast.success("Report downloaded!");
  };

  const handleFileDownload = async (doc: MedicalDocument) => {
    try {
      // The file_url stored may be a public URL; try to download via storage API using signed URL
      // Extract the path from the URL
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

      // Fallback: open the stored URL directly
      window.open(doc.file_url, "_blank");
      toast.success(`Opening ${doc.file_name}`);
    } catch {
      toast.error("Failed to download file.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">
            Medical Records
          </h1>
          <p className="text-sm text-muted-foreground">Your complete medical history</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
              <Plus className="h-4 w-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider text-primary">
                Add Medical Record
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category *</Label>
                <Select value={newRecord.category} onValueChange={(v) => setNewRecord((p) => ({ ...p, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  value={newRecord.title}
                  onChange={(e) => setNewRecord((p) => ({ ...p, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newRecord.description}
                  onChange={(e) => setNewRecord((p) => ({ ...p, description: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newRecord.record_date}
                  onChange={(e) => setNewRecord((p) => ({ ...p, record_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Attach Document (optional)</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAdd} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Save Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-primary text-primary-foreground" : ""}
        >
          All
        </Button>
        {categories.map((c) => (
          <Button
            key={c.value}
            size="sm"
            variant={filter === c.value ? "default" : "outline"}
            onClick={() => setFilter(c.value)}
            className={filter === c.value ? "bg-primary text-primary-foreground" : ""}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {/* Records list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : records.length === 0 ? (
        <Card className="border-border glass">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No records found. Add your first medical record.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border glass group">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{record.title}</h3>
                      <Badge className={categoryColors[record.category] || "bg-muted text-muted-foreground"}>
                        {categories.find((c) => c.value === record.category)?.label || record.category}
                      </Badge>
                    </div>
                    {record.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{record.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(record.record_date).toLocaleDateString()}
                    </div>
                    {/* Attached files */}
                    {documents[record.id] && documents[record.id].length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {documents[record.id].map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => handleFileDownload(doc)}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Paperclip className="h-3 w-3" />
                            {doc.file_name}
                            <Download className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(record)}
                      className="text-muted-foreground hover:text-primary"
                      title="Download Report"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(record.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Records;
