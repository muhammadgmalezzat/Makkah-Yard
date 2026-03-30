import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

/**
 * Layout Component - Main layout wrapper
 * Combines Sidebar and Header with content area
 */
export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50 flex-col lg:flex-row" dir="rtl">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 bg-white shadow-md rounded-lg p-2 min-h-[44px] w-[44px] flex items-center justify-center"
      >
        ☰
      </button>

      {/* Sidebar */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Header />
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
