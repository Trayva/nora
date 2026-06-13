import { useState, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import VerificationBanner from "./VerificationBanner";
import { useTheme } from "../contexts/ThemeContext";
import {
  MdOutlineLightMode, MdOutlineDarkMode, MdExpandMore,
  MdOutlineKitchen, MdOutlineBarChart, MdOutlinePerson,
  MdMoreHoriz, MdOutlineShoppingCart, MdStorefront,
} from "react-icons/md";
import nora_logo_white from "../assets/nora_white.png";
import nora_logo_dark from "../assets/nora_dark.png";
import "./AppIndex.css";
import NotificationBell from "../components/Notifications/NotificationBell";
import SmartSupport from "../components/SmartSupport";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/StateContext";
import { getPrimaryRole } from "../utils/AuthHelpers";
import WalkInTutorial, { shouldShowTour, resetTour } from "../components/WalkInTutorial";

// ── helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}
function nameHue(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

/** Derive a human-readable section label from the current path */
function pathLabel(pathname) {
  const segments = pathname.replace(/^\/app\/?/, "").split("/").filter(Boolean);
  if (!segments.length) return { section: "Dashboard", sub: null };
  const labels = {
    "kiosk-home": "Kiosks", finance: "Finance", business: "My Business",
    supplier: "Supplier", operator: "Operator", aggregator: "Aggregator",
    admin: "Admin", settings: "Account", profile: "Profile",
  };
  const section = labels[segments[0]] || segments[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const sub = segments[1] ? segments[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
  return { section, sub };
}

/** Greeting based on time of day */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** Build mobile tab items from user role — always 5 items with "More" last */
function getMobileTabs(role) {
  const base = [
    { id: "finance", label: "Finance", icon: MdOutlineBarChart, path: "/app/finance" },
    { id: "kiosk", label: "Kiosks", icon: MdOutlineKitchen, path: "/app/kiosk-home" },
    { id: "profile", label: "Profile", icon: MdOutlinePerson, path: "/app/profile" },
  ];

  // Insert a role-based tab between kiosk and profile
  const roleTab =
    role === "VENDOR" ? { id: "business", label: "Business", icon: MdStorefront, path: "/app/business" } :
      role === "OPERATOR" ? { id: "operator", label: "Operator", icon: MdOutlineShoppingCart, path: "/app/operator" } :
        role === "SUPPLIER" ? { id: "supplier", label: "Supplier", icon: MdOutlineShoppingCart, path: "/app/supplier" } :
          null;

  const tabs = roleTab
    ? [base[0], base[1], roleTab, base[2]]
    : [base[0], base[1], base[2]];

  // Always cap at 4 + More
  return [...tabs.slice(0, 4), { id: "more", label: "More", icon: MdMoreHoriz, path: null }];
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AppIndex() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { states, selectedState, changeState } = useAppState();

  // Close sidebar on route change (mobile)
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Auto-show tour for new users (after layout is mounted)
  useEffect(() => {
    if (shouldShowTour()) {
      const t = setTimeout(() => setTourOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleStartTour = () => {
    resetTour();
    setTourOpen(true);
  };

  const { section, sub } = useMemo(() => pathLabel(location.pathname), [location.pathname]);
  const userInitials = getInitials(user?.fullName || user?.email || "?");
  const userHue = nameHue(user?.fullName || user?.email || "");
  const userRole = getPrimaryRole(user);
  const firstName = user?.fullName?.split(" ")[0] || user?.email || "there";
  const mobileTabs = useMemo(() => getMobileTabs(userRole), [userRole]);

  const isTabActive = (tab) => {
    if (tab.path) return location.pathname === tab.path || location.pathname.startsWith(tab.path + "/");
    return false;
  };

  return (
    <div className="app-layout">

      {/* ════════════════════════════════════════════════════════
          DESKTOP TOP HEADER
          ════════════════════════════════════════════════════════ */}
      {/* <header className="desktop-header" id="app-desktop-header">
        <div className="desktop-header-left">
          <span className="desktop-header-breadcrumb">{section}</span>
          {sub && (
            <>
              <span className="desktop-header-sep">/</span>
              <span className="desktop-header-sub">{sub}</span>
            </>
          )}
        </div>

        <div className="desktop-header-right">
          <button
            id="header-theme-toggle"
            className="desktop-header-icon-btn"
            onClick={toggle}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? <MdOutlineLightMode size={18} /> : <MdOutlineDarkMode size={18} />}
          </button>
          <NotificationBell className="desktop-header-icon-btn" />
          {user && (
            <button
              id="header-account-btn"
              className="desktop-header-account-btn"
              onClick={() => navigate("/app/profile")}
              title="Profile"
            >
              <span
                className="desktop-header-avatar"
                style={{ background: `hsl(${userHue}, 60%, 48%)` }}
              >
                {userInitials}
              </span>
              <span className="desktop-header-account-name">
                {user.fullName?.split(" ")[0] || user.email}
              </span>
              <MdExpandMore size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </button>
          )}
        </div>
      </header> */}

      {/* ════════════════════════════════════════════════════════
          MOBILE TOP NAVBAR — upgraded design
          ════════════════════════════════════════════════════════ */}
      <header className="mobile-navbar" id="mobile-top-navbar">
        {/* Left: Logo + business name pill */}
        <div className="mobile-navbar-brand">
          <div style={{ width: "100%", border: "none" }} className="mobile-navbar-logo-wrap">
            <img
              src={theme === "dark" ? nora_logo_white : nora_logo_dark}
              alt="Nora"
              className="mobile-navbar-logo"
            />
          </div>
          {/* {selectedState?.name && (
            <div className="mobile-navbar-location">
              <span className="mobile-navbar-biz-name">{selectedState.name}</span>
              <MdExpandMore size={14} style={{ color: "var(--text-muted)" }} />
            </div>
          )} */}
        </div>

        {/* Right: theme + bell */}
        <div className="mobile-navbar-actions">
          <button
            id="mobile-theme-toggle"
            className="mobile-nav-action"
            onClick={toggle}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {theme === "dark" ? <MdOutlineLightMode size={18} /> : <MdOutlineDarkMode size={18} />}
          </button>
          <NotificationBell className="mobile-nav-action" />
        </div>
      </header>

      {/* ── Body row: sidebar + main ── */}
      <div className="app-body">
        {/* Backdrop (mobile only) */}
        {mobileOpen && (
          <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} onStartTour={handleStartTour} />

        {/* Main content */}
        <main className="app-main">
          <header className="desktop-header" id="app-desktop-header">
            <div className="desktop-header-left">
              <span className="desktop-header-breadcrumb">{section}</span>
              {sub && (
                <>
                  <span className="desktop-header-sep">/</span>
                  <span className="desktop-header-sub">{sub}</span>
                </>
              )}
            </div>

            <div className="desktop-header-right">
              <select
                className="desktop-header-account-btn"
                // className="sidebar_state_select"
                value={selectedState?.id || ""}
                onChange={(e) => {
                  const found = states.find((s) => s.id === e.target.value);
                  if (found) changeState(found);
                }}
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                id="header-theme-toggle"
                className="desktop-header-icon-btn"
                onClick={toggle}
                title={theme === "dark" ? "Light Mode" : "Dark Mode"}
              >
                {theme === "dark" ? <MdOutlineLightMode size={18} /> : <MdOutlineDarkMode size={18} />}
              </button>
              <NotificationBell className="desktop-header-icon-btn" />


              {/* {user && (
                <button
                  id="header-account-btn"
                  className="desktop-header-account-btn"
                  onClick={() => navigate("/app/profile")}
                  title="Profile"
                >
                  <span
                    className="desktop-header-avatar"
                    style={{ background: `hsl(${userHue}, 60%, 48%)` }}
                  >
                    {userInitials}
                  </span>
                  <span className="desktop-header-account-name">
                    {user.fullName?.split(" ")[0] || user.email}
                  </span>
                  <MdExpandMore size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                </button>
              )} */}
            </div>
          </header>
          <VerificationBanner />
          <Outlet />
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════
          MOBILE BOTTOM TAB BAR
          ════════════════════════════════════════════════════════ */}
      <nav className="mobile-tab-bar" id="mobile-tab-bar" aria-label="Main navigation">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(tab);
          const isMore = tab.id === "more";

          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              className={`mobile-tab-item ${active ? "mobile-tab-item--active" : ""} ${isMore && mobileOpen ? "mobile-tab-item--active" : ""}`}
              onClick={() => {
                if (isMore) {
                  setMobileOpen((o) => !o);
                } else {
                  navigate(tab.path);
                }
              }}
              aria-label={tab.label}
            >
              <span className="mobile-tab-icon-wrap">
                <Icon className="mobile-tab-icon" />
                {(active || (isMore && mobileOpen)) && (
                  <span className="mobile-tab-active-dot" />
                )}
              </span>
              <span className="mobile-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* AI Assistant FAB */}
      <SmartSupport />

      {/* Walk-in tutorial overlay */}
      <WalkInTutorial
        userRole={getPrimaryRole(user)}
        show={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  );
}