import { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { MdOutlineMailOutline, MdOutlinePhone } from "react-icons/md";
import { BsPersonCheck, BsPersonVcard } from "react-icons/bs";
import ButtonLoader from "../../components/ButtonLoader";
import NotificationSettingsForm from "../../components/Notifications/NotificationSettingsForm";

const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your password"),
});

export default function Settings() {
  const { user, logout, logoutAll } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggingOutOfAll, setLoggingOutOfAll] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const handleLogoutAll = async () => {
    setLoggingOutOfAll(true);
    await logoutAll();
  };

  return (
    <div className="page_wrapper">
      <h3 className="page_title_big m-0">Account</h3>
      <p className="welcome_message">
        Manage your account settings and preferences
      </p>

      {/* Account Info */}
      <section className="settings-section">
        <div className="">
          <div className="account_info_div mb-3 d-flex align-items-center gap-3">
            <div className="account_info_icon">
              <BsPersonVcard />{" "}
            </div>
            <div>
              <p className="account_info_label">Name</p>
              <p className="account_info_item">{user?.fullName}</p>
            </div>
          </div>
          <div className="account_info_div mb-3 d-flex align-items-center gap-3">
            <div className="account_info_icon">
              <MdOutlineMailOutline />
            </div>
            <div>
              <p className="account_info_label">Email</p>
              <p className="account_info_item">{user?.email}</p>
            </div>
          </div>
          <div className="account_info_div mb-3 d-flex align-items-center gap-3">
            <div className="account_info_icon">
              <MdOutlinePhone />
            </div>
            <div>
              <p className="account_info_label">Phone</p>
              <p className="account_info_item">{user?.phone || "—"}</p>
            </div>
          </div>
          <div className="account_info_div mb-3 d-flex align-items-center gap-3">
            <div className="account_info_icon">
              <BsPersonCheck />
            </div>
            <div>
              <p className="account_info_label">Role</p>
              <p className="account_info_item">
                {user?.roles?.includes("CUSTOMER")
                  ? "Customer"
                  : user?.roles?.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="" />

      <NotificationSettingsForm />
      <br />
      <br />

      {/* Session Management */}
      <section className="">
        <h3 className="page_title_big m-0">Sessions</h3>
        <p className="welcome_message">
          Manage your active sessions across devices
        </p>

        <div className="d-flex gap-2 flex-wrap">
          {/* <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="app_btn app_btn_logout"
            >
            {loggingOut ? "Logging out..." : "Logout"}
            </button> */}
          <button
            onClick={handleLogout}
            className={`app_btn app_btn_logout ${loggingOut ? "btn_loading" : ""}`}
            disabled={loggingOut}
          >
            <span className="btn_text">Logout</span>
            {loggingOut && <ButtonLoader />}
          </button>

          <button
            className={`app_btn app_btn_logout_all ${loggingOutOfAll ? "btn_loading" : ""}`}
            onClick={handleLogoutAll}
            disabled={loggingOutOfAll}
          >
            <span className="btn_text text-white">Logout of all devices</span>

            {loggingOutOfAll && <ButtonLoader />}
          </button>
        </div>
      </section>

      <hr className="mt-4 mb-4" />

      {/* Notification Preferences */}
    </div>
  );
}
