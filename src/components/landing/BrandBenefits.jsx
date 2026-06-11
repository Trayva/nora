import { useEffect, useRef, useState } from "react";
import imgExterior from "../../assets/icart_kiosk_exterior.jpg";
import imgInterior1 from "../../assets/icart_kiosk_interior_1.jpg";
import imgInterior2 from "../../assets/icart_kiosk_interior_2.jpg";
import {
  MdCheckCircle,
  MdOutlineStorefront,
  MdOutlineKitchen,
  MdOutlineMeetingRoom,
} from "react-icons/md";

const BENEFITS = [
  "Rapid market entry across multiple locations",
  "Standardized kiosk infrastructure",
  "Access to pre-qualified operators and investors",
  "Centralized control over menu, pricing, and operations",
  "Real-time performance monitoring via digital dashboard",
];

const TABS = [
  { id: "exterior", label: "Exterior", img: imgExterior, icon: MdOutlineStorefront, hasBg: true },
  { id: "prep", label: "Kitchen", img: imgInterior1, icon: MdOutlineKitchen, hasBg: true },
  { id: "workspace", label: "Setup", img: imgInterior2, icon: MdOutlineMeetingRoom, hasBg: true },
];

function BrandBenefits() {
  const ref = useRef(null);
  const [activeTab, setActiveTab] = useState("exterior");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("lp-visible"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const activeTabObj = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section className="lp-section">
      <div className="lp-inner lp-two-col lp-two-col-reverse" ref={ref}>
        {/* Left image */}
        <div className="lp-col-visual lp-reveal lp-reveal-left">
          <div className="kiosk-gallery-frame">
            <div className="lp-img-glow lp-img-glow-indigo" />
            <div className="kiosk-view-container">
              <img
                key={activeTabObj.id}
                src={activeTabObj.img}
                alt={activeTabObj.label}
                className={`kiosk-gallery-img ${activeTabObj.hasBg ? "has-bg" : ""}`}
              />
              {/* Floating badge */}
              {activeTab === "exterior" && (
                <div className="lp-img-badge lp-img-badge-tl" style={{ top: "14px", left: "14px" }}>
                  <span className="lp-img-badge-value">5x</span>
                  <span className="lp-img-badge-label">Faster Scale</span>
                </div>
              )}
            </div>

            {/* Tabs control bar */}
            <div className="kiosk-tab-bar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`kiosk-tab-btn ${activeTab === tab.id ? "kiosk-tab-btn-active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="lp-col-text lp-reveal lp-reveal-right">
          <div className="lp-eyebrow lp-eyebrow-indigo">For Food Brands</div>
          <h2 className="lp-heading">
            Expand Faster.{" "}
            <span className="lp-accent">Without Heavy Capital.</span>
          </h2>
          <p className="lp-body">
            Nora AI enables food brands to scale into new markets without the
            constraints of traditional expansion.
          </p>

          <ul className="lp-checklist">
            {BENEFITS.map((b, i) => (
              <li key={i} className="lp-check-item">
                <MdCheckCircle size={18} className="lp-check-icon" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <p className="lp-accent-tagline">
            You focus on your brand. We handle the scale.
          </p>
        </div>
      </div>
    </section>
  );
}

export default BrandBenefits;
