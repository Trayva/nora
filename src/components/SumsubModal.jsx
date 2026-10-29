import { useState, useEffect, useCallback } from "react";
import SumsubWebSdk from "@sumsub/websdk-react";
import { MdClose, MdSecurity, MdCheckCircle } from "react-icons/md";
import { getSumsubAccessToken, getSumsubKycStatus } from "../api/kyc";
import { toast } from "react-toastify";
import ButtonLoader from "./ButtonLoader";
import "./Modal.css";

/**
 * Sumsub KYC Verification Modal
 * Supports: 'phone', 'level-2', 'level-3'
 */
export default function SumsubModal({
  isOpen,
  onClose,
  level = "level-2",
  user = {},
  onSuccess,
}) {
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const levelTitles = {
    phone: "Phone Number Verification",
    "level-2": "Level 2: Identity Verification",
    "level-3": "Level 3: Address Verification",
  };

  const levelDescriptions = {
    phone: "Verify your phone number quickly and securely via Sumsub.",
    "level-2": "Verify your identity using an official government ID & quick face scan.",
    "level-3": "Verify your residential address with a utility bill or bank statement.",
  };

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSumsubAccessToken(level);
      const token = res?.data?.token || res?.token;
      if (!token) {
        throw new Error(res?.message || "Failed to retrieve access token");
      }
      setAccessToken(token);
    } catch (err) {
      console.error("Sumsub token error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not initialize Sumsub verification";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    if (isOpen) {
      setIsCompleted(false);
      fetchToken();
    } else {
      setAccessToken(null);
      setError(null);
      setIsCompleted(false);
    }
  }, [isOpen, fetchToken]);

  // Prevent background scrolling while modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleExpiration = async () => {
    try {
      const res = await getSumsubAccessToken(level);
      return res?.data?.token || res?.token;
    } catch (err) {
      console.error("Token expiration renewal failed", err);
      return "";
    }
  };

  const handleMessage = async (type, payload) => {
    console.log("Sumsub WebSDK Event:", type, payload);

    if (
      type === "idCheck.onApplicantSubmitted" ||
      type === "idCheck.onStepCompleted" ||
      type === "idCheck.applicantStatus"
    ) {
      // If status changed or submitted, sync with our backend
      try {
        await getSumsubKycStatus();
      } catch (e) {
        console.warn("Status sync background call failed", e);
      }

      if (
        type === "idCheck.onApplicantSubmitted" ||
        payload?.reviewStatus === "completed" ||
        payload?.reviewResult?.reviewAnswer === "GREEN"
      ) {
        setIsCompleted(true);
        toast.success("Verification successfully submitted!");
        if (onSuccess) {
          onSuccess(payload);
        }
      }
    }
  };

  const handleError = (errorPayload) => {
    console.error("Sumsub WebSDK Error:", errorPayload);
    toast.error("Verification session error. Please try again.");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-glass"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "760px",
          width: "95%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: "1.25rem 1.5rem",
          borderRadius: 24,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            marginBottom: "0.75rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(99, 102, 241, 0.12)",
                color: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MdSecurity size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: "1.05rem", margin: 0 }}>
                {levelTitles[level] || "KYC Verification"}
              </h3>
              <p
                className="modal-description"
                style={{ fontSize: "0.78rem", margin: "2px 0 0", color: "var(--text-muted)" }}
              >
                {levelDescriptions[level] || "Secure identity verification powered by Sumsub."}
              </p>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            style={{ padding: 6, borderRadius: 8, cursor: "pointer" }}
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Content Container */}
        <div
          style={{
            flex: 1,
            minHeight: "520px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            borderRadius: 16,
            background: "var(--bg-card, #ffffff)",
          }}
        >
          {loading && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "3rem",
              }}
            >
              <ButtonLoader color="var(--accent, #6366f1)" />
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Initializing secure Sumsub verification session...
              </p>
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                padding: "2.5rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: "0.88rem",
                  maxWidth: "460px",
                }}
              >
                {error}
              </div>
              <button
                className="app_btn app_btn_confirm"
                onClick={fetchToken}
                style={{ padding: "8px 20px", fontSize: "0.84rem" }}
              >
                Retry Initialization
              </button>
            </div>
          )}

          {isCompleted && (
            <div
              style={{
                padding: "10px 16px",
                background: "rgba(34, 197, 94, 0.1)",
                color: "#16a34a",
                borderRadius: 8,
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                margin: "8px 12px",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                <MdCheckCircle size={16} /> Submission received. Compliance review in progress.
              </span>
              <button
                onClick={() => {
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}

          {accessToken && !loading && !error && (
            <SumsubWebSdk
              accessToken={accessToken}
              expirationHandler={handleExpiration}
              config={{
                lang: "en",
                email: user?.email,
                phone: user?.phone,
                theme: document.body.classList.contains("dark") ? "dark" : "light",
              }}
              options={{
                addViewportTag: false,
                adaptIframeHeight: true,
              }}
              onMessage={handleMessage}
              onError={handleError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
