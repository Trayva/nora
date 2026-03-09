import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineClose,
  MdOutlineMarkEmailUnread,
  MdOutlinePhone,
} from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function VerificationBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(null);

  if (!user || dismissed) return null;

  const emailUnverified = !user.emailVerified;
  const phoneUnverified = !user.phoneVerified;

  if (!emailUnverified && !phoneUnverified) return null;

  const handleResend = async (type) => {
    setSending(type);
    try {
      await api.post("/auth/request-verification", { type });
      toast.success(`Verification code sent to your ${type}!`);
      navigate("/auth/verify-otp", {
        state: { email: user.email, verificationType: type },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send code");
    } finally {
      setSending(null);
    }
  };

  return (
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
                onClick={() => handleResend("email")}
                disabled={sending === "email"}
              >
                {sending === "email" ? "Sending..." : "Verify"}
              </button>
            </div>
          )}
          {phoneUnverified && (
            <div className="verification_banner_item">
              <MdOutlinePhone size={16} className="verification_banner_icon" />
              <span className="verification_banner_text">
                Phone is not verified
              </span>
              <button
                className="verification_banner_btn"
                onClick={() => handleResend("phone")}
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
  );
}
