import { useEffect, useRef } from "react";
import {
  MdOutlineBolt,
  MdOutlineDiamond,
  MdOutlineShield,
  MdOutlineLock,
  MdOutlineTrendingUp,
} from "react-icons/md";

const REASONS = [
  {
    icon: MdOutlineBolt,
    title: "Speed",
    description: "Launch multiple outlets in months, not years.",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  {
    icon: MdOutlineDiamond,
    title: "Efficiency",
    description: "Eliminate heavy capital expenditure on infrastructure.",
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.1)",
  },
  {
    icon: MdOutlineShield,
    title: "Control",
    description: "Maintain brand consistency across all locations.",
    color: "var(--accent)",
    bg: "var(--bg-active)",
  },
  {
    icon: MdOutlineLock,
    title: "Access",
    description: "Open up franchise ownership to a wider audience.",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.1)",
  },
  {
    icon: MdOutlineTrendingUp,
    title: "Scalability",
    description: "Build a distributed network of high-performing outlets.",
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.1)",
  },
];

function Why() {
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
    <section className="lp-section" id="why">
      <div className="lp-inner lp-block" ref={ref}>
        <div className="lp-section-header lp-reveal lp-reveal-up">
          <div className="lp-eyebrow">Advantages</div>
          <h2 className="lp-heading lp-heading-center">Why Nora AI</h2>
          <p className="lp-sub-center">
            The advantages of scaling through our franchise enablement platform
          </p>
        </div>

        <div className="lp-why-grid">
          {REASONS.map((r, i) => {
            const Icon = r.icon;
            return (
              <div
                key={r.title}
                className="lp-why-card lp-reveal lp-reveal-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="lp-why-icon-wrap" style={{ background: r.bg, color: r.color }}>
                  <Icon size={26} />
                </div>
                <h3 className="lp-why-title">{r.title}</h3>
                <p className="lp-why-desc">{r.description}</p>
                <div className="lp-why-bar" style={{ background: r.color }} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Why;
