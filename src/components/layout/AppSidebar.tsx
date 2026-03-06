import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, QrCode, Heart, MessageCircle, User, Users,
  ScanLine, LogOut, Shield, Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AppSidebar = () => {
  const { profile, hasRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const patientLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/records", label: "Records", icon: FileText },
    { to: "/my-predictions", label: "Predictions", icon: Heart },
    { to: "/qr-code", label: "My QR Code", icon: QrCode },
    { to: "/chatbot", label: "AI Assistant", icon: MessageCircle },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const doctorLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/predictions", label: "Predictions", icon: Heart },
    { to: "/patients", label: "Patients", icon: Stethoscope },
    { to: "/scan", label: "Scan QR", icon: ScanLine },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const adminLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Manage Users", icon: Users },
    { to: "/admin/roles", label: "Manage Roles", icon: Shield },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const links = hasRole("admin") ? adminLinks : hasRole("doctor") ? doctorLinks : patientLinks;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/30 bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border/30 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary animate-glow-pulse">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold tracking-wider bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-glow">
          AROGYA
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border/30 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-accent">
            <User className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {profile?.full_name || "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.wallet_address
                ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
                : "Not connected"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
