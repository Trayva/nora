import React, { useState, useEffect } from "react";
import Drawer from "./Drawer";
import { MdEdit, MdCheck } from "react-icons/md";
import { toast } from "react-toastify";

export default function ESignDrawer({
  isOpen,
  onClose,
  title = "E-Sign Agreement",
  description = "Please review and e-sign this agreement to complete your request.",
  templateText = "",
  variables = {},
  onSubmit,
  submitting = false,
}) {
  const [signedName, setSignedName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [parsedText, setParsedText] = useState("");

  // Helper to compile/replace template variables
  useEffect(() => {
    if (!templateText) {
      setParsedText("");
      return;
    }

    const today = new Date();
    const defaultVars = {
      date: today.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      day: today.getDate().toString(),
      month: today.toLocaleDateString("en-GB", { month: "long" }),
      year: today.getFullYear().toString(),
      specification_table: `
        <table style="width:100%; border-collapse:collapse; margin:14px 0; border:1px solid var(--border);">
          <thead>
            <tr style="background:var(--bg-hover);">
              <th style="border:1px solid var(--border); padding:8px; text-align:left; font-size:0.75rem;">Specification</th>
              <th style="border:1px solid var(--border); padding:8px; text-align:left; font-size:0.75rem;">Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:1px solid var(--border); padding:8px; font-size:0.75rem; font-weight:600;">Kiosk Type</td>
              <td style="border:1px solid var(--border); padding:8px; font-size:0.75rem;">Bigger Kiosk : Modular QSR Unit</td>
            </tr>
            <tr>
              <td style="border:1px solid var(--border); padding:8px; font-size:0.75rem; font-weight:600;">Kitchen Floor Area</td>
              <td style="border:1px solid var(--border); padding:8px; font-size:0.75rem;">13.5 ft &times; 5 ft</td>
            </tr>
            <tr>
              <td style="border:1px solid var(--border); padding:8px; font-size:0.75rem; font-weight:600;">Air Conditioning</td>
              <td style="border:1px solid var(--border); padding:8px; font-size:0.75rem;">1.5HP Hisense Air Conditioner</td>
            </tr>
            <tr>
              <td style="border:1px solid var(--border); padding:8px; font-size:0.75rem; font-weight:600;">Refrigeration</td>
              <td style="border:1px solid var(--border); padding:8px; font-size:0.75rem;">Hisense Double Door Refrigerator</td>
            </tr>
          </tbody>
        </table>
      `,
      ...variables,
    };

    let text = templateText;
    Object.entries(defaultVars).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      text = text.replace(regex, val || "___________");
    });

    setParsedText(text);
  }, [templateText, variables]);

  const handleSign = () => {
    if (!signedName.trim()) {
      toast.error("Please type your full name to e-sign");
      return;
    }
    if (!consentChecked) {
      toast.error("Please check the consent box to accept the agreement");
      return;
    }
    onSubmit({
      signatureName: signedName.trim(),
      terms: parsedText,
      isSigned: true,
    });
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title} description={description} width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
        {/* Document Viewer (Paper style) */}
        <div
          style={{
            flex: 1,
            maxHeight: "450px",
            overflowY: "auto",
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--bg-card)",
            padding: "24px 20px",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          {parsedText ? (
            <div
              className="rich-text-content"
              style={{
                fontSize: "0.82rem",
                lineHeight: 1.7,
                color: "var(--text-body)",
                fontFamily: "var(--font-body), Georgia, serif",
              }}
              dangerouslySetInnerHTML={{ __html: parsedText }}
            />
          ) : (
            <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.8rem" }}>
              Loading agreement text...
            </span>
          )}
        </div>

        {/* E-Signature Box */}
        <div
          style={{
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <MdEdit size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Electronic Signature Pad
            </span>
          </div>

          {/* Cursive Signature Preview */}
          <div
            style={{
              height: 70,
              borderRadius: 8,
              border: "1px dashed var(--border)",
              background: "var(--bg-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {signedName.trim() ? (
              <span
                style={{
                  fontFamily: "'Caveat', 'Brush Script MT', cursive, Georgia",
                  fontSize: "2.2rem",
                  color: "var(--accent)",
                  transform: "rotate(-2deg)",
                  letterSpacing: "0.05em",
                }}
              >
                {signedName}
              </span>
            ) : (
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                Your signature preview will appear here as you type
              </span>
            )}
            <span
              style={{
                position: "absolute",
                bottom: 4,
                right: 8,
                fontSize: "0.58rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Signer Preview
            </span>
          </div>

          {/* Name Input */}
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="modal-label" style={{ fontSize: "0.7rem" }}>Type your full name to sign *</label>
            <input
              className="modal-input"
              style={{ height: 38 }}
              placeholder="e.g. John Doe"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Consent Checkbox */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setConsentChecked(!consentChecked)}
              disabled={submitting}
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                border: `2px solid ${consentChecked ? "var(--accent)" : "var(--border)"}`,
                background: consentChecked ? "var(--accent)" : "transparent",
                flexShrink: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
              }}
            >
              {consentChecked && <MdCheck size={12} color="white" />}
            </button>
            <span style={{ fontSize: "0.74rem", color: "var(--text-body)", lineHeight: 1.4 }}>
              I agree that typing my name and clicking "Sign &amp; Submit" constitutes my legally binding e-signature on this agreement.
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            className="app_btn app_btn_cancel"
            style={{ flex: 1, height: 40 }}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className={`app_btn app_btn_confirm ${submitting ? "btn_loading" : ""}`}
            style={{ flex: 2, height: 40, position: "relative" }}
            onClick={handleSign}
            disabled={submitting || !signedName.trim() || !consentChecked}
          >
            <span className="btn_text">Sign &amp; Submit</span>
            {submitting && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
