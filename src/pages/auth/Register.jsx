import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { MdArrowForward } from "react-icons/md";
import { FaApple } from "react-icons/fa";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import useQuery from "../../hooks/useQuery";
import { roleParamToRoles, getDefaultRoute } from "../../utils/AuthHelpers";

const registerSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(3, "Full name must be at least 3 characters")
    .required("Full name is required"),
  email: Yup.string()
    .email("Must be a valid email")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  phone: Yup.string()
    .min(7, "Phone number is too short")
    .required("Phone number is required"),
});

export default function Register() {
  const navigate = useNavigate();
  const query = useQuery();
  const roleParam = query.get("role");
  const isAddingAccount = query.get("addAccount") === "true";
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── google-signup callback ───────────────────────────────────────────────
  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      const assignedRoles = roleParamToRoles(roleParam);
      const primaryRole =
        assignedRoles && assignedRoles.length > 0
          ? assignedRoles[0]
          : "CUSTOMER";

      const res = await api.post("/auth/google-login", {
        idToken: response.credential,
        role: primaryRole,
      });
      const { accessToken, refreshToken, user } = res.data.data;
      login(user, accessToken, refreshToken);
      toast.success("Welcome to Nora 🎉");
      navigate(getDefaultRoute(user));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Google authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── apple-signup callback ──────────────────────────────────────────────────
  const handleAppleLogin = async () => {
    if (!window.AppleID) {
      toast.error("Apple Sign-In is loading, please try again.");
      return;
    }
    setLoading(true);
    try {
      const assignedRoles = roleParamToRoles(roleParam);
      const primaryRole =
        assignedRoles && assignedRoles.length > 0
          ? assignedRoles[0]
          : "CUSTOMER";

      const data = await window.AppleID.auth.signIn();
      const idToken = data.authorization.id_token;

      let fullName = undefined;
      if (data.user && data.user.name) {
        const { firstName, lastName } = data.user.name;
        fullName = [firstName, lastName].filter(Boolean).join(" ");
      }

      const res = await api.post("/auth/apple-login", {
        idToken,
        fullName,
        role: primaryRole,
      });
      const { accessToken, refreshToken, user } = res.data.data;
      login(user, accessToken, refreshToken);
      toast.success("Welcome to Nora 🎉");
      navigate(getDefaultRoute(user));
    } catch (error) {
      if (error?.error === "popup_closed_by_user") {
        return;
      }
      toast.error(
        error.response?.data?.message || "Apple authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeApple = () => {
      if (window.AppleID) {
        try {
          window.AppleID.auth.init({
            clientId:
              import.meta.env.VITE_APPLE_CLIENT_ID || "your-apple-service-id",
            scope: "name email",
            redirectURI:
              import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin,
            state: "origin:web",
            usePopup: true,
          });
        } catch (err) {
          console.error("Apple ID initialization failed:", err);
        }
      }
    };

    initializeApple();
    const timer = setTimeout(initializeApple, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    /* global google */
    if (window.google) {
      const initializeGoogle = () => {
        window.google.accounts.id.initialize({
          client_id:
            import.meta.env.VITE_GOOGLE_CLIENT_ID ||
            "your-google-client-id.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signup-btn"),
          {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signup_with",
            shape: "rectangular",
          }
        );
      };

      const timer = setTimeout(initializeGoogle, 100);
      return () => clearTimeout(timer);
    }
  }, [roleParam]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await api.post("/auth/register", {
        ...values,
        phone: `+${values.phone}`,
        roles: roleParamToRoles(roleParam),
      });

      const loginResponse = await api.post("/auth/login", {
        email: values.email,
        password: values.password,
      });

      const { accessToken, refreshToken, user } = loginResponse.data.data;
      login(user, accessToken, refreshToken);

      api
        .post(
          "/auth/request-verification",
          { type: "email" },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        .catch(() => {});

      toast.success("Account created! Welcome to Nora 🎉");

      navigate("/auth/verify-otp", {
        state: {
          email: values.email,
          verificationType: "email",
          nextRoute: getDefaultRoute(user),
        },
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const roleLabel =
    {
      vendor: "as a Vendor",
      supplier: "as a Supplier",
      operator: "as an Operator",
    }[roleParam?.toLowerCase()] || "";

  return (
    <div className="login-page-inner">
      <div className="login-heading-group">
        <h2 className="login-title">Get Started {roleLabel}</h2>
        <p className="login-subtitle">
          Your all-in-one ecosystem for quick restaurant expansion.
        </p>
      </div>

      <Formik
        initialValues={{ fullName: "", email: "", password: "", phone: "" }}
        validationSchema={registerSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue, setFieldTouched }) => (
          <Form style={{ marginTop: 20 }}>
            {/* Full Name */}
            <div className="form-field">
              <label className="modal-label">Full Name</label>
              <input
                id="register-fullname"
                className={`modal-input ${
                  touched.fullName && errors.fullName ? "modal-input-error" : ""
                }`}
                type="text"
                name="fullName"
                placeholder="Yasir Hassan"
                value={values.fullName}
                onChange={(e) => setFieldValue("fullName", e.target.value)}
                onBlur={() => setFieldTouched("fullName")}
              />
              {touched.fullName && errors.fullName && (
                <span className="login_field_error">{errors.fullName}</span>
              )}
            </div>

            {/* Email + Phone row */}
            <div className="register_row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="modal-label">Email</label>
                <input
                  id="register-email"
                  className={`modal-input ${
                    touched.email && errors.email ? "modal-input-error" : ""
                  }`}
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

              <div className="form-field" style={{ flex: 1 }}>
                <label className="modal-label">Phone Number</label>
                <div
                  className={`register_phone_wrapper ${
                    touched.phone && errors.phone ? "register_phone_error" : ""
                  }`}
                >
                  <PhoneInput
                    country="ae"
                    value={values.phone}
                    onChange={(value) => setFieldValue("phone", value)}
                    onBlur={() => setFieldTouched("phone")}
                    enableSearch
                    searchPlaceholder="Search country..."
                    disableSearchIcon
                  />
                </div>
                {touched.phone && errors.phone && (
                  <span className="login_field_error">{errors.phone}</span>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="form-field">
              <label className="modal-label">Password</label>
              <div className="login_password_wrapper">
                <input
                  id="register-password"
                  className={`modal-input ${
                    touched.password && errors.password
                      ? "modal-input-error"
                      : ""
                  }`}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 6 characters"
                  value={values.password}
                  onChange={(e) => setFieldValue("password", e.target.value)}
                  onBlur={() => setFieldTouched("password")}
                />
                <button
                  type="button"
                  className="login_eye_btn"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <IoMdEyeOff size={16} />
                  ) : (
                    <IoMdEye size={16} />
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <span className="login_field_error">{errors.password}</span>
              )}
            </div>

            <button
              id="register-submit"
              disabled={loading}
              type="submit"
              className={`app_btn app_btn_confirm ${
                loading ? "btn_loading" : ""
              }`}
              style={{
                width: "100%",
                marginTop: 8,
                position: "relative",
                height: 44,
              }}
            >
              <span
                className="btn_text"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                Create Account <MdArrowForward />
              </span>
              {loading && (
                <span
                  className="btn_loader"
                  style={{ width: 18, height: 18 }}
                />
              )}
            </button>
          </Form>
        )}
      </Formik>

      {/* Google Sign-up Option */}
      <div className="login-divider">
        <span>or</span>
      </div>
      <div className="google-btn-wrapper">
        <div id="google-signup-btn"></div>
      </div>

      {/* Apple Sign-up Option */}
      {/* <div className="apple-btn-wrapper">
        <button
          type="button"
          disabled={loading}
          onClick={handleAppleLogin}
          className="apple-signin-btn"
        >
          <FaApple size={18} />
          <span>Sign up with Apple</span>
        </button>
      </div> */}

      <p
        className="muted"
        style={{ marginTop: 22, textAlign: "center", fontSize: "0.875rem" }}
      >
        Already have an account?{" "}
        <Link
          to={`/auth/login${isAddingAccount ? "?addAccount=true" : ""}`}
          className="login_signup_link"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
