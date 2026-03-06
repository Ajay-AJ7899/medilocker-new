import { Outlet } from "react-router-dom";
import TopNavbar from "./TopNavbar";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background pattern-dots">
      <div className="pointer-events-none fixed inset-0 gradient-bg" />
      <TopNavbar />
      <main className="relative flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
