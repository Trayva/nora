import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MdOutlineShield,
  MdChevronLeft,
  MdClose,
  MdOutlineLightMode,
  MdOutlineDarkMode,
} from "react-icons/md";
import { useTheme } from "../../contexts/ThemeContext";
import nora_icon_white from "../../assets/nora_white - icon.png";
import nora_icon_dark from "../../assets/nora_dark - icon.png";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import "./AdminLayout.css";

export default function AdminLayout() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="admin_layout">
      {/* Mobile navbar */}
      <header className="admin_mobile_navbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src={theme === "dark" ? nora_icon_white : nora_icon_dark}
            alt="Nora"
            style={{ width: 26, height: 26, objectFit: "contain" }}
          />
          <span className="admin_badge">
            <MdOutlineShield size={10} /> Admin
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="admin_mobile_action" onClick={toggle}>
            {theme === "dark" ? (
              <MdOutlineLightMode size={20} />
            ) : (
              <MdOutlineDarkMode size={20} />
            )}
          </button>
          <button
            className="admin_mobile_action"
            onClick={() => navigate("/app")}
          >
            <MdChevronLeft size={20} />
          </button>
        </div>
      </header>

      {/* Main — full width, no sidebar */}
      <main className="admin_main">
        <AdminDashboard />
      </main>
    </div>
  );
}
