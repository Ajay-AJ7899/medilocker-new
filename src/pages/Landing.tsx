import { motion } from "framer-motion";
import { Shield, QrCode, Heart, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import doctorHero from "@/assets/doctor-hero.png";

const features = [
  {
    icon: Shield,
    title: "Blockchain Auth",
    desc: "MetaMask wallet login — your identity, your control.",
  },
  {
    icon: QrCode,
    title: "QR Access",
    desc: "Instant medical history sharing via secure QR scan.",
  },
  {
    icon: Heart,
    title: "Health Score",
    desc: "AI-powered health score tracking and recommendations.",
  },
  {
    icon: MessageCircle,
    title: "AI Assistant",
    desc: "Personalized health chatbot with your medical context.",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-wide text-primary">
              MediLocker
            </span>
          </div>
          <Button
            onClick={() => navigate("/login")}
            className="gap-2"
          >
            Connect Wallet
            <ArrowRight className="h-4 w-4" />
          </Button>
        </header>

        {/* Hero */}
        <section className="relative flex min-h-[80vh] flex-col-reverse items-center overflow-hidden px-8 pt-12 md:flex-row md:items-center md:justify-between md:pt-0 md:px-16 lg:px-24">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10 flex-1 text-center md:text-left"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Welcome to MediLocker
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              <span className="text-foreground">COMPASSIONATE CARE FOR A </span>
              <span className="text-primary">HEALTHIER TOMORROW</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              A decentralized digital health records platform. One QR code holds
              your entire medical history — consultations, medications, lab
              results, and more. Secured by blockchain authentication.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="gap-2"
              >
                GET STARTED
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-8 flex-shrink-0 md:mb-0 md:ml-8"
          >
            <img
              src={doctorHero}
              alt="Doctor"
              className="h-56 w-auto object-contain sm:h-64 md:h-[360px] lg:h-[450px] xl:h-[500px]"
            />
          </motion.div>
        </section>

        {/* Features */}
        <section className="mt-32 px-8 pb-20">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Landing;
