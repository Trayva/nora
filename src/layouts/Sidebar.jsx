import { useState, useMemo, useRef, useEffect } from "react";
import {
  MdOutlineSettings, MdOutlinePerson, MdOutlineLightMode, MdOutlineDarkMode,
  MdOutlineKitchen, MdChevronLeft, MdChevronRight, MdOutlineBadge,
  MdLocationOn, MdClose, MdAdminPanelSettings, MdCheck,
  MdPersonAdd, MdExpandMore,
} from "react-icons/md";
import nora_logo_white from "../assets/nora_white.png";
import nora_icon_white from "../assets/nora_white - icon.png";
import nora_logo_dark from "../assets/nora_dark.png";
import nora_icon_dark from "../assets/nora_dark - icon.png";
import { RxBarChart } from "react-icons/rx";
import { PiTruck } from "react-icons/pi";
import { TbGridDots } from "react-icons/tb";
import "./Sidebar.css";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { BsShop } from "react-icons/bs";
import { useAppState } from "../contexts/StateContext";
import { useAuth } from "../contexts/AuthContext";
import { getPrimaryRole } from "../utils/AuthHelpers";

/*
  Nav item visibility rules:
  ─────────────────────────────────────────────────
  ADMIN       → all items
  VENDOR      → Kiosks + My Business
  SUPPLIER    → Kiosks + Supplier
  OPERATOR    → Kiosks + Operator
  AGGREGATOR  → Aggregator + Finance only
  CUSTOMER    → Kiosks only

  Finance, Settings, Profile always visible to all.
  ─────────────────────────────────────────────────
*/

const ALL_NAV_ITEMS = [
  { id: "admin", label: "Admin", icon: MdAdminPanelSettings, path: "/app/admin", forRoles: ["ADMIN"] },
  { id: "finance", label: "Finance", icon: RxBarChart, path: "/app/finance", forRoles: ["ALL"] },
  { id: "kiosk", label: "Kiosks", icon: MdOutlineKitchen, path: "/app/kiosk-home", forRoles: ["ADMIN", "VENDOR", "SUPPLIER", "OPERATOR", "CUSTOMER"] },
  { id: "mybusiness", label: "My Business", icon: BsShop, path: "/app/business", forRoles: ["ADMIN", "VENDOR"] },
  { id: "supplier", label: "Supplier", icon: PiTruck, path: "/app/supplier", forRoles: ["ADMIN", "SUPPLIER"] },
  { id: "operator", label: "Operator", icon: MdOutlineBadge, path: "/app/operator", forRoles: ["ADMIN", "OPERATOR"] },
  { id: "aggregator", label: "Aggregator", icon: TbGridDots, path: "/app/aggregator", forRoles: ["ADMIN", "AGGREGATOR"] },
];

const BOTTOM_ITEMS = [
  // { id: "settings", label: "Settings", icon: MdOutlineSettings, path: "/app/settings" },
  { id: "profile", label: "Profile", icon: MdOutlinePerson, path: "/app/profile" },
];

function getUserNavItems(userRoles = []) {
  return ALL_NAV_ITEMS.filter((item) =>
    item.forRoles.includes("ALL") || userRoles.some((r) => item.forRoles.includes(r))
  );
}

function getVisibleItems(user) {
  if (!user) return [];
  const role = getPrimaryRole(user);
  if (role === "AGGREGATOR") {
    return ALL_NAV_ITEMS.filter((item) => item.id === "aggregator" || item.id === "finance");
  }
  return getUserNavItems(user.roles);
}

// ── Avatar helpers ────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}

function nameHue(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  const { theme, toggle } = useTheme();
  // const { states, selectedState, changeState } = useAppState();
  const { user, savedAccounts, switchAccount, removeAccount } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const accountMenuRef = useRef(null);

  const visibleNavItems = useMemo(() => getVisibleItems(user), [user]);

  const active = useMemo(() => {
    const all = [...ALL_NAV_ITEMS, ...BOTTOM_ITEMS];
    const matched = all
      .filter((item) => location.pathname.startsWith(item.path))
      .sort((a, b) => b.path.length - a.path.length)[0];
    return matched?.id || "";
  }, [location.pathname]);

  const handleNav = (path) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  // Close account menu when clicking outside
  useEffect(() => {
    if (!accountMenuOpen) return;
    const handler = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [accountMenuOpen]);

  // User avatar data
  const userInitials = getInitials(user?.fullName || user?.email || "?");
  const userHue = nameHue(user?.fullName || user?.email || "");
  const userRole = user ? getPrimaryRole(user) : "";

  // Other saved accounts (not the active one)
  const otherAccounts = savedAccounts.filter((a) => a.id !== user?.id);

  const handleSwitchAccount = (account) => {
    switchAccount(account.id);
    setAccountMenuOpen(false);
    // Refresh the page to re-hydrate all contexts
    window.location.href = "/app/kiosk-home";
  };

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--mobile-open" : ""}`}>

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
            <MdChevronRight className={`sidebar-icon sidebar-expand-icon ${logoHovered ? "sidebar-expand-icon--visible" : ""}`} />
          </button>
        ) : (
          <>
            <img src={theme === "dark" ? nora_logo_white : nora_logo_dark} alt="Nora" className="sidebar_logo" />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button className="sidebar-collapse-btn sidebar-collapse-btn--desktop" onClick={() => setCollapsed(true)} title="Collapse sidebar">
                <MdChevronLeft className="sidebar-icon" />
              </button>
              <button className="sidebar-collapse-btn sidebar-collapse-btn--mobile" onClick={onMobileClose} title="Close menu">
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
                onClick={() => handleNav(path)}
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
                onClick={() => handleNav(path)}
                title={collapsed ? label : undefined}
              >
                <Icon className="sidebar-icon" />
                {!collapsed && <span className="sidebar-label">{label}</span>}
                {active === id && <span className="sidebar-active-bar" />}
              </button>
            </li>
          ))}

          {/* State selector */}
          {/* <div className="sidebar_state_section" title={collapsed ? selectedState?.name || "Location" : undefined}>
            <MdLocationOn className="sidebar_state_icon" />
            {!collapsed && (
              <span className="sidebar_state_label">{selectedState?.name || "Select location"}</span>
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
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div> */}

          {/* Theme toggle */}
          <li>
            <button
              className="sidebar-item"
              onClick={toggle}
              title={collapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
            >
              {theme === "dark"
                ? <MdOutlineLightMode className="sidebar-icon" />
                : <MdOutlineDarkMode className="sidebar-icon" />
              }
              {!collapsed && (
                <span className="sidebar-label">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* ── User avatar chip + account switcher ── */}
      {user && (
        <div className="sidebar-user-section" ref={accountMenuRef}>
          {/* Account switcher dropdown */}
          {accountMenuOpen && !collapsed && (
            <div className="sidebar-account-dropdown">
              <span className="sidebar-dropdown-label">Accounts</span>

              {/* Active account */}
              <div className="sidebar-account-item sidebar-account-item--active">
                <span
                  className="sidebar-account-item-avatar"
                  style={{ background: `hsl(${userHue}, 60%, 48%)` }}
                >
                  {userInitials}
                </span>
                <span className="sidebar-account-item-info">
                  <span className="sidebar-account-item-name">{user.fullName || "You"}</span>
                  <span className="sidebar-account-item-email">{user.email}</span>
                </span>
                <MdCheck className="sidebar-account-item-check" size={16} />
              </div>

              {/* Other saved accounts */}
              {otherAccounts.map((account) => {
                const initials = getInitials(account.user?.fullName || "?");
                const hue = nameHue(account.user?.fullName || "");
                return (
                  <div key={account.id} className="sidebar-account-item" style={{ justifyContent: "space-between" }}>
                    <button
                      onClick={() => handleSwitchAccount(account)}
                      style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                      title={`Switch to ${account.user?.fullName}`}
                    >
                      <span
                        className="sidebar-account-item-avatar"
                        style={{ background: `hsl(${hue}, 60%, 48%)` }}
                      >
                        {initials}
                      </span>
                      <span className="sidebar-account-item-info">
                        <span className="sidebar-account-item-name">{account.user?.fullName || "Account"}</span>
                        <span className="sidebar-account-item-email">{account.user?.email}</span>
                      </span>
                    </button>
                    <button
                      className="sidebar-account-remove-btn"
                      onClick={() => removeAccount(account.id)}
                      title="Remove account"
                    >
                      <MdClose size={12} />
                    </button>
                  </div>
                );
              })}

              <div className="sidebar-dropdown-divider" />

              {/* Add account */}
              <button
                className="sidebar-add-account-btn"
                onClick={() => { setAccountMenuOpen(false); navigate("/auth/login"); }}
              >
                <MdPersonAdd size={15} />
                Add account
              </button>
            </div>
          )}

          {/* Avatar chip trigger */}
          <button
            id="sidebar-user-chip"
            className="sidebar-user-chip"
            onClick={() => !collapsed && setAccountMenuOpen((o) => !o)}
            title={collapsed ? (user.fullName || user.email) : undefined}
            aria-expanded={accountMenuOpen}
          >
            <span
              className="sidebar-user-avatar"
              style={{ background: `hsl(${userHue}, 60%, 48%)` }}
            >
              {userInitials}
            </span>
            {!collapsed && (
              <>
                <span className="sidebar-user-info">
                  <span className="sidebar-user-name">{user.fullName || user.email}</span>
                  <span className="sidebar-user-role">{userRole}</span>
                </span>
                <MdExpandMore className="sidebar-user-chevron" />
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}