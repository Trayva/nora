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
            <li><button className="landing-nav-btn" onClick={() => navigate("/shop")}>Shop</button></li>
            <li><button className="landing-nav-btn" onClick={() => scrollTo("contact")}>Contact</button></li>
          </ul>

          {/* Desktop Actions */}
          <div className="landing-header-actions">
            {user ? (
              <button
                className="app_btn app_btn_confirm"
                style={{ height: 36, padding: "0 20px" }}
                onClick={() => navigate("/app")}
              >
                Dashboard
              </button>
            ) : (
              <div className="landing-header-icons">
                {/* Support — scrolls to contact section */}
                <button
                  className="landing-icon-btn"
                  title="Contact support"
                  onClick={() => scrollTo("contact")}
                >
                  <MdOutlineHeadsetMic size={18} />
                </button>

                {/* Theme toggle */}
                <button
                  className="landing-icon-btn"
                  onClick={toggle}
                  title={theme === "dark" ? "Light mode" : "Dark mode"}
                >
                  {theme === "dark"
                    ? <MdOutlineLightMode size={18} />
                    : <MdOutlineDarkMode size={18} />
                  }
                </button>

                {/* Region / State picker */}
                <button
                  className="landing-icon-btn"
                  onClick={() => setStateOpen((v) => !v)}
                  title="Select region"
                >
                  <MdOutlineLanguage size={18} />
                  {selectedState && <span className="region-dot" />}
                </button>

                {/* Sign in */}
                <button
                  className="landing-icon-btn"
                  onClick={() => navigate(`/auth/login${prefix}`)}
                  title="Sign in"
                >
                  <MdPersonOutline size={18} />
                </button>
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="landing-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
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
                        {state.currency && (
                          <span className="state_dropdown_currency">{state.currency}</span>
                        )}
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
      {mobileOpen && (
        <div className="mobile_menu_backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`mobile_menu_drawer ${mobileOpen ? "mobile_menu_drawer_open" : ""}`}>
        <div className="mobile_menu_header">
          <Link to="/" className="landing-header-logo" onClick={() => setMobileOpen(false)}>
            <img
              src={theme === "dark" ? nora_logo_white : nora_logo_dark}
              alt="nora_logo"
              className="sidebar_logo"
            />
          </Link>
          <button
            className="landing-icon-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <MdClose size={20} />
          </button>
        </div>

        <nav className="mobile_menu_nav">
          <button className="mobile_menu_link" onClick={() => { scrollTo("home"); setMobileOpen(false); }}>Home</button>
          <button className="mobile_menu_link" onClick={() => { scrollTo("how"); setMobileOpen(false); }}>Why Nora</button>
          <button className="mobile_menu_link" onClick={() => { scrollTo("solutions"); setMobileOpen(false); }}>Solution</button>
          <button className="mobile_menu_link" onClick={() => { navigate("/shop"); setMobileOpen(false); }}>Shop</button>
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
                    {state.currency && (
                      <span className="mobile_menu_currency">{state.currency}</span>
                    )}
                    {active && (
                      <MdCheckCircle size={14} style={{ color: "var(--accent)", marginLeft: "auto" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mobile_menu_divider" />

        <div className="mobile_menu_actions">
          <button className="mobile_menu_action_row" onClick={toggle}>
            {theme === "dark"
              ? <><MdOutlineLightMode size={17} /> Light Mode</>
              : <><MdOutlineDarkMode size={17} /> Dark Mode</>
            }
          </button>

          {user ? (
            <button
              className="app_btn app_btn_confirm"
              style={{ width: "100%", height: 44, marginTop: 8 }}
              onClick={() => { navigate("/app"); setMobileOpen(false); }}
            >
              Dashboard
            </button>
          ) : (
            <button
              className="app_btn app_btn_confirm"
              style={{ width: "100%", height: 44, marginTop: 8 }}
              onClick={() => { navigate(`/auth/login${prefix}`); setMobileOpen(false); }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default Header;