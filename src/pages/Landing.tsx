import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, QrCode, Heart, MessageCircle, ArrowRight, Sparkles, Activity, Zap, Lock, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";

/* ── Features data ── */
const features = [
  {
    icon: Lock,
    title: "Blockchain Auth",
    desc: "MetaMask wallet login — your identity, your control.",
    gradient: "from-primary to-[hsl(280,80%,55%)]",
    glow: "hsl(250 85% 65% / 0.25)",
  },
  {
    icon: QrCode,
    title: "QR Access",
    desc: "Instant medical history sharing via secure QR scan.",
    gradient: "from-accent to-[hsl(190,70%,40%)]",
    glow: "hsl(172 80% 45% / 0.25)",
  },
  {
    icon: Brain,
    title: "AI Predictions",
    desc: "ML-powered health risk analysis & imaging diagnostics.",
    gradient: "from-[hsl(340,82%,52%)] to-[hsl(15,90%,55%)]",
    glow: "hsl(340 82% 52% / 0.25)",
  },
  {
    icon: MessageCircle,
    title: "AI Assistant",
    desc: "Personalized health chatbot with your medical context.",
    gradient: "from-[hsl(38,92%,50%)] to-[hsl(25,95%,53%)]",
    glow: "hsl(38 92% 50% / 0.25)",
  },
];

/* ── Floating 3D orb component ── */
const FloatingOrb = ({ className, delay = 0, size = 120, color }: { className?: string; delay?: number; size?: number; color: string }) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none ${className}`}
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle at 30% 30%, ${color}, transparent 70%)`,
      filter: "blur(1px)",
    }}
    animate={{
      y: [0, -20, 0],
      x: [0, 10, 0],
      scale: [1, 1.05, 1],
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

/* ── Stat counter component ── */
const stats = [
  { label: "Records Secured", value: "10K+", icon: Shield },
  { label: "AI Analyses", value: "5K+", icon: Activity },
  { label: "Active Users", value: "2K+", icon: Heart },
  { label: "Uptime", value: "99.9%", icon: Zap },
];

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-background">
      {/* ── Mesh gradient background ── */}
      <div className="pointer-events-none fixed inset-0 gradient-mesh opacity-80" />
      <div className="pointer-events-none fixed inset-0 pattern-grid opacity-30" />

      {/* ── Morphing blob decorations ── */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] bg-primary/10 animate-morph blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] top-[20%] h-[400px] w-[400px] bg-accent/8 animate-morph blur-3xl" style={{ animationDelay: "2s" }} />
      <div className="pointer-events-none absolute bottom-[-10%] left-[30%] h-[350px] w-[350px] bg-[hsl(340,82%,52%)]/6 animate-morph blur-3xl" style={{ animationDelay: "4s" }} />

      {/* ── Floating orbs (3D-like elements) ── */}
      <FloatingOrb className="top-[15%] left-[10%] opacity-60" size={80} color="hsl(250 85% 65% / 0.3)" delay={0} />
      <FloatingOrb className="top-[60%] right-[8%] opacity-40" size={60} color="hsl(172 80% 45% / 0.25)" delay={2} />
      <FloatingOrb className="top-[35%] right-[25%] opacity-30" size={40} color="hsl(340 82% 52% / 0.2)" delay={4} />
      <FloatingOrb className="bottom-[20%] left-[15%] opacity-50" size={100} color="hsl(38 92% 50% / 0.15)" delay={1} />

      {/* ── Orbiting ring ── */}
      <div className="pointer-events-none absolute top-[10%] right-[5%] h-[300px] w-[300px]">
        <div className="relative h-full w-full animate-spin-slow">
          <div className="absolute top-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary/50 blur-[2px]" />
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent/40 blur-[1px]" />
        </div>
      </div>

      <div className="relative z-10">
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 glass md:px-12"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg animate-glow-pulse">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse-ring" />
            </div>
            <span className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-primary via-[hsl(280,80%,60%)] to-accent bg-clip-text text-transparent">
              Arogya
            </span>
          </div>
          <Button
            onClick={() => navigate("/login")}
            className="gap-2 btn-gradient rounded-xl shadow-lg hover:shadow-[0_0_30px_hsl(250_85%_65%/0.4)] transition-shadow"
          >
            Connect Wallet
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.header>

        {/* ── Hero Section ── */}
        <motion.section
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center md:px-16"
        >
          {/* Pulsing ring behind hero */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="h-[400px] w-[400px] rounded-full border border-primary/10 animate-pulse-ring" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full glass-card px-5 py-2 text-sm font-medium text-primary mb-8"
            >
              <Sparkles className="h-4 w-4 animate-pulse-glow" />
              <span>Next-gen Health Platform</span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            </motion.div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="block text-foreground"
              >
                Your Health Data,
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="block bg-gradient-to-r from-primary via-[hsl(280,80%,60%)] to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]"
              >
                Reimagined
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed md:text-xl"
            >
              A decentralized platform that stores your entire medical history —
              consultations, scans, lab results — secured by blockchain, analyzed by AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center"
            >
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="group gap-2 btn-gradient rounded-2xl px-10 py-6 text-base shadow-lg hover:shadow-[0_0_40px_hsl(250_85%_65%/0.5)] transition-all"
              >
                GET STARTED
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate("/login")}
                className="gap-2 rounded-2xl px-10 py-6 border border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all"
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>

          {/* ── 3D DNA-like helix decoration ── */}
          <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl perspective-1000">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="relative h-32 preserve-3d"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 h-2 rounded-full bg-gradient-to-r from-primary/40 to-accent/40"
                  style={{
                    width: 60 + Math.sin(i * 0.8) * 30,
                    top: i * 14,
                    transform: `translateX(-50%) rotateY(${i * 22}deg) translateZ(${Math.sin(i) * 20}px)`,
                  }}
                  animate={{ rotateY: [i * 22, i * 22 + 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ── Stats Bar ── */}
        <section className="relative py-12 px-6">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7 }}
              className="glass-strong rounded-3xl p-8"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                    className="flex flex-col items-center gap-2 text-center"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-bold text-foreground md:text-3xl">{s.value}</span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="relative py-20 px-6">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                Powerful <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Features</span>
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">Built for next-generation healthcare</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative"
                >
                  {/* Glow behind card on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                    style={{ background: f.glow }}
                  />
                  <div className="relative glass-card rounded-2xl p-6 h-full transition-all duration-300 group-hover:border-primary/30">
                    <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <f.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Learn more <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="relative py-20 px-6">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7 }}
              className="relative glass-strong rounded-3xl p-12 text-center overflow-hidden"
            >
              {/* Animated border gradient */}
              <div className="absolute inset-0 rounded-3xl p-[1px] pointer-events-none overflow-hidden">
                <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,hsl(250_85%_65%/0.3),hsl(172_80%_45%/0.3),hsl(340_82%_52%/0.3),hsl(250_85%_65%/0.3))] animate-spin-slow" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg mb-6 animate-float">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl mb-4">
                  Ready to take control of your health?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  Join thousands of users securing their medical records on the blockchain.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="gap-2 btn-gradient rounded-2xl px-10 py-6 text-base shadow-lg hover:shadow-[0_0_40px_hsl(250_85%_65%/0.5)] transition-all"
                >
                  Get Started Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border/20 py-8 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 <span className="text-primary font-medium">Arogya</span>. Decentralized health records platform.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
