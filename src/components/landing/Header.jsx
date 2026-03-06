import { Link, useNavigate } from "react-router-dom";
import icons from "../../assets/icons.jsx";
import { useAuth } from "../../contexts/AuthContext";
import useQuery from "../../hooks/useQuery";
import useModal from "../../hooks/useModal";
import Modal from "../Modal";
import { useState } from "react";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";
import { useTheme } from "../../contexts/ThemeContext.jsx";

const regions = [
  { name: "Nigeria 🇳🇬", cities: [{ name: "Abuja" }, { name: "Lagos" }] },
  { name: "UAE 🇦🇪", cities: [{ name: "Dubai" }, { name: "Abu Dhabi" }] },
  { name: "Kenya 🇰🇪", cities: [{ name: "Nairobi" }] },
];

function Header() {
  const [region, setRegion] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const q = useQuery();
  const cbUrl = q.get("cbUrl");
  const prefix = cbUrl ? `?cbUrl=${cbUrl}` : "";

  const {
    isOpened: regionOpened,
    closeModal: closeRegion,
    toggleIsOpened: toggleRegion,
  } = useModal();
  const { theme, toggle } = useTheme();
  return (
    <header className="landing-header">
      <Modal top={50} isVisible={regionOpened} closeModal={closeRegion}>
        <div className="region-modal">
          {regions.map((_region) => (
            <div key={_region.name} className="region-group">
              <h2 className="region-title">{_region.name}</h2>
              {_region.cities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    setRegion(city);
                    closeRegion();
                  }}
                  className={`region-city-btn ${region?.name === city.name ? "active" : ""}`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </Modal>

      <div className="landing-header-inner">
        {/* Logo */}
        <Link to="/" className="landing-header-logo">
          <img
            src={theme === "dark" ? nora_logo_white : nora_logo_dark}
            alt="nora_logo"
            className="sidebar_logo"
          />
        </Link>

        {/* Nav */}
        <ul className="landing-header-nav">
          <li>
            <a href="/#home">Home</a>
          </li>
          <li>
            <a href="/#how">Why nora</a>
          </li>
          <li>
            <a href="/#why">Solution</a>
          </li>
          <li>
            <a href="/#shop">Shop</a>
          </li>
          <li>
            <a href="/#contact">Contact us</a>
          </li>
        </ul>

        {/* Actions */}
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
              <button className="landing-icon-btn" title="Support">
                {icons.support}
              </button>
              <button
                className="landing-icon-btn"
                onClick={toggleRegion}
                title="Region"
              >
                {icons.globe}
                {region && <span className="region-dot" />}
              </button>
              <button
                className="landing-icon-btn"
                onClick={() => navigate(`/auth/login${prefix}`)}
                title="Sign in"
              >
                {icons.user}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
