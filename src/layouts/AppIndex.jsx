import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import VerificationBanner from "./VerificationBanner";
import { useTheme } from "../contexts/ThemeContext";
import { MdOutlineSettings } from "react-icons/md";
import nora_logo_white from "../assets/nora_white.png";
import nora_logo_dark from "../assets/nora_dark.png";
import "./AppIndex.css";
import NotificationBell from "../components/Notifications/NotificationBell";

export default function AppIndex() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="app-layout">
      {/* Mobile top navbar */}
      <header className="mobile-navbar">
        <button
          className="mobile-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
        <img
          src={theme === "dark" ? nora_logo_white : nora_logo_dark}
          alt="Nora"
          className="mobile-navbar-logo"
        />
        <NotificationBell />
      </header>

      {/* Backdrop (mobile only) */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — passes mobileOpen + close handler */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main className="app-main">
        <VerificationBanner />
        <Outlet />
      </main>
    </div>
  );
}