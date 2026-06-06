import { useState, useEffect, useRef } from "react";
import { getProfile, updateProfile } from "../../api/account";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import { toast } from "react-toastify";
import avatar from "../../assets/profile.png";
import moment from "moment";
import {
  MdOutlineMailOutline, MdOutlinePhone, MdOutlineCalendarToday,
  MdOutlinePerson, MdOutlineLock, MdOutlineNotifications, MdOutlineDevices,
  MdArrowForward, MdRefresh, MdClose, MdUpload,
} from "react-icons/md";
import { BsPersonCheck, BsShieldLock } from "react-icons/bs";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import ButtonLoader from "../../components/ButtonLoader";
import useNotifications from "../../hooks/useNotifications";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { getPrimaryRole } from "../../utils/AuthHelpers";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import "./Profile.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}
function nameHue(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

const TABS = [
  { id: "personal",      label: "Personal Info",   icon: MdOutlinePerson },
  { id: "security",      label: "Security",         icon: BsShieldLock },
  { id: "notifications", label: "Notifications",    icon: MdOutlineNotifications },
  { id: "sessions",      label: "Sessions",         icon: MdOutlineDevices },
];

const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string().min(6, "At least 6 characters").required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your password"),
});

// ── Notification Toggle Card ───────────────────────────────────────────────────
function NotifCard({ title, desc, badge, checked, onChange, disabled }) {
  return (
    <div className="profile-notif-card">
      <div className="profile-notif-info">
        <p className="profile-notif-title">
          {title}
          {badge && <span className="profile-premium-badge">{badge}</span>}
        </p>
        <p className="profile-notif-desc">{desc}</p>
      </div>
      <label className="profile-toggle">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="profile-toggle-track" />
        <span className="profile-toggle-thumb" />
      </label>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, logout, logoutAll, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [prevTab, setPrevTab] = useState(null);

  // Profile data
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);

  // Form state (personal)
  const [formData, setFormData] = useState({ fullName: "", phone: "", image: null, twoFactorEnabled: false });
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Password show/hide
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Session loading
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  // Notifications
  const { settings, fetchSettings, updateSettings, settingsLoading } = useNotifications();
  const [updatingNotif, setUpdatingNotif] = useState(false);

  // ── Load profile ─────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data.data);
      setFormData({
        fullName: data.data.fullName || "",
        phone: data.data.phone || "",
        image: null,
        twoFactorEnabled: data.data.twoFactorEnabled ?? false,
      });
      updateUser?.(data.data);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);
  useEffect(() => { if (activeTab === "notifications") fetchSettings(); }, [activeTab]);

  // ── Tab switch with animation key ───────────────────────────
  const switchTab = (id) => {
    if (id === activeTab) return;
    setPrevTab(activeTab);
    setActiveTab(id);
  };

  // ── Personal info save ───────────────────────────────────────
  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      if (formData.phone && formData.phone.length < 7) {
        throw new Error("Please enter a valid phone number.");
      }
      const payload = new FormData();
      if (formData.fullName) payload.append("fullName", formData.fullName);
      if (formData.phone) {
        const phone = formData.phone.startsWith("+") ? formData.phone : `+${formData.phone}`;
        payload.append("phone", phone);
      }
      if (formData.image) payload.append("image", formData.image);
      await updateProfile(payload);
      await fetchProfile();
      setImagePreview(null);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Two-factor toggle handler (calls dedicated endpoint) ─────────────────
  const handleToggleTwoFactor = async (value) => {
    // optimistic UI update
    setFormData((p) => ({ ...p, twoFactorEnabled: value }));
    setTwoFactorSaving(true);
    try {
      // simple client-side guard
      if (value && !profile?.emailVerified && !profile?.phoneVerified) {
        throw new Error("Verify your email or phone before enabling two-factor authentication.");
      }
      const res = await api.patch("/account/profile/two-factor", { twoFactorEnabled: value });
      const updated = res.data?.data;
      if (updated) {
        setProfile(updated);
        updateUser?.(updated);
        toast.success("Two-factor preference updated");
      }
    } catch (err) {
      // revert UI
      setFormData((p) => ({ ...p, twoFactorEnabled: !value }));
      toast.error(err.response?.data?.message || err.message || "Failed to update two-factor preference");
    } finally {
      setTwoFactorSaving(false);
    }
  };

  // ── Password change ──────────────────────────────────────────
  const handlePasswordChange = async (values, { resetForm }) => {
    try {
      await api.post("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password updated successfully!");
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    }
  };

  // ── Notification toggle ──────────────────────────────────────
  const handleNotifToggle = async (key, value) => {
    setUpdatingNotif(true);
    try {
      await updateSettings({ [key]: value });
      toast.success("Preferences saved", { toastId: "notif-save" });
    } catch (err) {
      toast.error("Failed to update preferences");
    } finally {
      setUpdatingNotif(false);
    }
  };

  // ── Image select ─────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((p) => ({ ...p, image: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Derived values ────────────────────────────────────────────
  const userInitials = getInitials(profile?.fullName || user?.fullName || "?");
  const userHue = nameHue(profile?.fullName || user?.fullName || "");
  const userRole = getPrimaryRole(user);

  // ── Skeleton ──────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="profile-page">
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div className="skeleton_shimmer skeleton_rect" style={{ width: 268, height: 360, borderRadius: 20, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton_shimmer skeleton_rect" style={{ height: 48, borderRadius: "14px 14px 0 0", marginBottom: 0 }} />
            <div className="skeleton_shimmer skeleton_rect" style={{ height: 280, borderRadius: "0 0 16px 16px" }} />
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return <div className="profile-page"><p style={{ color: "#ef4444" }}>Error: {profileError}</p></div>;
  }

  const avatarSrc = imagePreview || (profile?.image || null);

  return (
    <div className="profile-page">
      {/* ── Page header ── */}
      <div className="profile-page-header">
        <div>
          <h1 className="profile-page-title">Profile</h1>
          <p className="profile-page-subtitle">Account details are current.</p>
        </div>
        {userRole && (
          <span className="profile-role-badge">
            <span className="profile-role-dot" />
            {userRole}
          </span>
        )}
      </div>

      {/* ── Two-column grid ── */}
      <div className="profile-grid">

        {/* ── Left: Avatar card ── */}
        <div className="profile-avatar-card">
          <div className="profile-avatar-banner">
            {/* Photo button */}
            <button className="profile-photo-btn" onClick={() => fileInputRef.current?.click()}>
              <MdUpload size={12} /> Profile photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />

            {/* Avatar */}
            <div className="profile-avatar-wrap">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <div
                  className="profile-avatar-initials"
                  style={{ background: `hsl(${userHue}, 55%, 44%)` }}
                >
                  {userInitials}
                </div>
              )}
              <div
                className="profile-avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Change photo"
              >
                <MdUpload size={12} color="#fff" />
              </div>
            </div>

            <div>
              <p className="profile-avatar-name">{profile?.fullName || "—"}</p>
              <p className="profile-avatar-email">{profile?.email}</p>
            </div>

            {imagePreview && (
              <div className="profile-change-photo-row">
                <button
                  className="app_btn app_btn_confirm"
                  style={{ height: 32, fontSize: "0.75rem", padding: "0 12px" }}
                  onClick={handleSavePersonal}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save photo"}
                </button>
                <button
                  className="app_btn app_btn_cancel"
                  style={{ height: 32, fontSize: "0.75rem", padding: "0 10px" }}
                  onClick={() => { setImagePreview(null); setFormData((p) => ({ ...p, image: null })); }}
                >
                  Discard
                </button>
              </div>
            )}
          </div>

          {/* Info rows */}
          <div className="profile-info-list">
            <div className="profile-info-row">
              <div className="profile-info-icon"><MdOutlineMailOutline /></div>
              <div className="profile-info-content">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{profile?.email || "—"}</span>
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-icon"><MdOutlinePhone /></div>
              <div className="profile-info-content">
                <span className="profile-info-label">Phone</span>
                <span className="profile-info-value">{profile?.phone || "No phone"}</span>
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-icon"><BsPersonCheck /></div>
              <div className="profile-info-content">
                <span className="profile-info-label">Role</span>
                <span className="profile-info-value">{userRole || "—"}</span>
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-icon"><MdOutlineCalendarToday /></div>
              <div className="profile-info-content">
                <span className="profile-info-label">Member since</span>
                <span className="profile-info-value">
                  {profile?.createdAt ? moment(profile.createdAt).format("MMM YYYY") : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Verification badges */}
          <div className="profile-badges">
            <span className={`profile-verify-badge ${profile?.emailVerified ? "profile-verify-badge--ok" : "profile-verify-badge--no"}`}>
              {profile?.emailVerified ? "✓" : "✗"} Email
            </span>
            <span className={`profile-verify-badge ${profile?.phoneVerified ? "profile-verify-badge--ok" : "profile-verify-badge--no"}`}>
              {profile?.phoneVerified ? "✓" : "✗"} Phone
            </span>
            <span className={`profile-verify-badge ${profile?.twoFactorEnabled ? "profile-verify-badge--ok" : "profile-verify-badge--no"}`}>
              {profile?.twoFactorEnabled ? "✓" : "✗"} Two-factor
            </span>
          </div>
        </div>

        {/* ── Right: Tabs + panels ── */}
        <div className="profile-right">
          {/* Tab bar */}
          <div className="profile-tabs" role="tablist">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`profile-tab-${id}`}
                role="tab"
                aria-selected={activeTab === id}
                className={`profile-tab-btn ${activeTab === id ? "active" : ""}`}
                onClick={() => switchTab(id)}
              >
                <Icon className="profile-tab-icon" />
                {label}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="profile-panel-wrap" key={activeTab}>

            {/* ── Personal Information ── */}
            {activeTab === "personal" && (
              <>
                <div className="profile-panel-section">
                  <h3 className="profile-section-heading">Personal information</h3>
                  <p className="profile-section-sub">Name, email, phone and photo.</p>

                  <div className="profile-form-row">
                    <div className="profile-form-field">
                      <label className="profile-form-label">Full name</label>
                      <input
                        id="profile-fullname"
                        className="modal-input"
                        type="text"
                        placeholder="Your name"
                        value={formData.fullName}
                        onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="profile-form-field">
                      <label className="profile-form-label">Contact number</label>
                      <div className="register_phone_wrapper">
                        <PhoneInput
                          country="ae"
                          value={formData.phone}
                          onChange={(value) => setFormData((p) => ({ ...p, phone: value }))}
                          enableSearch
                          searchPlaceholder="Search country..."
                          disableSearchIcon
                        />
                      </div>
                    </div>
                    <div className="profile-form-field span-full">
                      <label className="profile-form-label">Email address</label>
                      <input
                        className="modal-input"
                        type="email"
                        value={profile?.email || ""}
                        readOnly
                        style={{ opacity: 0.6, cursor: "not-allowed" }}
                      />
                    </div>
                  </div>

                  <div className="profile-form-actions">
                    <button
                      className="app_btn app_btn_cancel"
                      onClick={() => setFormData({
                        fullName: profile?.fullName || "",
                        phone: profile?.phone || "",
                        image: null,
                        twoFactorEnabled: profile?.twoFactorEnabled ?? false,
                      })}
                    >
                      <MdRefresh size={14} style={{ marginRight: 4 }} />
                      Reset
                    </button>
                    <button
                      id="profile-save-btn"
                      className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`}
                      onClick={handleSavePersonal}
                      disabled={saving}
                      style={{ position: "relative", minWidth: 120 }}
                    >
                      <span className="btn_text">✓ Save changes</span>
                      {saving && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Security ── */}
            {activeTab === "security" && (
              <div className="profile-panel-section">
                <h3 className="profile-section-heading">Security</h3>
                <p className="profile-section-sub">Update your password.</p>

                <div className="profile-form-field" style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <label className="profile-form-label" htmlFor="profile-twofactor-toggle">
                        Two-factor authentication
                      </label>
                      <p className="profile-form-sub" style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        Add an extra layer of login security for your account.
                      </p>
                    </div>
                    <label className="profile-toggle" style={{ margin: 0 }}>
                      <input
                        id="profile-twofactor-toggle"
                        type="checkbox"
                        checked={formData.twoFactorEnabled}
                        onChange={(e) => handleToggleTwoFactor(e.target.checked)}
                        disabled={twoFactorSaving}
                      />
                      <span className="profile-toggle-track" />
                      <span className="profile-toggle-thumb" />
                    </label>
                  </div>
                </div>

                <Formik
                  initialValues={{ currentPassword: "", newPassword: "", confirmPassword: "" }}
                  validationSchema={passwordSchema}
                  onSubmit={handlePasswordChange}
                >
                  {({ errors, touched, values, handleChange, handleBlur, isSubmitting }) => (
                    <Form>
                      <div className="profile-form-field" style={{ marginBottom: 16 }}>
                        <label className="profile-form-label">Current password</label>
                        <div className="login_password_wrapper">
                          <input
                            id="profile-current-pw"
                            className={`modal-input ${touched.currentPassword && errors.currentPassword ? "modal-input-error" : ""}`}
                            type={showCurrent ? "text" : "password"}
                            name="currentPassword"
                            placeholder="••••••••"
                            value={values.currentPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <button type="button" className="login_eye_btn" onClick={() => setShowCurrent((p) => !p)} tabIndex={-1}>
                            {showCurrent ? <IoMdEyeOff size={16} /> : <IoMdEye size={16} />}
                          </button>
                        </div>
                        {touched.currentPassword && errors.currentPassword && <span className="login_field_error">{errors.currentPassword}</span>}
                      </div>

                      <div className="profile-form-row">
                        <div className="profile-form-field">
                          <label className="profile-form-label">New password</label>
                          <div className="login_password_wrapper">
                            <input
                              id="profile-new-pw"
                              className={`modal-input ${touched.newPassword && errors.newPassword ? "modal-input-error" : ""}`}
                              type={showNew ? "text" : "password"}
                              name="newPassword"
                              placeholder="••••••••"
                              value={values.newPassword}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <button type="button" className="login_eye_btn" onClick={() => setShowNew((p) => !p)} tabIndex={-1}>
                              {showNew ? <IoMdEyeOff size={16} /> : <IoMdEye size={16} />}
                            </button>
                          </div>
                          {touched.newPassword && errors.newPassword && <span className="login_field_error">{errors.newPassword}</span>}
                        </div>
                        <div className="profile-form-field">
                          <label className="profile-form-label">Confirm password</label>
                          <div className="login_password_wrapper">
                            <input
                              id="profile-confirm-pw"
                              className={`modal-input ${touched.confirmPassword && errors.confirmPassword ? "modal-input-error" : ""}`}
                              type={showConfirm ? "text" : "password"}
                              name="confirmPassword"
                              placeholder="••••••••"
                              value={values.confirmPassword}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <button type="button" className="login_eye_btn" onClick={() => setShowConfirm((p) => !p)} tabIndex={-1}>
                              {showConfirm ? <IoMdEyeOff size={16} /> : <IoMdEye size={16} />}
                            </button>
                          </div>
                          {touched.confirmPassword && errors.confirmPassword && <span className="login_field_error">{errors.confirmPassword}</span>}
                        </div>
                      </div>

                      <div className="profile-form-actions">
                        <button type="button" className="app_btn app_btn_cancel" onClick={() => {}}>
                          <MdClose size={14} style={{ marginRight: 4 }} /> Cancel
                        </button>
                        <button
                          id="profile-update-pw-btn"
                          type="submit"
                          disabled={isSubmitting}
                          className={`app_btn app_btn_confirm ${isSubmitting ? "btn_loading" : ""}`}
                          style={{ position: "relative", minWidth: 140 }}
                        >
                          <span className="btn_text" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <MdArrowForward size={14} /> Update password
                          </span>
                          {isSubmitting && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === "notifications" && (
              <div className="profile-panel-section">
                <h3 className="profile-section-heading">Notification Preferences</h3>
                <p className="profile-section-sub">Choose how we notify you about account activity.</p>

                {settingsLoading && !settings ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading preferences…</div>
                ) : (
                  <div className="profile-notif-list">
                    <NotifCard
                      title="Push Notifications"
                      desc="Receive alerts on your device for immediate updates."
                      checked={settings?.pushEnabled ?? true}
                      onChange={(e) => handleNotifToggle("pushEnabled", e.target.checked)}
                      disabled={updatingNotif}
                    />
                    <NotifCard
                      title="Email Notifications"
                      desc="Receive a summary of important alerts via email."
                      checked={settings?.emailEnabled ?? true}
                      onChange={(e) => handleNotifToggle("emailEnabled", e.target.checked)}
                      disabled={updatingNotif}
                    />
                    <NotifCard
                      title="SMS Notifications"
                      desc="Receive text messages for urgent activity."
                      badge="Premium"
                      checked={settings?.smsEnabled ?? false}
                      onChange={(e) => handleNotifToggle("smsEnabled", e.target.checked)}
                      disabled={updatingNotif}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Sessions ── */}
            {activeTab === "sessions" && (
              <>
                <div className="profile-panel-section">
                  <h3 className="profile-section-heading">Sessions</h3>
                  <p className="profile-section-sub">Manage your active sessions across devices.</p>
                  <div className="profile-session-row">
                    <button
                      id="profile-logout-btn"
                      onClick={async () => { setLoggingOut(true); await logout(); }}
                      disabled={loggingOut}
                      className={`app_btn app_btn_logout ${loggingOut ? "btn_loading" : ""}`}
                      style={{ position: "relative" }}
                    >
                      <span className="btn_text">Logout</span>
                      {loggingOut && <ButtonLoader />}
                    </button>
                    <button
                      id="profile-logout-all-btn"
                      onClick={async () => { setLoggingOutAll(true); await logoutAll(); }}
                      disabled={loggingOutAll}
                      className={`app_btn app_btn_logout_all ${loggingOutAll ? "btn_loading" : ""}`}
                      style={{ position: "relative" }}
                    >
                      <span className="btn_text">Logout of all devices</span>
                      {loggingOutAll && <ButtonLoader />}
                    </button>
                  </div>
                </div>

                {/* Danger zone */}
                <div className="profile-danger-zone">
                  <p className="profile-danger-title">Delete account</p>
                  <p className="profile-danger-sub">Permanently remove your account from Nora.</p>
                  <p className="profile-danger-desc">
                    This will sign you out of every device, anonymize your name and email, and
                    revoke every saved login. Orders and audit records you created stay attached
                    to the business so other team members can still see history.{" "}
                    <strong>You can't undo this.</strong>
                  </p>
                  <button
                    id="profile-delete-btn"
                    className="app_btn"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.25)" }}
                    onClick={() => toast.error("Please contact support to delete your account.")}
                  >
                    🗑 Delete my account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
