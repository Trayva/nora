import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import api from "../../api/axios";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";
import { useTheme } from "../../contexts/ThemeContext";

const otpSchema = Yup.object().shape({
  otp: Yup.string()
    .length(6, "OTP must be exactly 6 digits")
    .required("OTP is required"),
});

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { email, verificationType = "email" } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", {
        otp: values.otp,
        type: verificationType,
      });
      toast.success("Verification successful!");
      navigate("/app");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/request-verification", { type: verificationType });
      toast.success("Verification code resent!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <img
        src={theme === "dark" ? nora_logo_white : nora_logo_dark}
        alt="nora_logo"
        className="sidebar_logo"
        style={{ marginBottom: 16 }}
      />
      <h2 className="profile_header">Verify Your Email</h2>
      <p className="welcome_message">
        We've sent a 6-digit code to{" "}
        <strong style={{ color: "var(--text-heading)" }}>{email}</strong>
      </p>

      <Formik
        initialValues={{ otp: "" }}
        validationSchema={otpSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, handleChange, handleBlur }) => (
          <Form style={{ marginTop: 24 }}>

            <div className="form-field">
              <label className="modal-label">6-digit verification code</label>
              <input
                className={`modal-input otp_input ${touched.otp && errors.otp ? "modal-input-error" : ""}`}
                type="text"
                name="otp"
                placeholder="• • • • • •"
                maxLength={6}
                value={values.otp}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
              {touched.otp && errors.otp && (
                <span className="login_field_error">{errors.otp}</span>
              )}
            </div>

            <button
              disabled={loading}
              type="submit"
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              style={{ width: "100%", marginTop: 20, position: "relative", height: 42 }}
            >
              <span className="btn_text">Verify Email</span>
              {loading && <span className="btn_loader" style={{ width: 18, height: 18 }} />}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className={`app_btn app_btn_logout ${resending ? "btn_loading" : ""}`}
                style={{ position: "relative", height: 38, padding: "0 16px" }}
              >
                <span className="btn_text">Resend Code</span>
                {resending && <span className="btn_loader" style={{ width: 16, height: 16, borderColor: "var(--accent)", borderTopColor: "transparent" }} />}
              </button>

              <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}>
                Back to{" "}
                <Link to="/auth/login" className="login_signup_link">
                  Sign in
                </Link>
              </p>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}