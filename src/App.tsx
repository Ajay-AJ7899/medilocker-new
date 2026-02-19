import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Records from "./pages/Records";
import Insurance from "./pages/Insurance";
import Patients from "./pages/Patients";
import RoleGuard from "./components/RoleGuard";
import QRCodePage from "./pages/QRCode";
import HealthScore from "./pages/HealthScore";
import Chatbot from "./pages/Chatbot";
import ScanQR from "./pages/ScanQR";
import PatientView from "./pages/PatientView";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoles from "./pages/admin/AdminRoles";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/patient/:patientId" element={<PatientView />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/records" element={<RoleGuard allowedRoles={["patient", "admin"]}><Records /></RoleGuard>} />
              <Route path="/insurance" element={<RoleGuard allowedRoles={["patient", "admin"]}><Insurance /></RoleGuard>} />
              <Route path="/patients" element={<RoleGuard allowedRoles={["doctor"]}><Patients /></RoleGuard>} />
              <Route path="/qr-code" element={<RoleGuard allowedRoles={["patient"]}><QRCodePage /></RoleGuard>} />
              <Route path="/health-score" element={<RoleGuard allowedRoles={["patient"]}><HealthScore /></RoleGuard>} />
              <Route path="/chatbot" element={<RoleGuard allowedRoles={["patient"]}><Chatbot /></RoleGuard>} />
              <Route path="/scan" element={<ScanQR />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/roles" element={<AdminRoles />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
