import React from "react";
import { useNavigate } from "react-router-dom";

function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="whoweare-section" style={{ backgroundColor: "var(--bg-main)" }}>
      <div className="whoweare-inner" style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        textAlign: "center",
        background: "linear-gradient(135deg, rgba(203, 108, 220, 0.1) 0%, rgba(203, 108, 220, 0.05) 100%)",
        padding: "80px 40px",
        borderRadius: "40px",
        border: "1px solid rgba(203, 108, 220, 0.2)"
      }}>
        <h2 className="whoweare-heading" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Ready to Scale or Own?</h2>
        <p className="whoweare-sub" style={{ marginBottom: "2.5rem", maxWidth: "600px" }}>
          Whether you're a food brand looking to expand or an individual ready to
          own a QSR outlet, Nora AI provides the platform to make it happen.
        </p>
        <div className="hero-btns" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            className="app_btn app_btn_confirm"
            style={{ height: 60, padding: "0 40px", fontSize: "1.1rem" }}
            onClick={() => navigate("/auth/register?role=VENDOR")}
          >
            Partner as a Brand
          </button>
          <button
            className="app_btn app_btn_cancel"
            style={{ height: 60, padding: "0 40px", fontSize: "1.1rem" }}
            onClick={() => navigate("/auth/register?role=CUSTOMER")}
          >
            Own a Franchise
          </button>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
