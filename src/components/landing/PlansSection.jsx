import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdCheckCircle } from "react-icons/md";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";

function PlansSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/contract/settings");
        setSettings(res.data.data || []);
      } catch (err) {
        console.error("Failed to load plans", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSelect = (settingsId) => {
    const targetUrl = `/app/purchase-kiosk?selection=${settingsId}`;
    if (user) {
      navigate(targetUrl);
    } else {
      // Redirect to login with callback URL
      navigate(`/auth/login?cbUrl=${encodeURIComponent(targetUrl)}`);
    }
  };

  if (loading && settings.length === 0) return null;
  if (!loading && settings.length === 0) return null;

  return (
    <section className="plans-section" id="plans">
      <div className="plans-inner">
        <div className="plans-header">
          <h2 className="plans-heading">Choose Your Ownership Model</h2>
          <p className="plans-sub">
            Flexible plans tailored to your scale and investment. Get started
            with standardized infrastructure today.
          </p>
        </div>

        <div className="plans-grid">
          {settings.map((setting, index) => {
            const isPopular = index === 1 || setting.type === "LEASE"; // Heuristic for highlighting
            const baseAmount = setting.payments.reduce((sum, p) => sum + p.amount, 0);

            return (
              <div
                key={setting.id}
                className={`plan-card ${isPopular ? "plan-card-popular" : ""}`}
              >
                {isPopular && <div className="popular-badge">Most Flexible</div>}

                <div className="plan-header">
                  <span className="plan-type">{setting.title?.toUpperCase()}</span>
                  <div className="plan-price-wrap">
                    <span className="plan-currency">{setting.currency}</span>
                    <span className="plan-price">{baseAmount.toLocaleString()}</span>
                    {setting.type === "LEASE" && (
                      <span className="plan-duration">/ total setup</span>
                    )}
                  </div>
                  {setting.type === "LEASE" && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Contract Duration: {setting.durationDays} Days
                    </p>
                  )}
                </div>

                <ul className="plan-features">
                  <li className="plan-feature-item">
                    <MdCheckCircle className="plan-feature-icon" size={18} />
                    <span>Location: {setting.country}</span>
                  </li>
                  {setting.kioskSize && (
                    <li className="plan-feature-item">
                      <MdCheckCircle className="plan-feature-icon" size={18} />
                      <span>
                        Size: {setting.kioskSize.length}x{setting.kioskSize.breadth} {setting.kioskSize.unit}
                      </span>
                    </li>
                  )}
                  {setting.maxMenus && (
                    <li className="plan-feature-item">
                      <MdCheckCircle className="plan-feature-icon" size={18} />
                      <span>Support for up to {setting.maxMenus} Menus</span>
                    </li>
                  )}
                  {setting.payments.some(p => p.recurring) && (
                    <li className="plan-feature-item">
                      <MdCheckCircle className="plan-feature-icon" size={18} />
                      <span>Recurring support included</span>
                    </li>
                  )}
                </ul>

                <button
                  className={`app_btn ${isPopular ? "app_btn_confirm" : "app_btn_cancel"}`}
                  style={{ width: "100%", height: 50, fontSize: "0.95rem" }}
                  onClick={() => handleSelect(setting.id)}
                >
                  {user ? "Get Started" : "Login to Selection"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default PlansSection;
