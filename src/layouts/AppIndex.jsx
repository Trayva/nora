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
import OnlineSupportWidget from "../components/OnlineSupportWidget";
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
    "kiosk-home": "Kitchens", finance: "Finance", business: "My Business",
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
    { id: "kiosk", label: "Kitchens", icon: MdOutlineKitchen, path: "/app/kiosk-home" },
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
// ── Default State Resolution Helpers ──────────────────────────────────────────
function cleanStr(val) {
  return (val || "")
    .toLowerCase()
    .replace(/state/gi, "")
    .replace(/emirate/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function matchCountry(sCountry, targetCountry) {
  const c1 = cleanStr(sCountry);
  const c2 = cleanStr(targetCountry);
  if (!c1 || !c2) return false;
  if (c1 === c2 || c1.includes(c2) || c2.includes(c1)) return true;
  if ((c2 === "uae" || c2 === "ae") && c1.includes("emirates")) return true;
  if ((c1 === "uae" || c1 === "ae") && c2.includes("emirates")) return true;
  if (c2 === "ng" && c1.includes("nigeria")) return true;
  return false;
}

function findStateByLocation(states, loc) {
  if (!states?.length || !loc) return null;

  const cCity = cleanStr(loc.city);
  const cState = cleanStr(loc.stateName);

  // 1a. Try matching state name directly with detected state name
  if (cState) {
    const match = states.find((s) => {
      const sName = cleanStr(s.name);
      return sName && (sName === cState || sName.includes(cState) || cState.includes(sName));
    });
    if (match) return match;
  }

  // 1b. Try matching state name directly with detected city
  if (cCity) {
    const match = states.find((s) => {
      const sName = cleanStr(s.name);
      return sName && (sName === cCity || sName.includes(cCity) || cCity.includes(sName));
    });
    if (match) return match;
  }

  // 1c. Select first state available in the country
  if (loc.country) {
    const match = states.find((s) => matchCountry(s.country, loc.country));
    if (match) return match;
  }

  return null;
}

function findStateByUserProfile(states, user) {
  if (!states?.length || !user) return null;

  const userCity = cleanStr(user.city);
  const userCountry = user.country || user.Vendor?.origin || user.address;

  // Check user city if it matches a state
  if (userCity) {
    const match = states.find((s) => {
      const sName = cleanStr(s.name);
      return sName && (sName === userCity || sName.includes(userCity) || userCity.includes(sName));
    });
    if (match) return match;
  }

  // Select first state from user's country
  if (userCountry) {
    const match = states.find((s) => matchCountry(s.country, userCountry));
    if (match) return match;
  }

  return null;
}

function findDefaultDubai(states) {
  if (!states?.length) return null;
  return (
    states.find((s) => cleanStr(s.name).includes("dubai")) ||
    states.find((s) => matchCountry(s.country, "United Arab Emirates")) ||
    states[0]
  );
}

async function detectUserLocation() {
  // 1. Browser Geolocation (with 3.5s timeout)
  const coords = await new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const timeoutId = setTimeout(() => resolve(null), 3500);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {
        clearTimeout(timeoutId);
        resolve(null);
      },
      { timeout: 3500, maximumAge: 600000 }
    );
  });

  if (coords) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const info = {
          city: addr.city || addr.town || addr.village || addr.municipality || addr.county || "",
          stateName: addr.state || "",
          country: addr.country || "",
        };
        if (info.city || info.stateName || info.country) {
          return info;
        }
      }
    } catch {
      // Fall through to IP lookup
    }
  }

  // 2. IP lookup fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return {
        city: data.city || "",
        stateName: data.region || "",
        country: data.country_name || "",
      };
    }
  } catch {
    // Both failed
  }

  return null;
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

  // Default state selection when states are loaded:
  // 1. User current location (city -> matching state, or first state in country)
  // 2. User profile country -> first state in country
  // 3. Fallback to default Dubai
  useEffect(() => {
    if (!states || states.length === 0) return;

    // If user has manually selected a state, respect their choice
    if (localStorage.getItem("nora-state-manual") === "true") {
      const saved = localStorage.getItem("nora-state");
      const found = states.find((s) => s.id === saved);
      if (found && selectedState?.id !== found.id) {
        changeState(found);
      }
      return;
    }

    let isMounted = true;

    async function applyDefaultState() {
      // 1. Try to get user current location
      const loc = await detectUserLocation();
      if (!isMounted) return;

      if (loc) {
        const locState = findStateByLocation(states, loc);
        if (locState) {
          changeState(locState);
          return;
        }
      }

      // 2. Get country for user profile and select first state from their country
      const profileState = findStateByUserProfile(states, user);
      if (!isMounted) return;

      if (profileState) {
        changeState(profileState);
        return;
      }

      // 3. Or select default Dubai
      const dubaiState = findDefaultDubai(states);
      if (dubaiState) {
        changeState(dubaiState);
      }
    }

    applyDefaultState();

    return () => {
      isMounted = false;
    };
  }, [states, user]);

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
                  if (found) changeState(found, true);
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

      {/* Online Support Widget FAB */}
      {/* <OnlineSupportWidget /> */}

      {/* Walk-in tutorial overlay */}
      <WalkInTutorial
        userRole={getPrimaryRole(user)}
        show={tourOpen}
        onClose={() => setTourOpen(false)}
      />
    </div>
  );
}