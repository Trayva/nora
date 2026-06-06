import { useEffect, useRef } from "react";
import {
  MdOutlineStorefront,
  MdOutlineShoppingBag,
  MdOutlinePeopleAlt,
  MdOutlineLocalShipping,
  MdOutlineDashboard,
  MdOutlineAutoAwesome,
} from "react-icons/md";

const PRODUCTS = [
  {
    icon: MdOutlineStorefront,
    title: "Modular QSR Kiosks",
    description: "Standardized, efficient, and designed for rapid deployment in any location.",
    color: "var(--accent)",
    bg: "var(--bg-active)",
  },
  {
    icon: MdOutlineShoppingBag,
    title: "Franchise Marketplace",
    description: "Where brands list franchise opportunities and operators discover them.",
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.1)",
  },
  {
    icon: MdOutlinePeopleAlt,
    title: "Operator Network",
    description: "A growing pool of trained individuals ready to run outlets at scale.",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.1)",
  },
  {
    icon: MdOutlineLocalShipping,
    title: "Supplier Marketplace",
    description: "Streamlined sourcing of raw materials for consistency and cost efficiency.",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  {
    icon: MdOutlineDashboard,
    title: "Digital Management Dashboard",
    description: "Centralized control for monitoring operations, sales, and performance.",
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.1)",
  },
  {
    icon: MdOutlineAutoAwesome,
    title: "Nora AI",
    description: "Our intelligence layer that assigns tasks, verifies execution, and drives insights.",
    color: "var(--accent)",
    bg: "var(--bg-active)",
    featured: true,
  },
];

function ProductEcosystem() {
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
    <section className="lp-section" id="solutions">
      <div className="lp-inner lp-block" ref={ref}>
        {/* Header */}
        <div className="lp-section-header lp-reveal lp-reveal-up">
          <div className="lp-eyebrow">Product Suite</div>
          <h2 className="lp-heading lp-heading-center">Our Product Ecosystem</h2>
          <p className="lp-sub-center">
            Everything you need to build, launch, and scale a QSR franchise network
          </p>
        </div>

        {/* Grid */}
        <div className="lp-product-grid">
          {PRODUCTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className={`lp-product-card lp-reveal lp-reveal-up ${p.featured ? "lp-product-card-featured" : ""}`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="lp-product-icon-wrap" style={{ background: p.bg, color: p.color }}>
                  <Icon size={22} />
                </div>
                <h3 className="lp-product-title">{p.title}</h3>
                <p className="lp-product-desc">{p.description}</p>
                {p.featured && <div className="lp-product-featured-tag">Core Intelligence</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ProductEcosystem;
