import { useEffect, useRef } from "react";

const BRAND_STEPS = [
  { id: 1, text: "List your franchise on Nora AI" },
  { id: 2, text: "Define menu, pricing, and operational standards" },
  { id: 3, text: "Get matched with qualified franchisees" },
  { id: 4, text: "Scale with our ready infrastructure" },
  { id: 5, text: "Monitor operations and compliance seamlessly" },
];

const OWNER_STEPS = [
  { id: 1, text: "Browse available food brands" },
  { id: 2, text: "Select and purchase a franchise" },
  { id: 3, text: "Deploy your kiosk in a target location" },
  { id: 4, text: "Operate digitally through our platform" },
  { id: 5, text: "Track performance and grow" },
];

function How() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("lp-visible"); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="lp-section lp-section-alt" id="how">
      <div className="lp-inner lp-block" ref={ref}>
        <div className="lp-section-header lp-reveal lp-reveal-up">
          <div className="lp-eyebrow">Process</div>
          <h2 className="lp-heading lp-heading-center">How It Works</h2>
          <p className="lp-sub-center">
            A streamlined path from day one to a thriving franchise network
          </p>
        </div>

        <div className="lp-how-grid">
          {/* For Brands */}
          <div className="lp-how-card lp-reveal lp-reveal-left">
            <div className="lp-how-card-header">
              <div className="lp-how-label">For Brands</div>
              <h3 className="lp-how-card-title">List, match, and scale.</h3>
            </div>
            <div className="lp-steps">
              {BRAND_STEPS.map((step, i) => (
                <div key={step.id} className="lp-step">
                  <div className="lp-step-left">
                    <div className="lp-step-num">{step.id}</div>
                    {i < BRAND_STEPS.length - 1 && <div className="lp-step-line" />}
                  </div>
                  <p className="lp-step-text">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* For Owners */}
          <div className="lp-how-card lp-reveal lp-reveal-right">
            <div className="lp-how-card-header">
              <div className="lp-how-label lp-how-label-green">For Owners</div>
              <h3 className="lp-how-card-title">Browse, own, and operate.</h3>
            </div>
            <div className="lp-steps">
              {OWNER_STEPS.map((step, i) => (
                <div key={step.id} className="lp-step">
                  <div className="lp-step-left">
                    <div className="lp-step-num lp-step-num-green">{step.id}</div>
                    {i < OWNER_STEPS.length - 1 && <div className="lp-step-line lp-step-line-green" />}
                  </div>
                  <p className="lp-step-text">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default How;
