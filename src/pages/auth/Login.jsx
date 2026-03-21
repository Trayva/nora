import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";
import { useTheme } from "../../contexts/ThemeContext";
import { getDefaultRoute } from "../../utils/AuthHelpers";
import useQuery from "../../hooks/useQuery";

const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();
  const query = useQuery();
  const cbUrl = query.get("cbUrl"); // honour callback URL if present
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", values);
      const { accessToken, refreshToken, user } = response.data.data;
      login(user, accessToken, refreshToken);
      toast.success("Welcome back!");
      // Honour cbUrl first, then default to role-based route
      navigate(cbUrl || getDefaultRoute(user));
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <img
        src={theme === "dark" ? nora_logo_white : nora_logo_dark}
        alt="nora_logo"
        className="sidebar_logo mb-4"
      />
      <h3 className="profile_header">Welcome Back</h3>
      <p className="welcome_message">Sign in to access your Nora account</p>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={loginSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, handleChange, handleBlur }) => (
          <Form style={{ marginTop: 24 }}>
            <div className="form-field">
              <label className="modal-label">Email</label>
              <input
                className={`modal-input ${touched.email && errors.email ? "modal-input-error" : ""}`}
                type="email"
                name="email"
                placeholder="your@email.com"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.email && errors.email && (
                <span className="login_field_error">{errors.email}</span>
              )}
            </div>

            <div className="form-field">
              <label className="modal-label">Password</label>
              <div className="login_password_wrapper">
                <input
                  className={`modal-input ${touched.password && errors.password ? "modal-input-error" : ""}`}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
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

            <div style={{ textAlign: "right", marginTop: 6 }}>
              <Link to="/auth/forgot-password" className="login_forgot_link">
                Forgot password?
              </Link>
            </div>

            <button
              disabled={loading}
              type="submit"
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              style={{
                width: "100%",
                marginTop: 20,
                position: "relative",
                height: 42,
              }}
            >
              <span className="btn_text">Sign In</span>
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
              Don't have an account?{" "}
              <Link
                to="/auth/register?role=CUSTOMER"
                className="login_signup_link"
              >
                Sign up
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
}
