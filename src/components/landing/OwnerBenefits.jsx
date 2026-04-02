import React from "react";
import img from "../../assets/who.png"; // Placeholder or use a specific one if available

function OwnerBenefits() {
  const benefits = [
    "Access to established food brands",
    "Ready-to-deploy modular sized kiosks",
    "Integrated supply chain and logistics",
    "Digital tools to manage daily operations",
    "Performance insights powered by AI",
    "No prior experience required — just the ambition to build",
  ];

  return (
    <section className="whoweare-section">
      <div className="whoweare-inner">
        {/* Left (Content) */}
        <div className="whoweare-left">
          <h2 className="whoweare-heading">For Franchise Owners</h2>
          <h3 className="whoweare-sub" style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
            Own a Food Business. Operate from Your Phone.
          </h3>
          <p className="whoweare-body">
            Nora AI makes it possible to own and run a QSR outlet without
            starting from scratch.
          </p>
          <div style={{ margin: "2rem 0" }}>
            <h4 style={{ color: "var(--text-heading)", marginBottom: "1rem" }}>What You Get:</h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {benefits.map((benefit, index) => (
                <li key={index} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "0.8rem",
                  color: "var(--text-body)",
                  fontSize: "0.95rem"
                }}>
                  <span style={{ color: "var(--accent)", fontWeight: "bold" }}>✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <p className="whoweare-body" style={{ fontWeight: "600", color: "var(--accent)" }}>
            No prior experience required — just the ambition to build.
          </p>
        </div>

        {/* Right (Image) */}
        <div className="whoweare-right">
          <img src={img} alt="Franchise Owners" className="whoweare-img" />
        </div>
      </div>
    </section>
  );
}

export default OwnerBenefits;
