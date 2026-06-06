import { useNavigate, Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useState } from "react";
import { MdLockOutline, MdArrowForward } from "react-icons/md";
import api from "../../api/axios";
import useQuery from "../../hooks/useQuery";

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Must be a valid email")
    .required("Email is required"),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const query = useQuery();
  const isAddingAccount = query.get("addAccount") === "true";
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: values.email });
      toast.success("Password reset link sent! Check your email.");
      navigate(`/auth/login${isAddingAccount ? "?addAccount=true" : ""}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-inner">
      {/* Icon */}
      <div className="forgot-icon-wrap">
        <MdLockOutline size={28} />
      </div>

      <div className="login-heading-group">
        <h2 className="login-title">Forgot Password?</h2>
        <p className="login-subtitle">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <Formik
        initialValues={{ email: "" }}
        validationSchema={forgotPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue, setFieldTouched }) => (
          <Form style={{ marginTop: 20 }}>
            <div className="form-field">
              <label className="modal-label">Email address</label>
              <input
                id="forgot-email"
                className={`modal-input ${touched.email && errors.email ? "modal-input-error" : ""}`}
                type="email"
                name="email"
                placeholder="you@company.com"
                value={values.email}
                onChange={(e) => setFieldValue("email", e.target.value)}
                onBlur={() => setFieldTouched("email")}
                autoFocus
              />
              {touched.email && errors.email && (
                <span className="login_field_error">{errors.email}</span>
              )}
            </div>

            <button
              id="forgot-submit"
              disabled={loading}
              type="submit"
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              style={{ width: "100%", marginTop: 8, position: "relative", height: 44 }}
            >
              <span className="btn_text" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Send Reset Link <MdArrowForward />
              </span>
              {loading && <span className="btn_loader" style={{ width: 18, height: 18 }} />}
            </button>

            <p className="muted" style={{ marginTop: 20, textAlign: "center", fontSize: "0.875rem" }}>
              Remember your password?{" "}
              <Link
                to={`/auth/login${isAddingAccount ? "?addAccount=true" : ""}`}
                className="login_signup_link"
              >
                Sign in
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}
