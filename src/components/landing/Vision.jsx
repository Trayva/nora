import { useEffect, useRef } from "react";

function Vision() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // ref is on the <section>, so .lp-visible .lp-reveal correctly targets children
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("lp-visible"); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="lp-vision-section" ref={ref}>
      <div className="lp-vision-orb lp-vision-orb-l" />
      <div className="lp-vision-orb lp-vision-orb-r" />

      <div className="lp-vision-inner lp-reveal lp-reveal-up">
        <div className="lp-eyebrow lp-eyebrow-center">Our Vision</div>
        <h2 className="lp-vision-heading">
          To build the leading infrastructure that enables food brands to{" "}
          <span className="lp-vision-highlight">scale at speed</span>, empowers a new
          generation of owners, and{" "}
          <span className="lp-vision-highlight">automates operations</span> across the
          QSR ecosystem.
        </h2>
        <div className="lp-vision-rule" />
      </div>
    </section>
  );
}

export default Vision;
