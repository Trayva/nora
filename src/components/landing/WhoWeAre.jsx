import { useEffect, useRef } from "react";
import img from "../../assets/who.png";
import {
  MdOutlineRocketLaunch,
  MdOutlineHub,
  MdOutlineAutoAwesome,
} from "react-icons/md";

const PILLARS = [
  { icon: MdOutlineRocketLaunch, label: "Rapid Deployment" },
  { icon: MdOutlineHub,          label: "Centralized Control" },
  { icon: MdOutlineAutoAwesome,  label: "AI-Powered Insights" },
];

function WhoWeAre() {
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
        {/* Left */}
        <div className="lp-col-text lp-reveal lp-reveal-left">
          <div className="lp-eyebrow">What We Do</div>
          <h2 className="lp-heading">
            The Operating System for <span className="lp-accent">Food Franchising</span>
          </h2>
          <p className="lp-body">
            We connect established food brands with a new generation of operators
            and investors, providing the infrastructure, systems, and oversight
            required to run efficient, standardized QSR outlets.
          </p>
          <p className="lp-body">
            Our approach removes the traditional barriers to franchising —
            making expansion faster for brands and ownership accessible to more people.
          </p>

          <div className="lp-pillars">
            {PILLARS.map(({ icon: Icon, label }) => (
              <div key={label} className="lp-pillar-chip">
                <Icon size={16} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="lp-col-visual lp-reveal lp-reveal-right">
          <div className="lp-img-frame">
            <div className="lp-img-glow" />
            <img src={img} alt="What we do" className="lp-img" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhoWeAre;