import { useEffect, useRef } from "react";
import img from "../../assets/kiosk11.png";
import { MdCheckCircle } from "react-icons/md";

const BENEFITS = [
  "Rapid market entry across multiple locations",
  "Standardized kiosk infrastructure",
  "Access to pre-qualified operators and investors",
  "Centralized control over menu, pricing, and operations",
  "Real-time performance monitoring via digital dashboard",
];

function BrandBenefits() {
  const ref = useRef(null);

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

  return (
    <section className="lp-section">
      <div className="lp-inner lp-two-col lp-two-col-reverse" ref={ref}>
        {/* Left image */}
        <div className="lp-col-visual lp-reveal lp-reveal-left">
          <div className="lp-img-frame">
            <div className="lp-img-glow lp-img-glow-indigo" />
            <img src={img} alt="Food Brands" className="lp-img" />
            {/* Floating badge */}
            <div className="lp-img-badge lp-img-badge-tl">
              <span className="lp-img-badge-value">5x</span>
              <span className="lp-img-badge-label">Faster Scale</span>
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
