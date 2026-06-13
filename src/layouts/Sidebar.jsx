import { useState, useMemo, useRef, useEffect } from "react";
import {
  MdOutlineSettings, MdOutlinePerson, MdOutlineLightMode, MdOutlineDarkMode,
  MdOutlineKitchen, MdChevronLeft, MdChevronRight, MdOutlineBadge,
  MdLocationOn, MdClose, MdAdminPanelSettings, MdCheck,
  MdPersonAdd, MdExpandMore, MdOutlineTour, MdOutlineHelpOutline,
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
  { id: "admin", label: "Admin", icon: MdAdminPanelSettings, path: "/app/admin", forRoles: ["ADMIN"], tourId: "sidebar-nav-admin" },
  { id: "finance", label: "Finance", icon: RxBarChart, path: "/app/finance", forRoles: ["ALL"], tourId: "sidebar-nav-finance" },
  { id: "kiosk", label: "Kiosks", icon: MdOutlineKitchen, path: "/app/kiosk-home", forRoles: ["ADMIN", "VENDOR", "SUPPLIER", "OPERATOR", "CUSTOMER"], tourId: "sidebar-nav-kiosk-home" },
  { id: "mybusiness", label: "My Business", icon: BsShop, path: "/app/business", forRoles: ["ADMIN", "VENDOR"], tourId: "sidebar-nav-business" },
  { id: "supplier", label: "Supplier", icon: PiTruck, path: "/app/supplier", forRoles: ["ADMIN", "SUPPLIER"], tourId: "sidebar-nav-supplier" },
  { id: "operator", label: "Operator", icon: MdOutlineBadge, path: "/app/operator", forRoles: ["ADMIN", "OPERATOR"], tourId: "sidebar-nav-operator" },
  { id: "aggregator", label: "Aggregator", icon: TbGridDots, path: "/app/aggregator", forRoles: ["ADMIN", "AGGREGATOR"], tourId: "sidebar-nav-aggregator" },
];

const BOTTOM_ITEMS = [
  // { id: "settings", label: "Settings", icon: MdOutlineSettings, path: "/app/settings" },
  { id: "support", label: "Help & Support", icon: MdOutlineHelpOutline, path: "/app/support", tourId: "sidebar-nav-support" },
  { id: "profile", label: "Profile", icon: MdOutlinePerson, path: "/app/profile", tourId: "sidebar-nav-profile" },
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

/**
 * Renders a circular avatar: profile image if available, otherwise
 * a deterministic colour + initials fallback.
 */
function UserAvatar({ user, className = "sidebar-user-avatar", style = {} }) {
  const hue = nameHue(user?.fullName || user?.email || "");
  const initials = getInitials(user?.fullName || user?.email || "?");
  const imgSrc = user?.image || null;

  if (imgSrc) {
    return (
      <span className={className} style={{ background: "transparent", padding: 0, overflow: "hidden", ...style }}>
        <img
          src={imgSrc}
          alt={user?.fullName || "Avatar"}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit", display: "block" }}
          onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.textContent = initials; }}
        />
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{ background: `hsl(${hue}, 60%, 48%)`, ...style }}
    >
      {initials}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar({ mobileOpen = false, onMobileClose, onStartTour }) {
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
          {visibleNavItems.map(({ id, label, icon: Icon, path, tourId }) => (
            <li key={id}>
              <button
                id={tourId || `sidebar-nav-${id}`}
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
          {BOTTOM_ITEMS.map(({ id, label, icon: Icon, path, tourId }) => (
            <li key={id}>
              <button
                id={tourId || `sidebar-nav-${id}`}
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
          {/* <li>
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
          </li> */}

          {/* Replay tour */}
          {/* {onStartTour && (
            <li>
              <button
                id="sidebar-replay-tour"
                className="sidebar-item"
                onClick={() => { onStartTour(); if (onMobileClose) onMobileClose(); }}
                title={collapsed ? "Replay Guide" : undefined}
              >
                <MdOutlineTour className="sidebar-icon" />
                {!collapsed && <span className="sidebar-label">Feature Guide</span>}
              </button>
            </li>
          )} */}
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
                <UserAvatar user={user} className="sidebar-account-item-avatar" />
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
                      style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", textAlign: "left" }}
                      title={`Switch to ${account.user?.fullName}`}
                    >
                      <UserAvatar user={account.user} className="sidebar-account-item-avatar" />
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
                onClick={() => { setAccountMenuOpen(false); navigate("/auth/login?addAccount=true"); }}
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
            <UserAvatar user={user} className="sidebar-user-avatar" />
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