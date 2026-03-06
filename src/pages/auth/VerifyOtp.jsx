import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import api from "../../api/axios";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { RxReload } from "react-icons/rx";
import Loader from "../../components/Loader";

const otpSchema = Yup.object().shape({
  otp: Yup.string()
    .length(6, "OTP must be 6 digits")
    .required("OTP is required"),
});

export default function VerifyOtp({ type = 'email', recipient, showSignInButton = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { email = recipient, verificationType = type } = location.state || {};

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
      <h2 className="profile_header">Verify Your {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
      <p className="welcome_message">
        We've sent a verification code to <strong>{email}</strong>
      </p>
      <br />

      <Formik
        initialValues={{ otp: "" }}
        validationSchema={otpSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue, setFieldTouched }) => (
          <Form>
            <div className="form-field">
              <Input
                labelClassName="modal-label"
                label="Enter 6-digit code"
                className={`modal-input ${touched.otp && errors.otp ? "modal-input-error" : ""}`}
                // placeholder="Enter 6-digit code"
                value={values.otp}
                onChange={(value) => setFieldValue("otp", value)}
                onBlur={() => setFieldTouched("otp")}
                errorMessage={touched.otp && errors.otp}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              style={{ width: "100%", marginTop: 20 }}
            >
              {loading ? <span
                className="btn_loader"
                style={{ width: 18, height: 18 }}
              /> : "Verify"}
            </button>

            <div
              className=""
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className={`app_btn app_btn_small app_btn_confirm ${resending ? "btn_loading" : ""}`}
              >
                {resending ? <span
                  className="btn_loader"
                  style={{ width: 18, height: 18 }}
                /> : "Resend Code"}
                {/* <RxReload /> */}
              </button>
              {showSignInButton && <p style={{ marginTop: 15 }} className="login_forgot_link">
                Back to{" "}
                <Link to="/auth/login" className="login_forgot_link">
                  Sign in
                </Link>
              </p>}
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
