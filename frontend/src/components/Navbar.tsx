import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  Menu,
  X,
  Home,
  Upload,
  BookOpen,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const close = () => setIsOpen(false);

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline">
              PaperThought
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: "/dashboard", label: "Dashboard" },
              { to: "/upload", label: "Unggah" },
              { to: "/references", label: "Referensi" },
              { to: "/settings", label: "Pengaturan" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg transition"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* User section */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-neutral-600">
              {user?.fullName || user?.email}
            </span>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-2 text-neutral-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-neutral-100 rounded-lg"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden border-t border-neutral-200 py-4 space-y-1">
            <Link
              to="/dashboard"
              onClick={close}
              className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg"
            >
              <Home size={18} /> Dashboard
            </Link>
            <Link
              to="/upload"
              onClick={close}
              className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg"
            >
              <Upload size={18} /> Unggah Makalah
            </Link>
            <Link
              to="/references"
              onClick={close}
              className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg"
            >
              <BookOpen size={18} /> Referensi
            </Link>
            <Link
              to="/settings"
              onClick={close}
              className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg"
            >
              <Settings size={18} /> Pengaturan
            </Link>
            <button
              onClick={() => {
                handleLogout();
                close();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut size={18} /> Keluar
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
