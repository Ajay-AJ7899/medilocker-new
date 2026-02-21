import { Outlet } from "react-router-dom";
import TopNavbar from "./TopNavbar";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen flex-col gradient-bg pattern-dots">
      <TopNavbar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
