import { motion } from "framer-motion";
import { Shield, QrCode, Heart, MessageCircle, ArrowRight, Sparkles } from "lucide-react";
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
    gradient: "gradient-primary",
  },
  {
    icon: QrCode,
    title: "QR Access",
    desc: "Instant medical history sharing via secure QR scan.",
    gradient: "gradient-accent",
  },
  {
    icon: Heart,
    title: "Health Score",
    desc: "AI-powered health score tracking and recommendations.",
    gradient: "gradient-warm",
  },
  {
    icon: MessageCircle,
    title: "AI Assistant",
    desc: "Personalized health chatbot with your medical context.",
    gradient: "gradient-sunny",
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
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[hsl(340,82%,52%)]/8 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-border/40 bg-card/70 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-sm">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              MediLocker
            </span>
          </div>
          <Button
            onClick={() => navigate("/login")}
            className="gap-2 btn-gradient rounded-xl shadow-md"
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
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              Welcome to MediLocker
            </div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              <span className="text-foreground">COMPASSIONATE CARE FOR A </span>
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">HEALTHIER TOMORROW</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              A decentralized digital health records platform. One QR code holds
              your entire medical history — consultations, medications, lab
              results, and more. Secured by blockchain authentication.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center md:justify-start justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="gap-2 btn-gradient rounded-xl px-8 shadow-lg text-base"
              >
                GET STARTED
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="gap-2 rounded-xl px-8 border-primary/30 text-primary hover:bg-primary/5"
              >
                Learn More
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
              className="h-56 w-auto object-contain sm:h-64 md:h-[360px] lg:h-[450px] xl:h-[500px] drop-shadow-2xl"
            />
          </motion.div>
        </section>

        {/* Features */}
        <section className="mt-20 px-8 pb-20">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Everything you need, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">in one place</span>
              </h2>
              <p className="mt-2 text-muted-foreground">Powerful features built for modern healthcare</p>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.12, duration: 0.5 }}
                  className="rounded-2xl border border-border/50 bg-card p-6 card-glow card-hover group"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${f.gradient} shadow-sm transition-transform group-hover:scale-110`}>
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Landing;
