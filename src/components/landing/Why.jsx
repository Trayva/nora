import React from "react";

const reasons = [
  {
    title: "Speed",
    description: "Launch multiple outlets in months, not years.",
    icon: "⚡",
  },
  {
    title: "Efficiency",
    description: "Eliminate heavy capital expenditure on infrastructure.",
    icon: "💎",
  },
  {
    title: "Control",
    description: "Maintain brand consistency across all locations.",
    icon: "🎮",
  },
  {
    title: "Access",
    description: "Open up franchise ownership to a wider audience.",
    icon: "🔓",
  },
  {
    title: "Scalability",
    description: "Build a distributed network of high-performing outlets.",
    icon: "🚀",
  },
];

function Why() {
  return (
    <section className="whoweare-section" style={{ backgroundColor: "var(--bg-hover)" }}>
      <div className="whoweare-inner" style={{ display: "block", textAlign: "center" }}>
        <h2 className="whoweare-heading" style={{ marginBottom: "1rem" }}>Why Nora AI</h2>
        <p className="whoweare-sub" style={{ margin: "0 auto 4rem auto", maxWidth: "700px" }}>
          The advantages of scaling through our franchise enablement platform
        </p>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "1.5rem" 
        }}>
          {reasons.map((reason, idx) => (
            <div key={idx} style={{ 
              padding: "2rem", 
              borderRadius: "20px", 
              background: "var(--bg-card)", 
              border: "1px solid var(--border)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem"
            }}>
              <div style={{ 
                fontSize: "2.5rem",
                marginBottom: "0.5rem"
              }}>
                {reason.icon}
              </div>
              <h3 style={{ color: "var(--text-heading)", fontSize: "1.2rem", fontWeight: "700" }}>{reason.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.5" }}>{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Why;
