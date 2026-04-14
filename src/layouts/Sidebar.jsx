// import { useState, useMemo } from "react";
// import {
//   MdOutlineSettings,
//   MdOutlinePerson,
//   MdOutlineLightMode,
//   MdOutlineDarkMode,
//   MdOutlineKitchen,
//   MdChevronLeft,
//   MdChevronRight,
//   MdOutlineBadge,
//   MdLocationOn,
//   MdClose,
//   MdAdminPanelSettings,
// } from "react-icons/md";
// import nora_logo_white from "../assets/nora_white.png";
// import nora_icon_white from "../assets/nora_white - icon.png";
// import nora_logo_dark from "../assets/nora_dark.png";
// import nora_icon_dark from "../assets/nora_dark - icon.png";
// import { RxBarChart } from "react-icons/rx";
// import { PiTruck } from "react-icons/pi";
// import "./Sidebar.css";
// import { useTheme } from "../contexts/ThemeContext";
// import { useNavigate, useLocation } from "react-router-dom";
// import { BsShop } from "react-icons/bs";
// import { useAppState } from "../contexts/StateContext";
// import { useAuth } from "../contexts/AuthContext";
// import { getPrimaryRole } from "../utils/AuthHelpers";

// /*
//   Nav item visibility rules:
//   ─────────────────────────────────────────────────
//   ADMIN     → all items + Admin item
//   VENDOR    → iCarts + My Business
//   SUPPLIER  → iCarts + Supplier
//   OPERATOR  → iCarts + Operator
//   CUSTOMER  → iCarts only

//   Finance, Settings, Profile always visible to all.
//   Dashboard removed entirely.
//   ─────────────────────────────────────────────────
// */

// const ALL_NAV_ITEMS = [
//   {
//     id: "admin",
//     label: "Admin",
//     icon: MdAdminPanelSettings,
//     path: "/app/admin",
//     forRoles: ["ADMIN"],
//   },
//   {
//     id: "finance",
//     label: "Finance",
//     icon: RxBarChart,
//     path: "/app/finance",
//     forRoles: ["ALL"],
//   },
//   {
//     id: "icart",
//     label: "iCarts",
//     icon: MdOutlineKitchen,
//     path: "/app/icart-home",
//     forRoles: ["ALL"],
//   },
//   {
//     id: "mybusiness",
//     label: "My Business",
//     icon: BsShop,
//     path: "/app/business",
//     forRoles: ["ADMIN", "VENDOR"],
//   },
//   {
//     id: "supplier",
//     label: "Supplier",
//     icon: PiTruck,
//     path: "/app/supplier",
//     forRoles: ["ADMIN", "SUPPLIER"],
//   },
//   {
//     id: "operator",
//     label: "Operator",
//     icon: MdOutlineBadge,
//     path: "/app/operator",
//     forRoles: ["ADMIN", "OPERATOR"],
//   },
// ];

// const BOTTOM_ITEMS = [
//   {
//     id: "settings",
//     label: "Settings",
//     icon: MdOutlineSettings,
//     path: "/app/settings",
//   },
//   {
//     id: "profile",
//     label: "Profile",
//     icon: MdOutlinePerson,
//     path: "/app/profile",
//   },
// ];

// function getVisibleItems(user) {
//   if (!user) return [];
//   const role = getPrimaryRole(user);
//   return ALL_NAV_ITEMS.filter(
//     (item) => item.forRoles.includes("ALL") || item.forRoles.includes(role),
//   );
// }

// export default function Sidebar({ mobileOpen = false, onMobileClose }) {
//   const { theme, toggle } = useTheme();
//   const { states, selectedState, changeState } = useAppState();
//   const { user } = useAuth();
//   const [collapsed, setCollapsed] = useState(false);
//   const [logoHovered, setLogoHovered] = useState(false);
//   const navigate = useNavigate();
//   const location = useLocation();

