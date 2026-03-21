import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import useQuery from "../../hooks/useQuery";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";
import { useTheme } from "../../contexts/ThemeContext";
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
  const roleParam = query.get("role"); // e.g. "vendor", "supplier", "operator"
  const { login } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 1. Register — include roles from ?role= param
      await api.post("/auth/register", {
        ...values,
        phone: `+${values.phone}`,
        roles: roleParamToRoles(roleParam),
      });

      // 2. Auto-login immediately after registration
      const loginResponse = await api.post("/auth/login", {
        email: values.email,
        password: values.password,
      });

      const { accessToken, refreshToken, user } = loginResponse.data.data;

      // 3. Persist session
      login(user, accessToken, refreshToken);

      // 4. Request email verification (non-blocking)
      api
        .post(
          "/auth/request-verification",
          { type: "email" },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        )
        .catch(() => {});

      toast.success("Account created! Welcome to Nora 🎉");

      // 5. Redirect to OTP verification, then deep-link to role's default page
      navigate("/auth/verify-otp", {
        state: {
          email: values.email,
          verificationType: "email",
          // After OTP, redirect to the right page for this role
          nextRoute: getDefaultRoute(user),
        },
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // Role label for the heading
  const roleLabel =
    {
      vendor: "as a Vendor",
      supplier: "as a Supplier",
      operator: "as an Operator",
    }[roleParam?.toLowerCase()] || "";

  return (
    <div>
      <img
        src={theme === "dark" ? nora_logo_white : nora_logo_dark}
        alt="nora_logo"
        className="sidebar_logo"
        style={{ marginBottom: 16 }}
      />
      <h3 className="profile_header">Get Started {roleLabel}</h3>
      <p className="welcome_message">
        Nora - Your All-in-One Ecosystem for Quick Restaurant Expansion
      </p>

      <Formik
        initialValues={{ fullName: "", email: "", password: "", phone: "" }}
        validationSchema={registerSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue, setFieldTouched }) => (
          <Form style={{ marginTop: 24 }}>
            {/* Full Name */}
            <div className="form-field">
              <label className="modal-label">Full Name</label>
              <input
                className={`modal-input ${touched.fullName && errors.fullName ? "modal-input-error" : ""}`}
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

              <div className="form-field" style={{ flex: 1 }}>
                <label className="modal-label">Phone Number</label>
                <div
                  className={`register_phone_wrapper ${touched.phone && errors.phone ? "register_phone_error" : ""}`}
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
                  className={`modal-input ${touched.password && errors.password ? "modal-input-error" : ""}`}
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

            {/* Submit */}
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
              <span className="btn_text">Create Account</span>
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
              Already have an account?{" "}
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
