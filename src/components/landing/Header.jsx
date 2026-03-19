import { Link, useNavigate } from "react-router-dom";
import {
  MdOutlineHeadsetMic,
  MdOutlineLanguage,
  MdPersonOutline,
  MdMenu,
  MdClose,
  MdOutlineLightMode,
  MdOutlineDarkMode,
  MdCheckCircle,
  MdCircle,
} from "react-icons/md";
import { useAuth } from "../../contexts/AuthContext";
import useQuery from "../../hooks/useQuery";
import { useState, useEffect } from "react";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useAppState } from "../../contexts/StateContext";

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const q = useQuery();
  const cbUrl = q.get("cbUrl");
  const prefix = cbUrl ? `?cbUrl=${cbUrl}` : "";
  const { theme, toggle } = useTheme();
  const { states, selectedState, changeState } = useAppState();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleStateSelect = (state) => {
    changeState(state);
    setStateOpen(false);
  };

  // Shared shop navigation — requests geolocation then routes to /shop
  const goToShop = (closeMobile = false) => {
    if (closeMobile) setMobileOpen(false);
    const go = (lat, lng) =>
      navigate(lat && lng ? `/shop?lat=${lat}&lng=${lng}` : "/shop");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => go(pos.coords.latitude, pos.coords.longitude),
        () => go(),
        { timeout: 4000 }
      );
    } else {
      go();
    }
  };

  return (
    <>
      <header className="landing-header">
        <div className="landing-header-inner">
          {/* Logo */}
          <Link to="/" className="landing-header-logo">
            <img
              src={theme === "dark" ? nora_logo_white : nora_logo_dark}
              alt="nora_logo"
              className="sidebar_logo"
            />
          </Link>

          {/* Desktop Nav */}
          <ul className="landing-header-nav">
            <li><button className="landing-nav-btn" onClick={() => scrollTo("home")}>Home</button></li>
            <li><button className="landing-nav-btn" onClick={() => scrollTo("how")}>Why Nora</button></li>
            <li><button className="landing-nav-btn" onClick={() => scrollTo("solutions")}>Solution</button></li>
            <li><button className="landing-nav-btn" onClick={() => goToShop()}>Shop</button></li>
            <li><button className="landing-nav-btn" onClick={() => scrollTo("contact")}>Contact</button></li>
          </ul>

          {/* Desktop Actions */}
          <div className="landing-header-actions">
            <div className="landing-header-icons">
              <button className="landing-icon-btn" title="Contact support" onClick={() => scrollTo("contact")}>
                <MdOutlineHeadsetMic size={18} />
              </button>
              <button className="landing-icon-btn" onClick={toggle} title={theme === "dark" ? "Light mode" : "Dark mode"}>
                {theme === "dark" ? <MdOutlineLightMode size={18} /> : <MdOutlineDarkMode size={18} />}
              </button>
              <button className="landing-icon-btn" onClick={() => setStateOpen((v) => !v)} title="Select region">
                <MdOutlineLanguage size={18} />
                {selectedState && <span className="region-dot" />}
              </button>
              <button className="landing-icon-btn" onClick={() => navigate(`/auth/login${prefix}`)} title="Sign in">
                <MdPersonOutline size={18} />
              </button>
            </div>

            {/* Hamburger — mobile only */}
            <button className="landing-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MdMenu size={22} />
            </button>
          </div>
        </div>

        {/* State dropdown (desktop) */}
        {stateOpen && (
          <>
            <div className="state_dropdown_backdrop" onClick={() => setStateOpen(false)} />
            <div className="state_dropdown">
              <p className="state_dropdown_label">Select Region</p>
              {states.length === 0 ? (
                <p className="state_dropdown_empty">No regions available.</p>
              ) : (
                states.map((state) => {
                  const active = selectedState?.id === state.id;
                  return (
                    <button
                      key={state.id}
                      className={`state_dropdown_item ${active ? "state_dropdown_item_active" : ""}`}
                      onClick={() => handleStateSelect(state)}
                    >
                      <div className="state_dropdown_item_left">
                        <span className="state_dropdown_name">{state.name}</span>
                        {state.currency && <span className="state_dropdown_currency">{state.currency}</span>}
                      </div>
                      {active
                        ? <MdCheckCircle size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                        : <MdCircle size={13} style={{ color: "var(--border)", flexShrink: 0 }} />
                      }
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </header>

      {/* ── Mobile Slide-in Menu ── */}
      {mobileOpen && <div className="mobile_menu_backdrop" onClick={() => setMobileOpen(false)} />}
      <div className={`mobile_menu_drawer ${mobileOpen ? "mobile_menu_drawer_open" : ""}`}>
        <div className="mobile_menu_header">
          <Link to="/" className="landing-header-logo" onClick={() => setMobileOpen(false)}>
            <img src={theme === "dark" ? nora_logo_white : nora_logo_dark} alt="nora_logo" className="sidebar_logo" />
          </Link>
          <button className="landing-icon-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <MdClose size={20} />
          </button>
        </div>

        <nav className="mobile_menu_nav">
          <button className="mobile_menu_link" onClick={() => { scrollTo("home"); setMobileOpen(false); }}>Home</button>
          <button className="mobile_menu_link" onClick={() => { scrollTo("how"); setMobileOpen(false); }}>Why Nora</button>
          <button className="mobile_menu_link" onClick={() => { scrollTo("solutions"); setMobileOpen(false); }}>Solution</button>
          <button className="mobile_menu_link" onClick={() => goToShop(true)}>Shop</button>
          <button className="mobile_menu_link" onClick={() => { scrollTo("contact"); setMobileOpen(false); }}>Contact</button>
        </nav>

        <div className="mobile_menu_divider" />

        {states.length > 0 && (
          <div className="mobile_menu_region">
            <p className="mobile_menu_section_label">Region</p>
            <div className="mobile_menu_region_list">
              {states.map((state) => {
                const active = selectedState?.id === state.id;
                return (
                  <button
                    key={state.id}
                    className={`mobile_menu_region_btn ${active ? "mobile_menu_region_btn_active" : ""}`}
                    onClick={() => { handleStateSelect(state); setMobileOpen(false); }}
                  >
                    {state.name}
                    {state.currency && <span className="mobile_menu_currency">{state.currency}</span>}
                    {active && <MdCheckCircle size={14} style={{ color: "var(--accent)", marginLeft: "auto" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mobile_menu_divider" />

        <div className="mobile_menu_actions">
          <button className="mobile_menu_action_row" onClick={toggle}>
            {theme === "dark" ? <><MdOutlineLightMode size={17} /> Light Mode</> : <><MdOutlineDarkMode size={17} /> Dark Mode</>}
          </button>
        </div>
      </div>
    </>
  );
}

export default Header;