import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MdCheckCircle, MdOutlineStarBorder } from "react-icons/md";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";

function PlansSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/contract/settings");
        // Handle both { data: [...] } and { data: { data: [...] } } shapes
        const raw = res.data?.data ?? res.data;
        setSettings(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error("Failed to load plans", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Trigger reveal once data is loaded and ref is mounted.
  // We can't rely on IntersectionObserver with [] deps because the
  // component returns null while loading, so ref.current is null on mount.
  useEffect(() => {
    if (loading || !settings.length) return;
    const el = ref.current;
    if (!el) return;
    // Small timeout lets the DOM paint first, then reveal
    const t = setTimeout(() => el.classList.add("lp-visible"), 80);
    return () => clearTimeout(t);
  }, [loading, settings]);

  const handleSelect = (settingsId) => {
    const targetUrl = `/app/purchase-kiosk?selection=${settingsId}`;
    if (user) {
      navigate(targetUrl);
    } else {
      navigate(`/auth/login?cbUrl=${encodeURIComponent(targetUrl)}`);
    }
  };

  if (loading && settings.length === 0) return null;
  if (!loading && settings.length === 0) return null;

  return (
    <section className="lp-section lp-section-alt" id="plans">
      <div className="lp-inner lp-block" ref={ref}>
        <div className="lp-section-header lp-reveal lp-reveal-up">
          <div className="lp-eyebrow">Ownership Models</div>
          <h2 className="lp-heading lp-heading-center">Choose Your Plan</h2>
          <p className="lp-sub-center">
            Flexible plans tailored to your scale and investment. Get started
            with standardized infrastructure today.
          </p>
        </div>

        <div className="lp-plans-grid">
          {settings.map((setting, index) => {
            const isPopular = index === 1 || setting.type === "LEASE";
            const baseAmount = setting.payments.reduce((sum, p) => sum + p.amount, 0);

            return (
              <div
                key={setting.id}
                className={`lp-plan-card lp-reveal lp-reveal-up ${isPopular ? "lp-plan-card-popular" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {isPopular && (
                  <div className="lp-plan-popular-badge">
                    <MdOutlineStarBorder size={14} />
                    Most Flexible
                  </div>
                )}

                <div className="lp-plan-header">
                  <span className="lp-plan-type">{setting.title?.toUpperCase()}</span>
                  <div className="lp-plan-price-row">
                    <span className="lp-plan-currency">{setting.currency}</span>
                    <span className="lp-plan-price">{baseAmount.toLocaleString()}</span>
                  </div>
                  {setting.type === "LEASE" && (
                    <p className="lp-plan-duration">
                      Contract: {setting.durationDays} days
                    </p>
                  )}
                </div>

                <ul className="lp-plan-features">
                  <li className="lp-plan-feature">
                    <MdCheckCircle size={16} className="lp-plan-check" />
                    <span>Location: {setting.country}</span>
                  </li>
                  {setting.kioskSize && (
                    <li className="lp-plan-feature">
                      <MdCheckCircle size={16} className="lp-plan-check" />
                      <span>
                        Size: {setting.kioskSize.length}×{setting.kioskSize.breadth}{" "}
                        {setting.kioskSize.unit}
                      </span>
                    </li>
                  )}
                  {setting.maxMenus && (
                    <li className="lp-plan-feature">
                      <MdCheckCircle size={16} className="lp-plan-check" />
                      <span>Up to {setting.maxMenus} menus</span>
                    </li>
                  )}
                  {setting.payments.some((p) => p.recurring) && (
                    <li className="lp-plan-feature">
                      <MdCheckCircle size={16} className="lp-plan-check" />
                      <span>Recurring support included</span>
                    </li>
                  )}
                </ul>

                <button
                  className={`lp-plan-btn ${isPopular ? "lp-plan-btn-primary" : "lp-plan-btn-secondary"}`}
                  onClick={() => handleSelect(setting.id)}
                >
                  {user ? "Get Started" : "Login to Select"}
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
