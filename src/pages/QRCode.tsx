import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, FileDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";

interface MedicalRecord {
  id: string;
  category: string;
  title: string;
  description: string | null;
  record_date: string;
}

const categoryLabels: Record<string, string> = {
  consultation: "Consultation",
  diagnosis: "Diagnosis",
  medication: "Medication",
  surgery: "Surgery",
  chronic_condition: "Chronic Condition",
  treatment_plan: "Treatment Plan",
  lab_result: "Lab Result",
  allergy: "Allergy",
  vaccination: "Vaccination",
};

const QRCodePage = () => {
  const { user, profile } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("medical_records")
      .select("id, category, title, description, record_date")
      .eq("patient_id", user.id)
      .order("record_date", { ascending: false })
      .then(({ data }) => setRecords((data as MedicalRecord[]) || []));
  }, [user]);

  // Build a compact text summary for the QR code
  const buildQRText = () => {
    const lines: string[] = [];
    lines.push("═══ MEDILOCKER SUMMARY ═══");
    lines.push("");
    lines.push(`Name: ${profile?.full_name || "N/A"}`);
    if (profile?.date_of_birth) lines.push(`DOB: ${new Date(profile.date_of_birth).toLocaleDateString()}`);
    if (profile?.blood_type) lines.push(`Blood: ${profile.blood_type}`);
    if (profile?.phone_number) lines.push(`Phone: ${profile.phone_number}`);
    if (profile?.allergies?.length) lines.push(`Allergies: ${profile.allergies.join(", ")}`);

    lines.push("");
    lines.push("── Emergency Contact ──");
    lines.push(`Name: ${profile?.emergency_contact_name || "N/A"}`);
    lines.push(`Phone: ${profile?.emergency_contact_phone || "N/A"}`);
    lines.push(`Relation: ${profile?.emergency_contact_relationship || "N/A"}`);

    if (records.length > 0) {
      lines.push("");
      lines.push("── Medical Records ──");
      // QR codes max ~2KB; include up to 10 recent records
      records.slice(0, 10).forEach((r) => {
        const date = new Date(r.record_date).toLocaleDateString();
        const cat = categoryLabels[r.category] || r.category;
        const desc = r.description ? ` - ${r.description.slice(0, 40)}` : "";
        lines.push(`${date} | ${cat}: ${r.title}${desc}`);
      });
      if (records.length > 10) lines.push(`...and ${records.length - 10} more`);
    }

    lines.push("");
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    return lines.join("\n");
  };

  const qrValue = buildQRText();

  const handleDownloadQR = () => {
    const svg = document.querySelector("#patient-qr svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = "medilocker-qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Title
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("MEDILOCKER", pageWidth / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("Digital Health Records Summary", pageWidth / 2, y, { align: "center" });
      doc.setTextColor(0);
      y += 4;
      doc.setDrawColor(0, 200, 170);
      doc.setLineWidth(0.5);
      doc.line(20, y, pageWidth - 20, y);
      y += 10;

      // Patient Info
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Patient Information", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const info = [
        ["Full Name", profile?.full_name || "N/A"],
        ["Date of Birth", profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : "N/A"],
        ["Blood Type", profile?.blood_type || "N/A"],
        ["Phone", profile?.phone_number || "N/A"],
        ["Wallet Address", profile?.wallet_address || "N/A"],
        ["Allergies", profile?.allergies?.length ? profile.allergies.join(", ") : "None reported"],
      ];

      info.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 70, y);
        y += 6;
      });

      y += 6;

      // Emergency Contact
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 50, 50);
      doc.text("⚠ Emergency Contact", 20, y);
      doc.setTextColor(0);
      y += 8;
      doc.setFontSize(10);

      const emergency = [
        ["Name", profile?.emergency_contact_name || "N/A"],
        ["Phone", profile?.emergency_contact_phone || "N/A"],
        ["Relationship", profile?.emergency_contact_relationship || "N/A"],
      ];

      emergency.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 70, y);
        y += 6;
      });

      y += 6;

      // Medical Records
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Medical Records", 20, y);
      y += 8;

      if (records.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No medical records found.", 20, y);
        y += 8;
      } else {
        // Table header
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y - 4, pageWidth - 40, 7, "F");
        doc.text("Date", 22, y);
        doc.text("Category", 50, y);
        doc.text("Title", 90, y);
        doc.text("Description", 140, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        records.forEach((record) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          const date = new Date(record.record_date).toLocaleDateString();
          const cat = categoryLabels[record.category] || record.category;
          const desc = record.description
            ? record.description.length > 30
              ? record.description.slice(0, 30) + "..."
              : record.description
            : "—";

          doc.text(date, 22, y);
          doc.text(cat, 50, y);
          doc.text(record.title.slice(0, 25), 90, y);
          doc.text(desc, 140, y);
          y += 6;
        });
      }

      y += 8;

      // QR Code
      if (y > 220) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("QR Code for Record Access", 20, y);
      y += 6;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(qrValue, 20, y);
      y += 8;

      // Embed QR as image
      const svg = document.querySelector("#patient-qr svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        canvas.width = 220;
        canvas.height = 220;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx?.drawImage(img, 0, 0);
            resolve();
          };
          img.src = "data:image/svg+xml;base64," + btoa(svgData);
        });
        const qrDataUrl = canvas.toDataURL("image/png");
        doc.addImage(qrDataUrl, "PNG", 20, y, 50, 50);
        y += 55;
      }

      // Footer
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Generated by MediLocker on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        pageWidth / 2,
        y,
        { align: "center" }
      );
      doc.text(
        "This document is confidential. Handle with care.",
        pageWidth / 2,
        y + 5,
        { align: "center" }
      );

      doc.save(`MediLocker_Summary_${profile?.full_name?.replace(/\s/g, "_") || "Patient"}.pdf`);
      toast.success("PDF summary downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">
          Your QR Code & Summary
        </h1>
        <p className="text-sm text-muted-foreground">
          Share your QR code or download a full PDF summary with all your medical details
        </p>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="border-border glass w-[400px]">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-lg tracking-wider text-primary">
              {profile?.full_name || "Patient"}
            </CardTitle>
            <CardDescription className="space-y-1">
              <span className="block font-mono text-xs text-primary">Patient Code: {(profile as any)?.patient_code || "N/A"}</span>
              <span className="block">
              {[
                profile?.blood_type && `Blood: ${profile.blood_type}`,
                profile?.allergies?.length && `Allergies: ${profile.allergies.join(", ")}`,
              ]
                .filter(Boolean)
                .join(" • ")}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <div id="patient-qr" className="rounded-2xl bg-white p-6 glow-primary">
              <QRCodeSVG value={qrValue} size={220} level="H" fgColor="#0d1117" bgColor="#ffffff" />
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={handleDownloadQR} className="gap-2">
                <Download className="h-4 w-4" />
                QR Image
              </Button>
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Copy Link
              </Button>
              <Button
                onClick={generatePDF}
                disabled={isGenerating}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {isGenerating ? "Generating..." : "Download PDF Summary"}
              </Button>
            </div>

            {/* Summary preview */}
            <div className="w-full space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                PDF includes:
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>✓ Personal details (name, DOB, blood type)</li>
                <li>✓ Emergency contacts & allergies</li>
                <li>✓ Full medical records ({records.length} entries)</li>
                <li>✓ QR code for digital access</li>
                <li>✓ Generated timestamp</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">
                When scanned, doctors must authenticate before accessing your records.
                Emergency info (blood type, allergies) is shown first.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default QRCodePage;
