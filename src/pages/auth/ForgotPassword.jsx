import { useNavigate, Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useState } from "react";
import api from "../../api/axios";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";
import { useTheme } from "../../contexts/ThemeContext";

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Must be a valid email")
    .required("Email is required"),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: values.email });
      toast.success("Password reset link sent! Check your email.");
      navigate("/auth/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
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
      <h2 className="profile_header">Forgot Password</h2>
      <p className="welcome_message">
        Enter your email and we'll send you a password reset link
      </p>

      <Formik
        initialValues={{ email: "" }}
        validationSchema={forgotPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue, setFieldTouched }) => (
          <Form style={{ marginTop: 24 }}>
            <div className="form-field">
              <label className="modal-label">Email</label>
              <input
                className={`modal-input ${touched.email && errors.email ? "modal-input-error" : ""}`}
                type="email"
                name="email"
                placeholder="your@email.com"
                value={values.email}
                onChange={(e) => setFieldValue("email", e.target.value)}
                onBlur={() => setFieldTouched("email")}
              />
              {touched.email && errors.email && (
                <span className="login_field_error">{errors.email}</span>
              )}
            </div>

            <button
              disabled={loading}
              type="submit"
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              style={{
                width: "100%",
                marginTop: 8,
                position: "relative",
                height: 42,
              }}
            >
              <span className="btn_text">Send Reset Link</span>
              {loading && (
                <span
                  className="btn_loader"
                  style={{ width: 18, height: 18 }}
                />
              )}
            </button>

            <p
              className="muted"
              style={{
                marginTop: 24,
                textAlign: "center",
                fontSize: "0.875rem",
              }}
            >
              Remember your password?{" "}
              <Link to="/auth/login" className="login_signup_link">
                Sign in
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}