//   const visibleNavItems = useMemo(() => getVisibleItems(user), [user]);

//   // Derive active item from current path
//   const active = useMemo(() => {
//     const all = [...ALL_NAV_ITEMS, ...BOTTOM_ITEMS];
//     // Longest match first
//     const matched = all
//       .filter((item) => location.pathname.startsWith(item.path))
//       .sort((a, b) => b.path.length - a.path.length)[0];
//     return matched?.id || "";
//   }, [location.pathname]);

//   const handleNav = (path) => {
//     navigate(path);
//     if (onMobileClose) onMobileClose();
//   };

//   return (
//     <aside
//       className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--mobile-open" : ""}`}
//     >
//       {/* Logo row */}
//       <div className="sidebar-logo">
//         {collapsed ? (
//           <button
//             className="sidebar-logo-collapsed-btn"
//             onClick={() => {
//               setCollapsed(false);
//               setLogoHovered(false);
//             }}
//             onMouseEnter={() => setLogoHovered(true)}
//             onMouseLeave={() => setLogoHovered(false)}
//             title="Expand sidebar"
//           >
//             <img
//               src={theme === "dark" ? nora_icon_white : nora_icon_dark}
//               alt="Nora"
//               className={`sidebar_logo sidebar_logo--icon ${logoHovered ? "sidebar_logo--hidden" : ""}`}
//             />
//             <MdChevronRight
//               className={`sidebar-icon sidebar-expand-icon ${logoHovered ? "sidebar-expand-icon--visible" : ""}`}
//             />
//           </button>
//         ) : (
//           <>
//             <img
//               src={theme === "dark" ? nora_logo_white : nora_logo_dark}
//               alt="Nora"
//               className="sidebar_logo"
//             />
//             <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//               <button
//                 className="sidebar-collapse-btn sidebar-collapse-btn--desktop"
//                 onClick={() => setCollapsed(true)}
//                 title="Collapse sidebar"
//               >
//                 <MdChevronLeft className="sidebar-icon" />
//               </button>
//               <button
//                 className="sidebar-collapse-btn sidebar-collapse-btn--mobile"
//                 onClick={onMobileClose}
//                 title="Close menu"
//               >
//                 <MdClose className="sidebar-icon" />
//               </button>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Main nav */}
//       <nav className="sidebar-nav">
//         <ul className="sidebar-list">
//           {visibleNavItems.map(({ id, label, icon: Icon, path }) => (
//             <li key={id}>
//               <button
//                 className={`sidebar-item ${active === id ? "active" : ""}`}
//                 onClick={() => handleNav(path)}
//                 title={collapsed ? label : undefined}
//               >
//                 <Icon className="sidebar-icon" />
//                 {!collapsed && <span className="sidebar-label">{label}</span>}
//                 {active === id && <span className="sidebar-active-bar" />}
//               </button>
//             </li>
//           ))}
//         </ul>
//       </nav>

//       {/* Bottom nav */}
//       <div className="sidebar-bottom">
//         <ul className="sidebar-list">
//           {BOTTOM_ITEMS.map(({ id, label, icon: Icon, path }) => (
//             <li key={id}>
//               <button
//                 className={`sidebar-item ${active === id ? "active" : ""}`}
//                 onClick={() => handleNav(path)}
//                 title={collapsed ? label : undefined}
//               >
//                 <Icon className="sidebar-icon" />
//                 {!collapsed && <span className="sidebar-label">{label}</span>}
//                 {active === id && <span className="sidebar-active-bar" />}
//               </button>
//             </li>
//           ))}

