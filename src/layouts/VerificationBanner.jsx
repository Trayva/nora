import { useState } from "react";
import {
  MdOutlineClose,
  MdOutlineMarkEmailUnread,
  MdOutlinePhone,
} from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import { toast } from "react-toastify";
import Modal from "../components/Modal";

export default function VerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(null);

  // OTP modal state
  const [otpModal, setOtpModal] = useState(null); // { type: "email" | "phone" }
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  if (!user || dismissed) return null;

  const emailUnverified = !user.emailVerified;
  const phoneUnverified = !user.phoneVerified;

  if (!emailUnverified && !phoneUnverified) return null;

  const handleRequestCode = async (type) => {
    setSending(type);
    try {
      await api.post("/auth/request-verification", { type });
      toast.success(`Verification code sent to your ${type}!`);
      setOtp("");
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

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) return toast.error("Enter the 6-digit code");
    setVerifying(true);
    try {
      await api.post("/auth/verify-otp", { otp, type: otpModal.type });
      toast.success(
        `${otpModal.type === "email" ? "Email" : "Phone"} verified!`,
      );
      setOtpModal(null);
      setOtp("");
      // Refresh user so banner disappears
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const closeModal = () => {
    setOtpModal(null);
    setOtp("");
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
            <input
              className="modal-input otp_input"
              type="text"
              placeholder="• • • • • •"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
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
              onClick={handleVerify}
              disabled={verifying || otp.length !== 6}
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
