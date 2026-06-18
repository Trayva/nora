import { useState, useEffect, useRef } from "react";
import {
  MdOutlineClose,
  MdOutlineMarkEmailUnread,
  MdOutlinePhone,
} from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import { toast } from "react-toastify";
import Modal from "../components/Modal";

const OTP_LENGTH = 6;

export default function VerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(null);

  // OTP modal state
  const [otpModal, setOtpModal] = useState(null); // { type: "email" | "phone" }
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (otpModal) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    }
  }, [otpModal]);

  if (!user || dismissed) return null;

  const emailUnverified = !user.emailVerified;
  const phoneUnverified = !user.phoneVerified;

  if (!emailUnverified && !phoneUnverified) return null;

  const handleRequestCode = async (type) => {
    setSending(type);
    try {
      await api.post("/auth/request-verification", { type });
      toast.success(`Verification code sent to your ${type}!`);
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpModal({ type });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send code");
    } finally {
      setSending(null);
    }
  };

  const handleResendCode = async () => {
    if (!otpModal) return;
    setResending(true);
    try {
      await api.post("/auth/request-verification", { type: otpModal.type });
      toast.success("Code resent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (code) => {
    const otpCode = code || otp.join("");
    if (otpCode.length !== OTP_LENGTH) return toast.error("Enter the 6-digit code");
    setVerifying(true);
    try {
      await api.post("/auth/verify-otp", { otp: otpCode, type: otpModal.type });
      toast.success(
        `${otpModal.type === "email" ? "Email" : "Phone"} verified!`,
      );
      setOtpModal(null);
      setOtp(Array(OTP_LENGTH).fill(""));
      // Refresh user so banner disappears
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (i, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    // Move focus forward
    if (digit && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
    // Auto-submit when all filled
    if (digit && i === OTP_LENGTH - 1 && next.every((d) => d)) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (otp[i]) {
        const next = [...otp];
        next[i] = "";
        setOtp(next);
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1)
      inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => {
      next[i] = d;
    });
    setOtp(next);
    const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
    if (pasted.length === OTP_LENGTH) handleVerify(pasted);
  };

  const closeModal = () => {
    setOtpModal(null);
    setOtp(Array(OTP_LENGTH).fill(""));
  };

  return (
    <>
      <div className="verification_banner">
        <div className="verification_banner_inner">
          <div className="verification_banner_items">
            {emailUnverified && (
              <div className="verification_banner_item">
                <MdOutlineMarkEmailUnread
                  size={16}
                  className="verification_banner_icon"
                />
                <span className="verification_banner_text">
                  Email is not verified
                </span>
                <button
                  className="verification_banner_btn"
                  onClick={() => handleRequestCode("email")}
                  disabled={sending === "email"}
                >
                  {sending === "email" ? "Sending..." : "Verify"}
                </button>
              </div>
            )}
            {phoneUnverified && (
              <div className="verification_banner_item">
                <MdOutlinePhone
                  size={16}
                  className="verification_banner_icon"
                />
                <span className="verification_banner_text">
                  Phone is not verified
                </span>
                <button
                  className="verification_banner_btn"
                  onClick={() => handleRequestCode("phone")}
                  disabled={sending === "phone"}
                >
                  {sending === "phone" ? "Sending..." : "Verify"}
                </button>
              </div>
            )}
          </div>
          <button
            className="verification_banner_close"
            onClick={() => setDismissed(true)}
            title="Dismiss"
          >
            <MdOutlineClose size={16} />
          </button>
        </div>
      </div>

      {/* OTP Modal */}
      <Modal
        isOpen={!!otpModal}
        onClose={closeModal}
        title={`Verify ${otpModal?.type === "email" ? "Email" : "Phone"}`}
        description={
          otpModal?.type === "email"
            ? `Enter the 6-digit code sent to ${user.email}`
            : `Enter the 6-digit code sent to your phone`
        }
      >
        <div className="modal-body">
          <div className="form-field">
            <label className="modal-label">6-digit verification code</label>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 14,
                marginBottom: 8,
                justifyContent: "center",
                width: "100%",
              }}
              onPaste={handlePaste}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={{
                    flex: "1 1 40px",
                    minWidth: 32,
                    maxWidth: 54,
                    height: 48,
                    textAlign: "center",
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    borderRadius: 10,
                    border: `1.5px solid ${
                      digit ? "var(--accent)" : "var(--border)"
                    }`,
                    background: digit ? "var(--bg-active)" : "var(--bg-hover)",
                    color: "var(--text-heading)",
                    outline: "none",
                    transition: "border-color 0.15s, background 0.15s",
                    caretColor: "var(--accent)",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(203,108,220,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = digit
                      ? "var(--accent)"
                      : "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className={`app_btn app_btn_logout ${resending ? "btn_loading" : ""}`}
              onClick={handleResendCode}
              disabled={resending}
              style={{ position: "relative", minWidth: 110 }}
            >
              <span className="btn_text">Resend Code</span>
              {resending && (
                <span
                  className="btn_loader"
                  style={{
                    width: 14,
                    height: 14,
                    borderColor: "var(--accent)",
                    borderTopColor: "transparent",
                  }}
                />
              )}
            </button>
            <button
              type="button"
              className={`app_btn app_btn_confirm ${verifying ? "btn_loading" : ""}`}
              onClick={() => handleVerify()}
              disabled={verifying || otp.some((d) => !d)}
              style={{ position: "relative", minWidth: 120 }}
            >
              <span className="btn_text">Verify</span>
              {verifying && (
                <span
                  className="btn_loader"
                  style={{ width: 16, height: 16 }}
                />
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
