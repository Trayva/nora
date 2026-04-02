import React from "react";
import img from "../../assets/icart11.png"; // Placeholder or use a specific one if available

function BrandBenefits() {
  const benefits = [
    "Rapid market entry across multiple locations",
    "Standardized kiosk infrastructure",
    "Access to pre-qualified operators and investors",
    "Centralized control over menu, pricing, and operations",
    "Real-time performance monitoring via digital dashboard",
  ];

  return (
    <section className="whoweare-section" style={{ backgroundColor: "var(--bg-hover)" }}>
      <div className="whoweare-inner" style={{ flexDirection: "row-reverse" }}>
        {/* Right (Content) */}
        <div className="whoweare-left">
          <h2 className="whoweare-heading">For Food Brands</h2>
          <h3 className="whoweare-sub" style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
            Expand Faster. Without Heavy Capital Investment.
          </h3>
          <p className="whoweare-body">
            Nora AI enables food brands to scale into new markets without the
            constraints of traditional expansion.
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
            You focus on your brand. We handle the scale.
          </p>
        </div>

        {/* Left (Image) */}
        <div className="whoweare-right">
          <img src={img} alt="Food Brands" className="whoweare-img" />
        </div>
      </div>
    </section>
  );
}

export default BrandBenefits;
