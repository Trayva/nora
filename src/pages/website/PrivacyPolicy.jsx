import React from "react";

export default function PrivacyPolicy() {
  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "120px 24px 60px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        color: "var(--text-body)",
        lineHeight: 1.8,
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: 800,
          color: "var(--text-heading)",
          marginBottom: 10,
          letterSpacing: "-0.03em",
        }}
      >
        Privacy Policy
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: 30 }}>
        Last Updated: June 3, 2026
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          fontSize: "0.95rem",
        }}
      >
        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 12 }}>
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us when registering an account, purchasing a kiosk,
            or renting food brand concepts. This includes your name, email address, physical address, business credentials,
            payment information, and digital signature records (including typed names, consent confirmations, IP addresses,
            and timestamps).
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 12 }}>
            2. How We Use Your Information
          </h2>
          <p>
            We use the information we collect to operate, maintain, and improve our services, including processing applications,
            generating invoices, tracking brand usage across kiosks, and verifying legally binding contract agreements.
            Your signature details are stored securely to provide verifiable proof of contract execution.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 12 }}>
            3. Information Sharing and Disclosure
          </h2>
          <p>
            We do not share your personal information with third parties except as necessary to provide our services
            (such as concept owners when you rent their menus, payment processors to settle invoices, or when required by law).
            All shared data is subject to strict confidentiality agreements.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 12 }}>
            4. Data Security
          </h2>
          <p>
            We implement high-grade administrative, technical, and physical security measures to protect your personal data,
            credentials, and agreement signature logs from unauthorized access, disclosure, alteration, or destruction.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 12 }}>
            5. Contact Us
          </h2>
          <p>
            If you have any questions or concerns regarding this Privacy Policy, please contact our privacy compliance officer at
            privacy@trynora.net.
          </p>
        </section>
      </div>
    </div>
  );
}
