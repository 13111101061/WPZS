import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";

const Layout = () => {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