//           {/* State selector */}
//           <div
//             className="sidebar_state_section"
//             title={collapsed ? selectedState?.name || "Location" : undefined}
//           >
//             <MdLocationOn className="sidebar_state_icon" />
//             {!collapsed && (
//               <span className="sidebar_state_label">
//                 {selectedState?.name || "Select location"}
//               </span>
//             )}
//             <select
//               className="sidebar_state_select"
//               value={selectedState?.id || ""}
//               onChange={(e) => {
//                 const found = states.find((s) => s.id === e.target.value);
//                 if (found) changeState(found);
//               }}
//             >
//               {states.map((s) => (
//                 <option key={s.id} value={s.id}>
//                   {s.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Theme toggle */}
//           <li>
//             <button
//               className="sidebar-item"
//               onClick={toggle}
//               title={
//                 collapsed
//                   ? theme === "dark"
//                     ? "Light Mode"
//                     : "Dark Mode"
//                   : undefined
//               }
//             >
//               {theme === "dark" ? (
//                 <MdOutlineLightMode className="sidebar-icon" />
//               ) : (
//                 <MdOutlineDarkMode className="sidebar-icon" />
//               )}
//               {!collapsed && (
//                 <span className="sidebar-label">
//                   {theme === "dark" ? "Light Mode" : "Dark Mode"}
//                 </span>
//               )}
//             </button>
//           </li>
//         </ul>
//       </div>
//     </aside>
//   );
// }


import { useState, useMemo } from "react";
import {
  MdOutlineSettings, MdOutlinePerson, MdOutlineLightMode, MdOutlineDarkMode,
  MdOutlineKitchen, MdChevronLeft, MdChevronRight, MdOutlineBadge,
  MdLocationOn, MdClose, MdAdminPanelSettings,
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
  VENDOR      → iCarts + My Business
  SUPPLIER    → iCarts + Supplier
  OPERATOR    → iCarts + Operator
  AGGREGATOR  → Aggregator + Finance only
  CUSTOMER    → iCarts only

  Finance, Settings, Profile always visible to all.
  ─────────────────────────────────────────────────
*/

const ALL_NAV_ITEMS = [
  { id: "admin", label: "Admin", icon: MdAdminPanelSettings, path: "/app/admin", forRoles: ["ADMIN"] },
  { id: "finance", label: "Finance", icon: RxBarChart, path: "/app/finance", forRoles: ["ALL"] },
  { id: "icart", label: "iCarts", icon: MdOutlineKitchen, path: "/app/icart-home", forRoles: ["ADMIN", "VENDOR", "SUPPLIER", "OPERATOR", "CUSTOMER"] },
  { id: "mybusiness", label: "My Business", icon: BsShop, path: "/app/business", forRoles: ["ADMIN", "VENDOR"] },
  { id: "supplier", label: "Supplier", icon: PiTruck, path: "/app/supplier", forRoles: ["ADMIN", "SUPPLIER"] },
  { id: "operator", label: "Operator", icon: MdOutlineBadge, path: "/app/operator", forRoles: ["ADMIN", "OPERATOR"] },
  { id: "aggregator", label: "Aggregator", icon: TbGridDots, path: "/app/aggregator", forRoles: ["ADMIN", "AGGREGATOR"] },
];

const BOTTOM_ITEMS = [
  { id: "settings", label: "Settings", icon: MdOutlineSettings, path: "/app/settings" },
  { id: "profile", label: "Profile", icon: MdOutlinePerson, path: "/app/profile" },
];

function getVisibleItems(user) {
  if (!user) return [];
  const role = getPrimaryRole(user);

  // AGGREGATOR sees only aggregator + finance
  if (role === "AGGREGATOR") {
    return ALL_NAV_ITEMS.filter((item) =>
      item.id === "aggregator" || item.id === "finance"
    );
  }

  return ALL_NAV_ITEMS.filter((item) =>
    item.forRoles.includes("ALL") || item.forRoles.includes(role)
  );
}

export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  const { theme, toggle } = useTheme();
  const { states, selectedState, changeState } = useAppState();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
          <div className="sidebar_state_section" title={collapsed ? selectedState?.name || "Location" : undefined}>
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
          </div>

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
    </aside>
  );
}