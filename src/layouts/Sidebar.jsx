import { useState } from "react";
import {
  MdDashboard,
  MdBarChart,
  MdOutlineSettings,
  MdOutlinePerson,
  MdOutlineLightMode,
  MdOutlineDarkMode,
  MdOutlineKitchen,
} from "react-icons/md";
import nora_logo_white from "../assets/nora_white.png";
import nora_logo_dark from "../assets/nora_dark.png";
import { RxDashboard, RxBarChart } from "react-icons/rx";
import { PiTruck } from "react-icons/pi";
import "./Sidebar.css";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { BsShop } from "react-icons/bs";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: RxDashboard, path: "/app" },
  {
    id: "Finance",
    label: "finance",
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
    label: "iCart Operating",
    icon: MdOutlineKitchen,
    path: "/app/icart",
  },
  {
    id: "library",
    label: "Library",
    icon: MdOutlineKitchen,
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

export default function Sidebar() {
  const { theme, toggle } = useTheme();
  const [active, setActive] = useState("dashboard");
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img
          src={theme === "dark" ? nora_logo_white : nora_logo_dark}
          alt="nora_logo"
          className="sidebar_logo"
        />
      </div>

      {/* Main nav */}
      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          {navItems.map(({ id, label, icon: Icon, path }) => (
            <li key={id}>
              <button
                className={`sidebar-item ${active === id ? "active" : ""}`}
                onClick={() => {
                  setActive(id);
                  navigate(path);
                }}
              >
                <Icon className="sidebar-icon" />
                <span className="sidebar-label">{label}</span>
                {active === id && <span className="sidebar-active-bar" />}
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
                className={`sidebar-item ${active === id ? "active" : ""}`}
                onClick={() => {
                  setActive(id);
                  navigate(path);
                }}
              >
                <Icon className="sidebar-icon" />
                <span className="sidebar-label">{label}</span>
                {active === id && <span className="sidebar-active-bar" />}
              </button>
            </li>
          ))}

          {/* Theme toggle — separate from nav items so it never gets "active" */}
          <li>
            <button className="sidebar-item" onClick={toggle}>
              {theme === "dark" ? (
                <MdOutlineLightMode className="sidebar-icon" />
              ) : (
                <MdOutlineDarkMode className="sidebar-icon" />
              )}
              <span className="sidebar-label">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
