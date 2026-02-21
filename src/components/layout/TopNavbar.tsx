import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, QrCode, Heart, MessageCircle, User, Users,
  ScanLine, LogOut, Shield, ShieldCheck, Stethoscope, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const TopNavbar = () => {
  const { profile, hasRole, signOut, activeRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const patientLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/records", label: "Records", icon: FileText },
    { to: "/my-predictions", label: "Predictions", icon: Heart },
    { to: "/qr-code", label: "QR Code", icon: QrCode },
    { to: "/chatbot", label: "AI Chat", icon: MessageCircle },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const doctorLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/predictions", label: "Predictions", icon: Heart },
    { to: "/patients", label: "Patients", icon: Stethoscope },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const adminLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/roles", label: "Roles", icon: Shield },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const links = hasRole("admin") ? adminLinks : activeRole === "doctor" ? doctorLinks : patientLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-sm">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-wide bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MediLocker
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "gradient-primary text-primary-foreground shadow-sm glow-primary"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-accent">
              <User className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="max-w-[100px] truncate text-sm font-medium text-foreground">
              {profile?.full_name?.split(" ")[0] || "User"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 text-muted-foreground hover:text-destructive md:flex"
            onClick={async () => { await signOut(); navigate("/"); }}
          >
            <LogOut className="h-4 w-4" />
          </Button>

          {/* Mobile toggle */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-card/95 backdrop-blur-xl p-3 md:hidden">
          <nav className="grid grid-cols-3 gap-2">
            {links.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <button
                  key={to}
                  onClick={() => { navigate(to); setMobileOpen(false); }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition-all",
                    isActive
                      ? "gradient-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-accent">
                <User className="h-3.5 w-3.5 text-accent-foreground" />
              </div>
              <span className="text-sm text-foreground">{profile?.full_name || "User"}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={async () => { await signOut(); navigate("/"); }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
