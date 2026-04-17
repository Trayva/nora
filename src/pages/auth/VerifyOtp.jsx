import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import { getDefaultRoute } from "../../utils/AuthHelpers";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";
import { useTheme } from "../../contexts/ThemeContext";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();

  // State passed from Register or wherever we were redirected from
  const email = state?.email || user?.email || "";
  const verificationType = state?.verificationType || "email";
  // nextRoute: set by Register after role-based registration
  const nextRoute =
    state?.nextRoute || (user ? getDefaultRoute(user) : "/app/kiosk-home");

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Start cooldown on mount (OTP was just sent by Register)
  useEffect(() => {
    startCooldown();
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (i, val) => {
    // Only allow digits
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
    // Focus last filled or last
    const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
    if (pasted.length === OTP_LENGTH) handleVerify(pasted);
  };

  const handleVerify = async (code) => {
    const otpCode = code || otp.join("");
    if (otpCode.length < OTP_LENGTH) return toast.error("Enter all 6 digits");
    setVerifying(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        email,
        otp: otpCode,
        type: verificationType,
      });
      // If the response returns updated user data, update the context
      const updatedUser = res.data?.data?.user;
      if (updatedUser) updateUser(updatedUser);

      toast.success("Email verified! ✓");
      navigate(nextRoute, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired code");
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await api.post("/auth/request-verification", { type: verificationType });
      toast.success("New code sent to your email");
      startCooldown();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const allFilled = otp.every((d) => d !== "");

  return (
    <div>
      <img
        src={theme === "dark" ? nora_logo_white : nora_logo_dark}
        alt="nora_logo"
        className="sidebar_logo mb-4"
      />
      <h3 className="profile_header">Check your email</h3>
      <p className="welcome_message">
        We sent a {OTP_LENGTH}-digit code to{" "}
        <strong style={{ color: "var(--text-heading)" }}>{email}</strong>. Enter
        it below to verify your account.
      </p>

      {/* OTP inputs */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 28,
          marginBottom: 8,
          justifyContent: "center",
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
              width: 46,
              height: 54,
              textAlign: "center",
              fontSize: "1.4rem",
              fontWeight: 800,
              fontFamily: "monospace",
              borderRadius: 12,
              border: `1.5px solid ${digit ? "var(--accent)" : "var(--border)"}`,
              background: digit ? "var(--bg-active)" : "var(--bg-hover)",
              color: "var(--text-heading)",
              outline: "none",
              transition: "border-color 0.15s, background 0.15s",
              caretColor: "var(--accent)",
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

      {/* Verify button */}
      <button
        disabled={verifying || !allFilled}
        onClick={() => handleVerify()}
        className={`app_btn app_btn_confirm${verifying ? " btn_loading" : ""}`}
        style={{
          width: "100%",
          marginTop: 20,
          position: "relative",
          height: 44,
        }}
      >
        <span className="btn_text">Verify Email</span>
        {verifying && (
          <span className="btn_loader" style={{ width: 16, height: 16 }} />
        )}
      </button>

      {/* Resend */}
      <p
        style={{ textAlign: "center", marginTop: 20, fontSize: "0.875rem" }}
        className="muted"
      >
        Didn't receive a code?{" "}
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          style={{
            background: "none",
            border: "none",
            cursor: cooldown > 0 ? "default" : "pointer",
            fontFamily: "inherit",
            fontSize: "inherit",
            fontWeight: 700,
            color: cooldown > 0 ? "var(--text-muted)" : "var(--accent)",
            padding: 0,
            transition: "color 0.15s",
          }}
        >
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : resending
              ? "Sending…"
              : "Resend code"}
        </button>
      </p>

      {/* Skip for now — in case user wants to explore first */}
      <p
        style={{ textAlign: "center", marginTop: 10, fontSize: "0.82rem" }}
        className="muted"
      >
        <button
          onClick={() => navigate(nextRoute, { replace: true })}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "inherit",
            color: "var(--text-muted)",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          Skip for now
        </button>
      </p>
    </div>
  );
}
