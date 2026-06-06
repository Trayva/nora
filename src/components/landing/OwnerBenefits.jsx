import { useEffect, useRef } from "react";
import img from "../../assets/who.png";
import { MdCheckCircle } from "react-icons/md";

const BENEFITS = [
  "Access to established food brands",
  "Ready-to-deploy modular kiosks",
  "Integrated supply chain and logistics",
  "Digital tools to manage daily operations",
  "Performance insights powered by AI",
  "No prior experience required — just the ambition to build",
];

function OwnerBenefits() {
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
    <section className="lp-section lp-section-alt">
      <div className="lp-inner lp-two-col" ref={ref}>
        {/* Left content */}
        <div className="lp-col-text lp-reveal lp-reveal-left">
          <div className="lp-eyebrow">For Franchise Owners</div>
          <h2 className="lp-heading">
            Own a Food Business.{" "}
            <span className="lp-accent">Operate from Your Phone.</span>
          </h2>
          <p className="lp-body">
            Nora AI makes it possible to own and run a QSR outlet without
            starting from scratch. Everything you need is built in.
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
            Your ambition is enough. We'll handle the rest.
          </p>
        </div>

        {/* Right image */}
        <div className="lp-col-visual lp-reveal lp-reveal-right">
          <div className="lp-img-frame">
            <div className="lp-img-glow" />
            <img src={img} alt="Franchise Owners" className="lp-img" />
            {/* Floating badge */}
            <div className="lp-img-badge lp-img-badge-br">
              <span className="lp-img-badge-value">200+</span>
              <span className="lp-img-badge-label">Active Owners</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OwnerBenefits;
