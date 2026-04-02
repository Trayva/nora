import React from "react";

const brandSteps = [
  { id: 1, text: "List your franchise on Nora AI" },
  { id: 2, text: "Define menu, pricing, and operational standards" },
  { id: 3, text: "Get matched with qualified Franchisee" },
  { id: 4, text: "Scale with our infrastructure" },
  { id: 5, text: "Monitor operations and complince seamlessly" },
];

const ownerSteps = [
  { id: 1, text: "Browse available food brands" },
  { id: 2, text: "Select and purchase a franchise" },
  { id: 3, text: "Deploy your kiosk in a target location" },
  { id: 4, text: "Operate digitally through our platform" },
  { id: 5, text: "Track performance and grow" },
];

function How() {
  return (
    <section className="whoweare-section" style={{ backgroundColor: "var(--bg-main)" }}>
      <div className="whoweare-inner" style={{ display: "block", padding: "60px 24px" }}>
        <h2 className="whoweare-heading" style={{ textAlign: "center", marginBottom: "3rem", fontSize: "clamp(1.8rem, 5vw, 2.5rem)" }}>How It Works</h2>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", 
          gap: "2rem" 
        }}>
          {/* For Brands */}
          <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "24px", border: "1px solid var(--border)" }}>
            <h3 style={{ color: "var(--accent)", fontSize: "1.3rem", marginBottom: "1.5rem" }}>For Brands</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {brandSteps.map((step) => (
                <div key={step.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "var(--bg-active)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    flexShrink: 0,
                    fontSize: "0.9rem"
                  }}>
                    {step.id}
                  </div>
                  <p style={{ color: "var(--text-body)", fontSize: "0.95rem", lineHeight: "1.4" }}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* For Owners */}
          <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "24px", border: "1px solid var(--border)" }}>
            <h3 style={{ color: "var(--accent)", fontSize: "1.3rem", marginBottom: "1.5rem" }}>For Owners</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {ownerSteps.map((step) => (
                <div key={step.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(203, 108, 220, 0.1)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    flexShrink: 0,
                    fontSize: "0.9rem"
                  }}>
                    {step.id}
                  </div>
                  <p style={{ color: "var(--text-body)", fontSize: "0.95rem", lineHeight: "1.4" }}>{step.text}</p>
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
