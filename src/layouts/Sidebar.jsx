import { useState, useMemo } from "react";
import {
  MdOutlineSettings,
  MdOutlinePerson,
  MdOutlineLightMode,
  MdOutlineDarkMode,
  MdOutlineKitchen,
  MdChevronLeft,
  MdChevronRight,
  MdOutlineBadge,
  MdLocationOn,
  MdClose,
} from "react-icons/md";
import nora_logo_white from "../assets/nora_white.png";
import nora_icon_white from "../assets/nora_white - icon.png";
import nora_logo_dark from "../assets/nora_dark.png";
import nora_icon_dark from "../assets/nora_dark - icon.png";
import { RxDashboard, RxBarChart } from "react-icons/rx";
import { PiTruck } from "react-icons/pi";
import "./Sidebar.css";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { BsShop } from "react-icons/bs";
import { useAppState } from "../contexts/StateContext";
import { useAuth } from "../contexts/AuthContext";

// All possible nav items
const ALL_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",   icon: RxDashboard,    path: "/app",            roles: ["CUSTOMER"] },
  { id: "finance",   label: "Finance",     icon: RxBarChart,     path: "/app/finance",    roles: ["CUSTOMER"] },
  { id: "supplier",  label: "Supplier",    icon: PiTruck,        path: "/app/supplier",   roles: ["CUSTOMER", "SUPPLIER"] },
  { id: "mybusiness",label: "My Business", icon: BsShop,         path: "/app/business",   roles: ["CUSTOMER"] },
  { id: "icart",     label: "iCarts",      icon: MdOutlineKitchen, path: "/app/icart-home", roles: ["CUSTOMER"] },
  { id: "operator",  label: "Operator",    icon: MdOutlineBadge, path: "/app/operator",   roles: ["OPERATOR", "CUSTOMER"] },
];

const BOTTOM_ITEMS = [
  { id: "settings", label: "Settings", icon: MdOutlineSettings, path: "/app/settings", roles: ["CUSTOMER", "OPERATOR", "SUPPLIER"] },
  { id: "profile",  label: "Profile",  icon: MdOutlinePerson,   path: "/app/profile",  roles: ["CUSTOMER", "OPERATOR", "SUPPLIER"] },
];

// Derive which nav items to show based on user roles + linked IDs
function getVisibleItems(user) {
  if (!user) return [];
  const roles = user.roles || [];

  // OPERATOR only sees Operator + bottom items
  if (roles.includes("OPERATOR") && !roles.includes("CUSTOMER")) {
    return ALL_NAV_ITEMS.filter((item) => item.id === "operator");
  }

  // Pure SUPPLIER (no CUSTOMER role) sees only Supplier
  if (roles.includes("SUPPLIER") && !roles.includes("CUSTOMER")) {
    return ALL_NAV_ITEMS.filter((item) => item.id === "supplier");
  }

  // CUSTOMER — show items they have access to based on linked IDs
  if (roles.includes("CUSTOMER")) {
    return ALL_NAV_ITEMS.filter((item) => {
      // Always show base customer items
      if (["dashboard", "finance", "mybusiness", "icart"].includes(item.id)) return true;
      // Show supplier tab only if they have a supplierId
      if (item.id === "supplier") return !!user.supplierId;
      // Show operator tab only if they have an aggregatorId or operator role
      if (item.id === "operator") return !!user.aggregatorId || roles.includes("OPERATOR");
      return false;
    });
  }

  // Fallback: show everything
  return ALL_NAV_ITEMS;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  const { theme, toggle } = useTheme();
  const { states, selectedState, changeState } = useAppState();
  const { user } = useAuth();
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const navigate = useNavigate();

  const visibleNavItems = useMemo(() => getVisibleItems(user), [user]);

  const handleNav = (id, path) => {
    setActive(id);
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  return (
    <aside
      className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--mobile-open" : ""}`}
    >
      {/* Logo row */}
      <div className="sidebar-logo">
        {collapsed ? (
          <button
            className="sidebar-logo-collapsed-btn"
            onClick={() => { setCollapsed(false); setLogoHovered(false); }}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            title="Expand sidebar"
          >
            <img
              src={theme === "dark" ? nora_icon_white : nora_icon_dark}
              alt="Nora"
              className={`sidebar_logo sidebar_logo--icon ${logoHovered ? "sidebar_logo--hidden" : ""}`}
            />
            <MdChevronRight
              className={`sidebar-icon sidebar-expand-icon ${logoHovered ? "sidebar-expand-icon--visible" : ""}`}
            />
          </button>
        ) : (
          <>
            <img
              src={theme === "dark" ? nora_logo_white : nora_logo_dark}
              alt="Nora"
              className="sidebar_logo"
            />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                className="sidebar-collapse-btn sidebar-collapse-btn--desktop"
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
              >
                <MdChevronLeft className="sidebar-icon" />
              </button>
              <button
                className="sidebar-collapse-btn sidebar-collapse-btn--mobile"
                onClick={onMobileClose}
                title="Close menu"
              >
                <MdClose className="sidebar-icon" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main nav */}
      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          {visibleNavItems.map(({ id, label, icon: Icon, path }) => (
            <li key={id}>
              <button
                className={`sidebar-item ${active === id ? "active" : ""}`}
                onClick={() => handleNav(id, path)}
                title={collapsed ? label : undefined}
              >
                <Icon className="sidebar-icon" />
                {!collapsed && <span className="sidebar-label">{label}</span>}
                {active === id && <span className="sidebar-active-bar" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom nav */}
      <div className="sidebar-bottom">
        <ul className="sidebar-list">
          {BOTTOM_ITEMS.map(({ id, label, icon: Icon, path }) => (
            <li key={id}>
              <button
                className={`sidebar-item ${active === id ? "active" : ""}`}
                onClick={() => handleNav(id, path)}
                title={collapsed ? label : undefined}
              >
                <Icon className="sidebar-icon" />
                {!collapsed && <span className="sidebar-label">{label}</span>}
                {active === id && <span className="sidebar-active-bar" />}
              </button>
            </li>
          ))}

          {/* State selector */}
          <div
            className="sidebar_state_section"
            title={collapsed ? selectedState?.name || "Location" : undefined}
          >
            <MdLocationOn className="sidebar_state_icon" />
            {!collapsed && (
              <span className="sidebar_state_label">
                {selectedState?.name || "Select location"}
              </span>
            )}
            <select
              className="sidebar_state_select"
              value={selectedState?.id || ""}
              onChange={(e) => {
                const found = states.find((s) => s.id === e.target.value);
                if (found) changeState(found);
              }}
            >
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme toggle */}
          <li>
            <button
              className="sidebar-item"
              onClick={toggle}
              title={collapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
            >
              {theme === "dark" ? (
                <MdOutlineLightMode className="sidebar-icon" />
              ) : (
                <MdOutlineDarkMode className="sidebar-icon" />
              )}
              {!collapsed && (
                <span className="sidebar-label">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}