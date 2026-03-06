import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScanLine, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ScanQR = () => {
  const [patientUrl, setPatientUrl] = useState("");
  const navigate = useNavigate();

  const handleGo = () => {
    const match = patientUrl.match(/\/patient\/([a-f0-9-]+)/i);
    if (match) {
      navigate(`/patient/${match[1]}`);
    } else if (patientUrl.match(/^[a-f0-9-]+$/i)) {
      navigate(`/patient/${patientUrl}`);
    } else {
      toast.error("Invalid patient URL or ID. Please scan a valid Arogya QR code.");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">
          Scan Patient QR
        </h1>
        <p className="text-sm text-muted-foreground">
          Scan a patient's QR code or enter their ID to view records
        </p>
      </div>

      <Card className="w-full max-w-md border-border/30 glass neon-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary animate-glow-pulse">
            <ScanLine className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display tracking-wider bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Patient Lookup
          </CardTitle>
          <CardDescription>
            Use your device's camera to scan a QR code, or paste the patient link below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-12 text-center">
            <ScanLine className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Point your camera at an Arogya QR code
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              (Camera scanning coming soon — use manual entry below)
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              value={patientUrl}
              onChange={(e) => setPatientUrl(e.target.value)}
              placeholder="Paste patient URL or ID"
              className="flex-1"
            />
            <Button
              onClick={handleGo}
              disabled={!patientUrl.trim()}
              className="gap-1 btn-gradient"
            >
              Go
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanQR;
