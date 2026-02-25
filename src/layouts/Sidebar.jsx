import { useState } from "react";
import {
  MdDashboard,
  MdBarChart,
  MdOutlineSettings,
  MdOutlinePerson,
  MdOutlineLightMode,
  MdOutlineDarkMode,
  MdOutlineKitchen,
  MdChevronLeft,
  MdMenu,
} from "react-icons/md";
import nora_logo_white from "../assets/nora_white.png";
import nora_logo_dark from "../assets/nora_dark.png";
// import nora_logo_small from "../assets/favicon.png"; // Assuming favicon can be used as small logo
import { RxDashboard, RxBarChart } from "react-icons/rx";
import { PiTruck } from "react-icons/pi";
import "./Sidebar.css";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { BsShop } from "react-icons/bs";

import { LiaFileInvoiceSolid } from "react-icons/lia";
import { LuLibrary } from "react-icons/lu";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: RxDashboard, path: "/app" },
  {
    id: "finance",
    label: "Finance",
    icon: RxBarChart,
    path: "/app/finance",
  },
  {
    id: "suppliers",
    label: "Suppliers",
    icon: PiTruck,
    path: "/app/suppliers",
  },
  {
    id: "vendors",
    label: "Vendors",
    icon: BsShop,
    path: "/app/vendors",
  },
  {
    id: "icart",
    label: "iCarts",
    icon: MdOutlineKitchen,
    path: "/app/icart-home",
  },
  {
    id: "icart",
    label: "iCarts",
    icon: MdOutlineKitchen,
    path: "/app/icart-home",
  },
  {
    id: "library",
    label: "Library",
    icon: LuLibrary,
    path: "/app/library",
  },
];

const bottomItems = [
  {
    id: "settings",
    label: "Settings",
    icon: MdOutlineSettings,
    path: "/app/settings",
  },
  {
    id: "profile",
    label: "Profile",
    icon: MdOutlinePerson,
    path: "/app/profile",
  },
];

export default function Sidebar({ isCollapsed, toggleCollapsed, onCloseMobile }) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const isActive = (path) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Logo & Toggle */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {!isCollapsed ? (
            <img
              src={theme === "dark" ? nora_logo_white : nora_logo_dark}
              alt="nora_logo"
              className="sidebar_logo"
            />
          ) : (
            <div className="sidebar-logo-small">N</div>
          )}
        </div>
        <button className="sidebar-toggle-btn" onClick={toggleCollapsed}>
          {isCollapsed ? <MdMenu size={20} /> : <MdChevronLeft size={20} />}
        </button>
      </div>

      {/* Main nav */}
      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          {navItems.map(({ id, label, icon: Icon, path }) => (
            <li key={id}>
              <button
                className={`sidebar-item ${isActive(path) ? "active" : ""}`}
                onClick={() => handleNav(path)}
                title={isCollapsed ? label : ""}
              >
                <Icon className="sidebar-icon" />
                {!isCollapsed && <span className="sidebar-label">{label}</span>}
                {isActive(path) && <span className="sidebar-active-bar" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom nav */}
      <div className="sidebar-bottom">
        <ul className="sidebar-list">
          {bottomItems.map(({ id, label, icon: Icon, path }) => (
            <li key={id}>
              <button
                className={`sidebar-item ${isActive(path) ? "active" : ""}`}
                onClick={() => handleNav(path)}
                title={isCollapsed ? label : ""}
              >
                <Icon className="sidebar-icon" />
                {!isCollapsed && <span className="sidebar-label">{label}</span>}
                {isActive(path) && <span className="sidebar-active-bar" />}
              </button>
            </li>
          ))}

          {/* Theme toggle */}
          <li>
            <button className="sidebar-item" onClick={toggle} title={isCollapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : ""}>
              {theme === "dark" ? (
                <MdOutlineLightMode className="sidebar-icon" />
              ) : (
                <MdOutlineDarkMode className="sidebar-icon" />
              )}
              {!isCollapsed && (
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
