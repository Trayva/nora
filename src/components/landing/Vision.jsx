import React from "react";

function Vision() {
  return (
    <section className="vision-section" style={{ 
      padding: "100px 24px", 
      backgroundColor: "var(--bg-main)",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)"
    }}>
      <div className="vision-inner" style={{ 
        maxWidth: "1000px", 
        margin: "0 auto", 
        textAlign: "center" 
      }}>
        <div style={{
          display: "inline-block",
          padding: "8px 16px",
          borderRadius: "999px",
          background: "var(--bg-active)",
          color: "var(--accent)",
          fontSize: "0.85rem",
          fontWeight: "700",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: "2.5rem"
        }}>
          Our Vision
        </div>
        <h2 style={{
          fontSize: "clamp(1.5rem, 4vw, 2.8rem)",
          lineHeight: "1.3",
          fontWeight: "800",
          color: "var(--text-heading)",
          letterSpacing: "-0.02em",
          margin: "0 auto"
        }}>
          To build the leading infrastructure that enables food brands to scale at speed, empowers a new generation of owners, and automates operations across the QSR ecosystem.
        </h2>
      </div>
    </section>
  );
}

export default Vision;
