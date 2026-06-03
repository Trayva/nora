import React from "react";

export default function TermsOfService() {
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
        Terms of Service
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
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or using the NORA AI platform, web application, kiosks, or services, you agree to be bound
            by these Terms of Service. If you do not agree to these terms, you must not access or use the platform.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 12 }}>
            2. Platform Registration and Accounts
          </h2>
          <p>
            You must register for an account to purchase kiosks, rent concept menus, or link operator wallets.
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that
            occur under your account.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 12 }}>
            3. E-Signatures and Binding Contracts
          </h2>
          <p>
            Certain transactions on NORA AI—such as kiosk purchases, concept rentals, and vendor brand assignments—require you to
            e-sign a contract. You acknowledge and agree that typing your full name, checking the consent confirmation,
            and clicking "Sign &amp; Submit" constitutes a valid, binding electronic signature equivalent to a handwritten signature.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 12 }}>
            4. Payments, Fees, and Invoices
          </h2>
          <p>
            All kiosk purchases and brand concept rentals generate invoices detailing payment schedules, due dates,
            and currencies. You agree to pay all generated invoices through our approved payment options in cleared funds.
            Failure to make payments when due may result in immediate suspension of your licenses, operations, or access.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 12 }}>
            5. Governing Law and Disputes
          </h2>
          <p>
            These Terms of Service and any contracts signed on the NORA AI platform shall be governed by and construed in
            accordance with the laws of the Federal Republic of Nigeria, without regard to conflict of law principles.
          </p>
        </section>
      </div>
    </div>
  );
}
