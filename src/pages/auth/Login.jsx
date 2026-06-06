import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { MdClose, MdArrowForward, MdPersonAdd } from "react-icons/md";
import { FaApple } from "react-icons/fa";
import { useTheme } from "../../contexts/ThemeContext";
import { getDefaultRoute, getPrimaryRole } from "../../utils/AuthHelpers";
import useQuery from "../../hooks/useQuery";

// ── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

/** Deterministic hue from a string — always looks good */
function nameHue(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

function AvatarChip({ account, active, onSelect, onRemove }) {
  const hue = nameHue(account.user?.fullName || "");
  const initials = getInitials(account.user?.fullName || "?");
  const role = getPrimaryRole(account.user);
  const imgSrc = account.user?.image || null;

  return (
    <button
      type="button"
      id={`account-chip-${account.id}`}
      className={`login-account-chip ${
        active ? "login-account-chip--active" : ""
      }`}
      onClick={onSelect}
    >
      <span
        className="login-account-avatar"
        style={
          imgSrc
            ? { background: "transparent", padding: 0, overflow: "hidden" }
            : { background: `hsl(${hue}, 60%, 48%)` }
        }
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={account.user?.fullName || "Avatar"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "inherit",
              display: "block",
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement.textContent = initials;
            }}
          />
        ) : (
          initials
        )}
      </span>
      <span className="login-account-info">
        <span className="login-account-name">
          {account.user?.fullName || "Account"}
        </span>
        <span className="login-account-email">{account.user?.email || ""}</span>
      </span>
      {role && <span className="login-account-role">{role}</span>}
      <span
        className="login-account-remove"
        role="button"
        tabIndex={0}
        title="Remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            onRemove();
          }
        }}
      >
        <MdClose size={12} />
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const passwordSchema = Yup.object().shape({
  password: Yup.string().required("Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const { login, savedAccounts, switchAccount, removeAccount } = useAuth();
  const { theme } = useTheme();
  const query = useQuery();
  const cbUrl = query.get("cbUrl");
  const isAddingAccount = query.get("addAccount") === "true";

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  /** accountId of the "continue as" selection, or null = use full form */
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  // Start with chips visible so existing accounts are clickable; form is secondary
  const [showFullForm, setShowFullForm] = useState(false);

  const selectedAccount =
    savedAccounts.find((a) => a.id === selectedAccountId) || null;

  // ── google-login callback ────────────────────────────────────────────────
  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/google-login", {
        idToken: response.credential,
        role: "CUSTOMER",
      });
      const { accessToken, refreshToken, user } = res.data.data;
      login(user, accessToken, refreshToken);
      toast.success("Welcome back!");
      navigate(cbUrl || getDefaultRoute(user));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Google authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── apple-login callback ──────────────────────────────────────────────────
  const handleAppleLogin = async () => {
    if (!window.AppleID) {
      toast.error("Apple Sign-In is loading, please try again.");
      return;
    }
    setLoading(true);
    try {
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
        role: "CUSTOMER",
      });
      const { accessToken, refreshToken, user } = res.data.data;
      login(user, accessToken, refreshToken);
      toast.success("Welcome back!");
      navigate(cbUrl || getDefaultRoute(user));
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
          document.getElementById("google-signin-btn"),
          {
            theme: theme === "dark" ? "filled_black" : "outline",
            size: "large",
            width: "100%",
            text: "signin_with",
            shape: "rectangular",
          }
        );
      };

      const timer = setTimeout(initializeGoogle, 100);
      return () => clearTimeout(timer);
    }
  }, [theme, showFullForm]);

  // ── full-login submit ─────────────────────────────────────────────────────

  const handleFullLogin = async (values) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", values);
      const result = response.data.data;
      if (result.requiresTwoFactor) {
        return navigate("/auth/verify-otp", {
          state: {
            flow: "twoFactor",
            userId: result.userId,
            email: result.email,
            phone: result.phone,
            verificationType:
              result.method === "email"
                ? "TWO_FACTOR_EMAIL"
                : "TWO_FACTOR_PHONE",
            nextRoute: cbUrl || "/app",
          },
        });
      }
      const { accessToken, refreshToken, user } = result;
      login(user, accessToken, refreshToken);
      toast.success("Welcome back!");
      navigate(cbUrl || getDefaultRoute(user));
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── saved-account switch (no re-auth, just swap token) ───────────────────

  const handleSwitchAccount = (account) => {
    switchAccount(account.id);
    toast.success(`Switched to ${account.user?.fullName || "account"}`);
    navigate(cbUrl || getDefaultRoute(account.user));
  };

  // ── continue-as: verify password for selected saved account ──────────────

  const handleContinueAs = async (values) => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: selectedAccount.user?.email,
        password: values.password,
      });
      const result = response.data.data;
      if (result.requiresTwoFactor) {
        return navigate("/auth/verify-otp", {
          state: {
            flow: "twoFactor",
            userId: result.userId,
            email: result.email,
            phone: result.phone,
            verificationType:
              result.method === "email"
                ? "TWO_FACTOR_EMAIL"
                : "TWO_FACTOR_PHONE",
            nextRoute: cbUrl || "/app",
          },
        });
      }
      const { accessToken, refreshToken, user } = result;
      login(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user?.fullName?.split(" ")[0] || ""}!`);
      navigate(cbUrl || getDefaultRoute(user));
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  const hasSaved = savedAccounts.length > 0;

  return (
    <div className="login-page-inner">
      <div className="login-heading-group">
        <h2 className="login-title">
          {isAddingAccount ? "Add account" : "Welcome back"}
        </h2>
        <p className="login-subtitle">
          {isAddingAccount ? (
            <>Log in to add another account to your session</>
          ) : (
            <>
              New here?{" "}
              <Link
                to="/auth/register?role=CUSTOMER"
                className="login_signup_link"
              >
                Create a free account
              </Link>
            </>
          )}
        </p>
      </div>

      {/* ── Saved account chips ──────────────────────────────────── */}
      {hasSaved && !showFullForm && (
        <div className="login-accounts-section">
          <p className="login-section-label">Continue as</p>
          <div className="login-accounts-list">
            {savedAccounts.map((account) => (
              <AvatarChip
                key={account.id}
                account={account}
                active={selectedAccountId === account.id}
                onSelect={() => {
                  if (selectedAccountId === account.id) {
                    // second click = quick switch (no password if same token)
                    handleSwitchAccount(account);
                  } else {
                    setSelectedAccountId(account.id);
                  }
                }}
                onRemove={() => {
                  removeAccount(account.id);
                  if (selectedAccountId === account.id)
                    setSelectedAccountId(null);
                }}
              />
            ))}
          </div>

          {/* Password prompt for selected account */}
          {selectedAccount && (
            <Formik
              initialValues={{ password: "" }}
              validationSchema={passwordSchema}
              onSubmit={handleContinueAs}
            >
              {({ errors, touched, values, handleChange, handleBlur }) => (
                <Form className="login-continue-form">
                  <p
                    className="login-section-label"
                    style={{ marginBottom: 8 }}
                  >
                    Enter password for{" "}
                    <strong>{selectedAccount.user?.email}</strong>
                  </p>
                  <div className="login_password_wrapper">
                    <input
                      className={`modal-input ${
                        touched.password && errors.password
                          ? "modal-input-error"
                          : ""
                      }`}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoFocus
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
                  <div className="login-continue-actions">
                    <button
                      type="button"
                      className="app_btn app_btn_cancel"
                      style={{ flex: 1 }}
                      onClick={() => setSelectedAccountId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`app_btn app_btn_confirm login-continue-btn ${
                        loading ? "btn_loading" : ""
                      }`}
                      style={{ flex: 2, position: "relative", height: 42 }}
                    >
                      <span className="btn_text">Sign In →</span>
                      {loading && (
                        <span
                          className="btn_loader"
                          style={{ width: 18, height: 18 }}
                        />
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}

          <div className="login-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            id="login-use-different-account"
            className="login-different-btn"
            onClick={() => {
              setShowFullForm(true);
              setSelectedAccountId(null);
            }}
          >
            <MdPersonAdd size={16} />
            Sign in with a different account
          </button>
        </div>
      )}

      {/* ── Full email/password form ───────────────────────────────── */}
      {(!hasSaved || showFullForm) && (
        <>
          {showFullForm && (
            <button
              type="button"
              className="login-back-btn"
              onClick={() => setShowFullForm(false)}
            >
              ← Back to accounts
            </button>
          )}
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={handleFullLogin}
          >
            {({ errors, touched, values, handleChange, handleBlur }) => (
              <Form style={{ marginTop: 20 }}>
                <div className="form-field">
                  <label className="modal-label">Email address</label>
                  <input
                    id="login-email"
                    className={`modal-input ${
                      touched.email && errors.email ? "modal-input-error" : ""
                    }`}
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {touched.email && errors.email && (
                    <span className="login_field_error">{errors.email}</span>
                  )}
                </div>

                <div className="form-field">
                  <div className="login-label-row">
                    <label className="modal-label">Password</label>
                    <Link
                      to={`/auth/forgot-password${
                        isAddingAccount ? "?addAccount=true" : ""
                      }`}
                      className="login_forgot_link"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="login_password_wrapper">
                    <input
                      id="login-password"
                      className={`modal-input ${
                        touched.password && errors.password
                          ? "modal-input-error"
                          : ""
                      }`}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter password"
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

                <button
                  id="login-submit"
                  disabled={loading}
                  type="submit"
                  className={`app_btn app_btn_confirm ${
                    loading ? "btn_loading" : ""
                  }`}
                  style={{
                    width: "100%",
                    marginTop: 20,
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
                    Sign in <MdArrowForward />
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
        </>
      )}

      {/* Google Sign-in Option */}
      <div className="login-divider">
        <span>or</span>
      </div>
      <div className="google-btn-wrapper">
        <div id="google-signin-btn"></div>
      </div>

      {/* Apple Sign-in Option */}
      {/* <div className="apple-btn-wrapper">
        <button
          type="button"
          disabled={loading}
          onClick={handleAppleLogin}
          className="apple-signin-btn"
        >
          <FaApple size={18} />
          <span>Sign in with Apple</span>
        </button>
      </div> */}

      <p
        className="muted"
        style={{ marginTop: 22, textAlign: "center", fontSize: "0.875rem" }}
      >
        Don't have an account?{" "}
        <Link
          to={`/auth/register?role=CUSTOMER${
            isAddingAccount ? "&addAccount=true" : ""
          }`}
          className="login_signup_link"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
