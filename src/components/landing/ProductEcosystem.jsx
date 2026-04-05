import React from "react";

function ProductEcosystem() {
  const products = [
    {
      id: 1,
      title: "Modular QSR Kiosks",
      description: "Standardized, efficient, and designed for rapid deployment.",
    },
    {
      id: 2,
      title: "Franchise Marketplace",
      description: "A platform where brands list franchise opportunities and operators discover them.",
    },
    {
      id: 3,
      title: "Operator Network",
      description: "A growing pool of trained individuals ready to run outlets.",
    },
    {
      id: 4,
      title: "Supplier Marketplace",
      description: "Streamlined sourcing of raw materials to ensure consistency and cost efficiency.",
    },
    {
      id: 5,
      title: "Digital Management Dashboard",
      description: "Centralized control for monitoring operations, sales, and performance.",
    },
    {
      id: 6,
      title: "Nora AI",
      description: "Our intelligence layer that assigns tasks, verifies execution, and provides actionable insights.",
    },
  ];

  return (
    <section className="whoweare-section" style={{ padding: "100px 0" }}>
      <div className="whoweare-inner" style={{ display: "block", textAlign: "center" }}>
        <h2 className="whoweare-heading" style={{ marginBottom: "1rem" }}>Our Product Ecosystem</h2>
        <p className="whoweare-sub" style={{ margin: "0 auto 4rem auto", maxWidth: "700px" }}>
          Everything you need to run a scalable QSR network
        </p>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "2rem",
          marginTop: "2rem"
        }}>
          {products.map((product) => (
            <div key={product.id} style={{ 
              padding: "2rem", 
              borderRadius: "18px", 
              background: "var(--bg-card)", 
              border: "1px solid var(--border)",
              textAlign: "left",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "10px", 
                background: "var(--bg-active)", 
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                marginBottom: "1.5rem"
              }}>
                {product.id}
              </div>
              <h3 style={{ color: "var(--text-heading)", marginBottom: "1rem", fontSize: "1.2rem" }}>{product.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.6" }}>{product.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProductEcosystem;
