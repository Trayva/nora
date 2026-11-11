import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { createTicket, publicCreateTicket } from "../../api/ticketApi";
import { toast } from "react-toastify";

const REASONS = [
  "I no longer use NORA",
  "I have a duplicate account",
  "Privacy or data concerns",
  "Closing my business / franchise operations",
  "Other",
];

export default function DeleteAccount() {
  const { user, logoutAll } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [signOutDevices, setSignOutDevices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const canSubmit =
    email.trim().includes("@") &&
    (user ? true : fullName.trim().length >= 2) &&
    confirmText.trim().toUpperCase() === "DELETE";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    const subject = `Account Deletion Request — ${email.trim()}`;
    const description = [
      `Account Deletion Request submitted via /legal/delete-account`,
      `Full Name: ${fullName.trim() || user?.fullName || "N/A"}`,
      `Email: ${email.trim()}`,
      `Phone: ${phone.trim() || user?.phone || "N/A"}`,
      `Authenticated User ID: ${user?.id || "Unauthenticated Web Request"}`,
      `Reason: ${reason}`,
      details.trim() ? `Additional Notes: ${details.trim()}` : null,
      `Confirmation: User typed DELETE to confirm permanent account deletion.`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      let ticket = null;
      if (user) {
        ticket = await createTicket({
          subject,
          description,
          category: "GENERAL",
          priority: "HIGH",
        });
      } else {
        const res = await publicCreateTicket({
          name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject,
          description,
          category: "GENERAL",
          priority: "HIGH",
        });
        ticket = res?.data || { id: "Submitted" };
      }

      setSubmittedTicket(ticket || { id: "Submitted" });
      toast.success("Your account deletion request has been submitted.");

      if (user && signOutDevices && typeof logoutAll === "function") {
        setTimeout(() => {
          logoutAll();
        }, 2000);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Could not submit automatically. Please email privacy@trynora.net.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 840,
        margin: "0 auto",
        padding: "120px 24px 72px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        color: "var(--text-body)",
        lineHeight: 1.8,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 12px",
          borderRadius: 999,
          background: "rgba(239, 68, 68, 0.1)",
          color: "#dc2626",
          fontSize: "0.78rem",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        Account &amp; Data Privacy
      </div>

      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: 800,
          color: "var(--text-heading)",
          marginBottom: 10,
          letterSpacing: "-0.03em",
        }}
      >
        Delete Your NORA Account
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: 32 }}>
        Last Updated: June 3, 2026 · Applies to NORA AI Web &amp; Mobile Apps (Customer, Operator, Vendor, Supplier, and Rider accounts)
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          fontSize: "0.95rem",
        }}
      >
        <section>
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "var(--text-heading)",
              marginBottom: 12,
            }}
          >
            1. Overview
          </h2>
          <p>
            You can request the permanent deletion of your NORA AI account and associated personal data at any time.
            Deleting your account signs you out of all devices, revokes saved login sessions, and permanently removes or
            anonymizes your personal profile identifiers. This action is irreversible once completed.
          </p>
        </section>

        <section>
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "var(--text-heading)",
              marginBottom: 12,
            }}
          >
            2. How to Delete Your Account
          </h2>
          <p style={{ marginBottom: 12 }}>
            You can initiate account deletion using any of the following methods:
          </p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>
              <strong>In the NORA Mobile App (iOS &amp; Android):</strong> Open the app, go to{" "}
              <strong>More → Delete Account</strong> (or <strong>Profile → Security → Delete Account</strong>),
              review the data summary, type <code>DELETE</code>, and tap <strong>Submit Deletion Request</strong>.
            </li>
            <li>
              <strong>On the Web (Below):</strong> Complete the{" "}
              <strong>Account Deletion Request Form</strong> on this page using your registered email address.
            </li>
            <li>
              <strong>By Email:</strong> Send an email from your registered email address to{" "}
              <a href="mailto:privacy@trynora.net" style={{ color: "var(--accent)", fontWeight: 600 }}>
                privacy@trynora.net
              </a>{" "}
              or{" "}
              <a href="mailto:support@trynora.net" style={{ color: "var(--accent)", fontWeight: 600 }}>
                support@trynora.net
              </a>{" "}
              with the subject line <code>Account Deletion Request</code>.
            </li>
          </ul>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid var(--border, rgba(0,0,0,0.1))",
              background: "var(--bg-card, rgba(0,0,0,0.02))",
            }}
          >
            <h3
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--text-heading)",
                marginBottom: 10,
              }}
            >
              What Data Is Deleted
            </h3>
            <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Full name, email address, and phone number (anonymized)</li>
              <li>Profile photo and residential/contact address</li>
              <li>Active sessions, refresh tokens, and multi-account logins</li>
              <li>Push notification device tokens and preferences</li>
              <li>Unverified or pending KYC identity uploads</li>
            </ul>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: "1px solid var(--border, rgba(0,0,0,0.1))",
              background: "var(--bg-card, rgba(0,0,0,0.02))",
            }}
          >
            <h3
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--text-heading)",
                marginBottom: 10,
              }}
            >
              What Data Is Retained (Anonymized)
            </h3>
            <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Orders and supply records created for a kiosk or vendor business</li>
              <li>E-signed franchise, kiosk purchase, and concept rental agreements</li>
              <li>Financial invoices, wallet ledger entries, and tax audit trails</li>
              <li>Retained for up to 7 years strictly for legal, tax, and audit compliance</li>
            </ul>
          </div>
        </section>

        <section>
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "var(--text-heading)",
              marginBottom: 12,
            }}
          >
            3. Processing Timeline &amp; Prerequisites
          </h2>
          <p>
            Standard account deletion requests are processed within <strong>7 business days</strong> (and no later than{" "}
            <strong>30 days</strong> from verification). If your account has active kiosk hardware leases, open wallet
            settlements, or unpaid invoices, our compliance team will reach out to help settle or transfer those obligations
            before finalizing deletion.
          </p>
        </section>

        {/* Interactive Request Card */}
        <section
          style={{
            marginTop: 8,
            padding: 28,
            borderRadius: 20,
            border: "1px solid rgba(239, 68, 68, 0.28)",
            background: "var(--bg-card, #ffffff)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              marginBottom: 6,
            }}
          >
            Submit an Account Deletion Request
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 20 }}>
            {user
              ? `Signed in as ${user.fullName || user.email}. Submitting this form opens a priority deletion request for your account.`
              : "Enter the details associated with your NORA account below. We will verify ownership and process your deletion request."}
          </p>

          {submittedTicket ? (
            <div
              style={{
                padding: 20,
                borderRadius: 14,
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "var(--text-heading)",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>
                Deletion Request Received
              </h3>
              <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--text-body)" }}>
                Your request has been logged with our privacy compliance team (Reference:{" "}
                <code>{submittedTicket.id || "NORA-DEL"}</code>). A confirmation has been sent to{" "}
                <strong>{email}</strong>, and your account deletion will be completed within 7 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!user && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-heading)",
                      marginBottom: 6,
                    }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border, #d8d0c2)",
                      background: "var(--bg-main, #faf7f2)",
                      color: "var(--text-heading)",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-heading)",
                      marginBottom: 6,
                    }}
                  >
                    Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border, #d8d0c2)",
                      background: "var(--bg-main, #faf7f2)",
                      color: "var(--text-heading)",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-heading)",
                      marginBottom: 6,
                    }}
                  >
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border, #d8d0c2)",
                      background: "var(--bg-main, #faf7f2)",
                      color: "var(--text-heading)",
                      fontSize: "0.95rem",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--text-heading)",
                    marginBottom: 6,
                  }}
                >
                  Reason for Deleting Account
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border, #d8d0c2)",
                    background: "var(--bg-main, #faf7f2)",
                    color: "var(--text-heading)",
                    fontSize: "0.95rem",
                  }}
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--text-heading)",
                    marginBottom: 6,
                  }}
                >
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Any context for our support or compliance team..."
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border, #d8d0c2)",
                    background: "var(--bg-main, #faf7f2)",
                    color: "var(--text-heading)",
                    fontSize: "0.95rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--text-heading)",
                    marginBottom: 6,
                  }}
                >
                  Type <code>DELETE</code> to confirm permanent account deletion *
                </label>
                <input
                  type="text"
                  required
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    background: "var(--bg-main, #faf7f2)",
                    color: "var(--text-heading)",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                  }}
                />
              </div>

              {user && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: "0.88rem",
                    color: "var(--text-body)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={signOutDevices}
                    onChange={(e) => setSignOutDevices(e.target.checked)}
                  />
                  Immediately sign me out of all devices after submitting this request
                </label>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  style={{
                    padding: "12px 22px",
                    borderRadius: 999,
                    border: "none",
                    background: canSubmit ? "#dc2626" : "rgba(220, 38, 38, 0.35)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
                  }}
                >
                  {submitting ? "Submitting Request..." : "Permanently Delete My Account"}
                </button>

                <a
                  href={`mailto:privacy@trynora.net?subject=${encodeURIComponent(
                    "Account Deletion Request",
                  )}&body=${encodeURIComponent(
                    `Please delete my NORA account.\n\nRegistered Email: ${email}\nPhone: ${phone}\nReason: ${reason}`,
                  )}`}
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--text-muted)",
                    textDecoration: "underline",
                  }}
                >
                  Or email privacy@trynora.net directly
                </a>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

