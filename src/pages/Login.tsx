import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Wallet, Loader2, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

const Login = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState("patient");
  const navigate = useNavigate();
  const { setActiveRole } = useAuth();

  const connectWallet = async () => {
    if (!window.ethereum?.isMetaMask) {
      toast.error("MetaMask not detected. Please install MetaMask to continue.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        toast.error("No accounts found. Please connect your MetaMask wallet.");
        return;
      }

      const walletAddress = accounts[0].toLowerCase();

      const { data: challengeData, error: challengeError } = await supabase.functions.invoke(
        "metamask-auth",
        { body: { action: "challenge", walletAddress } }
      );

      if (challengeError || !challengeData?.nonce) {
        toast.error("Failed to get authentication challenge.");
        console.error(challengeError);
        return;
      }

      const message = `Sign this message to authenticate with MediLocker.\n\nNonce: ${challengeData.nonce}`;
      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [message, walletAddress],
      })) as string;

      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        "metamask-auth",
        { body: { action: "verify", walletAddress, signature, nonce: challengeData.nonce, loginAs: activeTab } }
      );

      if (verifyError || !verifyData?.token) {
        toast.error("Authentication failed. Please try again.");
        console.error(verifyError);
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: verifyData.token,
        refresh_token: verifyData.refresh_token,
      });

      if (sessionError) {
        toast.error("Failed to establish session.");
        console.error(sessionError);
        return;
      }

      setActiveRole(activeTab as "patient" | "doctor");
      toast.success(`Connected as ${activeTab === "doctor" ? "Doctor" : "Patient"}!`);

      if (verifyData.is_new_user || !verifyData.onboarding_complete) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message?.includes("User rejected")) {
        toast.error("Connection cancelled by user.");
      } else {
        toast.error("Failed to connect wallet. Please try again.");
        console.error(error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[460px] px-4"
      >
        <Card className="shadow-lg border-border">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              MediLocker
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Connect your wallet to access health records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="patient" className="gap-2 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <User className="h-4 w-4" />
                  Patient
                </TabsTrigger>
                <TabsTrigger value="doctor" className="gap-2 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Stethoscope className="h-4 w-4" />
                  Doctor
                </TabsTrigger>
              </TabsList>
              <TabsContent value="patient" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Access your medical records, health score, insurance, and QR code.
                </p>
              </TabsContent>
              <TabsContent value="doctor" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Dashboard with patient search, add medical records, and upload reports directly to patient files.
                </p>
              </TabsContent>
            </Tabs>

            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full gap-3"
              size="lg"
            >
              {isConnecting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Wallet className="h-5 w-5" />
              )}
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </Button>

            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-primary">🔒 Secure Authentication</span>
                <br />
                We use your MetaMask wallet to verify your identity. No passwords
                are stored — your private key never leaves your wallet.
              </p>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Don't have MetaMask?{" "}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Download here
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
