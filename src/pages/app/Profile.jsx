import { useState, useEffect, useRef } from "react";
import { getProfile, updateProfile } from "../../api/account";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import { toast } from "react-toastify";
import avatar from "../../assets/profile.png";
import moment from "moment";
import {
  MdOutlineMailOutline,
  MdOutlinePhone,
  MdOutlineCalendarToday,
  MdOutlinePerson,
  MdOutlineLock,
  MdOutlineNotifications,
  MdOutlineDevices,
  MdArrowForward,
  MdRefresh,
  MdClose,
  MdUpload,
  MdCheckCircle,
  MdPending,
  MdErrorOutline,
  MdVerifiedUser,
} from "react-icons/md";
import { BsPersonCheck, BsShieldLock } from "react-icons/bs";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import ButtonLoader from "../../components/ButtonLoader";
import Tabs from "../../components/Tabs";
import useNotifications from "../../hooks/useNotifications";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { getPrimaryRole } from "../../utils/AuthHelpers";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import "./Profile.css";
import { COUNTRIES } from "../admin/adminUtils_";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}
function nameHue(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

const TABS = [
  { id: "personal", label: "Personal Info", icon: MdOutlinePerson },
  { id: "security", label: "Security", icon: BsShieldLock },
  { id: "notifications", label: "Notifications", icon: MdOutlineNotifications },
  { id: "kyc", label: "KYC", icon: BsPersonCheck },
  { id: "sessions", label: "Sessions", icon: MdOutlineDevices },
];

const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(6, "At least 6 characters")
    .required("New password is required"),
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
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    image: null,
    twoFactorEnabled: false,
    // KYC fields
    address: "",
    city: "",
    country: "",
    governmentIdType: "",
    governmentIdNumber: "",
    governmentIdImage: null,
    proofOfAddressImage: null,
    additionalDocumentImage: null,
  });
  const fileInputRef = useRef(null);
  const govFileRef = useRef(null);
  const proofFileRef = useRef(null);
  const addDocFileRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Password show/hide
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Session loading
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  // Notifications
  const { settings, fetchSettings, updateSettings, settingsLoading } =
    useNotifications();
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
        address: data.data.address || "",
        city: data.data.city || "",
        country: data.data.country || "",
        governmentIdType: data.data.governmentIdType || "",
        governmentIdNumber: data.data.governmentIdNumber || "",
        governmentIdImage: data.data.governmentIdImage || null,
        proofOfAddressImage: data.data.proofOfAddressImage || null,
        additionalDocumentImage: data.data.additionalDocumentImage || null,
      });
      updateUser?.(data.data);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);
  useEffect(() => {
    if (activeTab === "notifications") fetchSettings();
  }, [activeTab]);

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
        const phone = formData.phone.startsWith("+")
          ? formData.phone
          : `+${formData.phone}`;
        payload.append("phone", phone);
      }
      // KYC fields
      if (formData.address) payload.append("address", formData.address);
      if (formData.city) payload.append("city", formData.city);
      if (formData.country) payload.append("country", formData.country);
      if (formData.governmentIdType)
        payload.append("governmentIdType", formData.governmentIdType);
      if (formData.governmentIdNumber)
        payload.append("governmentIdNumber", formData.governmentIdNumber);
      if (formData.image) payload.append("image", formData.image);
      if (formData.governmentIdImage instanceof File)
        payload.append("governmentIdImage", formData.governmentIdImage);
      if (formData.proofOfAddressImage instanceof File)
        payload.append("proofOfAddressImage", formData.proofOfAddressImage);
      if (formData.additionalDocumentImage instanceof File)
        payload.append("additionalDocumentImage", formData.additionalDocumentImage);
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
        throw new Error(
          "Verify your email or phone before enabling two-factor authentication.",
        );
      }
      const res = await api.patch("/account/profile/two-factor", {
        twoFactorEnabled: value,
      });
      const updated = res.data?.data;
      if (updated) {
        setProfile(updated);
        updateUser?.(updated);
        toast.success("Two-factor preference updated");
      }
    } catch (err) {
      // revert UI
      setFormData((p) => ({ ...p, twoFactorEnabled: !value }));
      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Failed to update two-factor preference",
      );
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

  const handleGovIdChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((p) => ({ ...p, governmentIdImage: file }));
  };

  const handleProofOfAddressChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((p) => ({ ...p, proofOfAddressImage: file }));
  };

  const handleAddDocChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((p) => ({ ...p, additionalDocumentImage: file }));
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
          <div
            className="skeleton_shimmer skeleton_rect"
            style={{ width: 268, height: 360, borderRadius: 20, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="skeleton_shimmer skeleton_rect"
              style={{
                height: 48,
                borderRadius: "14px 14px 0 0",
                marginBottom: 0,
              }}
            />
            <div
              className="skeleton_shimmer skeleton_rect"
              style={{ height: 280, borderRadius: "0 0 16px 16px" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="profile-page">
        <p style={{ color: "#ef4444" }}>Error: {profileError}</p>
      </div>
    );
  }

  const avatarSrc = imagePreview || profile?.image || null;

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
            <button
              className="profile-photo-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <MdUpload size={12} /> Profile photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />

            {/* Avatar */}
            <div className="profile-avatar-wrap">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="profile-avatar-img"
                />
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
                  onClick={() => {
                    setImagePreview(null);
                    setFormData((p) => ({ ...p, image: null }));
                  }}
                >
                  Discard
                </button>
              </div>
            )}
          </div>

          {/* Info rows */}
          <div className="profile-info-list">
            <div className="profile-info-row">
              <div className="profile-info-icon">
                <MdOutlineMailOutline />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">
                  {profile?.email || "—"}
                </span>
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-icon">
                <MdOutlinePhone />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Phone</span>
                <span className="profile-info-value">
                  {profile?.phone || "No phone"}
                </span>
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-icon">
                <BsPersonCheck />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Role</span>
                <span className="profile-info-value">{userRole || "—"}</span>
              </div>
            </div>
            <div className="profile-info-row">
              <div className="profile-info-icon">
                <MdOutlineCalendarToday />
              </div>
              <div className="profile-info-content">
                <span className="profile-info-label">Member since</span>
                <span className="profile-info-value">
                  {profile?.createdAt
                    ? moment(profile.createdAt).format("MMM YYYY")
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Verification badges */}
          <div className="profile-badges">
            <span
              className={`profile-verify-badge ${profile?.emailVerified
                ? "profile-verify-badge--ok"
                : "profile-verify-badge--no"
                }`}
            >
              {profile?.emailVerified ? "✓" : "✗"} Email
            </span>
            <span
              className={`profile-verify-badge ${profile?.phoneVerified
                ? "profile-verify-badge--ok"
                : "profile-verify-badge--no"
                }`}
            >
              {profile?.phoneVerified ? "✓" : "✗"} Phone
            </span>
            <span
              className={`profile-verify-badge ${profile?.twoFactorEnabled
                ? "profile-verify-badge--ok"
                : "profile-verify-badge--no"
                }`}
            >
              {profile?.twoFactorEnabled ? "✓" : "✗"} Two-factor
            </span>
          </div>
        </div>

        {/* ── Right: Tabs + panels ── */}
        <div className="profile-right">
          {/* Tab bar */}
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={switchTab}
          />

          {/* Panel */}
          <div className="profile-panel-wrap" key={activeTab}>
            {/* ── Personal Information ── */}
            {activeTab === "personal" && (
              <>
                <div className="profile-panel-section">
                  <h3 className="profile-section-heading">
                    Personal information
                  </h3>
                  <p className="profile-section-sub">
                    Name, email, phone and photo.
                  </p>

                  <div className="profile-form-row">
                    <div className="profile-form-field">
                      <label className="profile-form-label">Full name</label>
                      <input
                        id="profile-fullname"
                        className="modal-input"
                        type="text"
                        placeholder="Your name"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            fullName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="profile-form-field">
                      <label className="profile-form-label">
                        Contact number
                      </label>
                      <div className="register_phone_wrapper">
                        <PhoneInput
                          country="ae"
                          value={formData.phone}
                          onChange={(value) =>
                            setFormData((p) => ({ ...p, phone: value }))
                          }
                          enableSearch
                          searchPlaceholder="Search country..."
                          disableSearchIcon
                        />
                      </div>
                    </div>
                    <div className="profile-form-field span-full">
                      <label className="profile-form-label">
                        Email address
                      </label>
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
                      onClick={() =>
                        setFormData({
                          fullName: profile?.fullName || "",
                          phone: profile?.phone || "",
                          image: null,
                          twoFactorEnabled: profile?.twoFactorEnabled ?? false,
                        })
                      }
                    >
                      <MdRefresh size={14} style={{ marginRight: 4 }} />
                      Reset
                    </button>
                    <button
                      id="profile-save-btn"
                      className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""
                        }`}
                      onClick={handleSavePersonal}
                      disabled={saving}
                      style={{ position: "relative", minWidth: 120 }}
                    >
                      <span className="btn_text">✓ Save changes</span>
                      {saving && (
                        <span
                          className="btn_loader"
                          style={{ width: 16, height: 16 }}
                        />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── KYC ── */}
            {activeTab === "kyc" && (() => {
              const currentLevel = Number(profile?.kycLevel) || ((profile?.emailVerified && profile?.phoneVerified) ? 1 : 0);
              const isLevel1Complete = Boolean(profile?.emailVerified && profile?.phoneVerified);
              const isLevel2Approved = currentLevel >= 2 && profile?.kycStatus === "APPROVED";
              const isLevel3Approved = currentLevel >= 3 && profile?.kycStatus === "APPROVED";
              const isSubmitted = profile?.kycStatus === "SUBMITTED";
              const isRejected = profile?.kycStatus === "REJECTED";

              return (
                <div className="profile-panel-section">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
                    <div>
                      <h3 className="profile-section-heading" style={{ margin: 0 }}>KYC Verification</h3>
                      <p className="profile-section-sub" style={{ margin: "4px 0 0" }}>
                        Complete the verification levels to unlock higher limits and platform features.
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 20,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          background: currentLevel >= 3 ? "rgba(34, 197, 94, 0.12)" : currentLevel >= 2 ? "rgba(99, 102, 241, 0.12)" : currentLevel >= 1 ? "rgba(234, 179, 8, 0.12)" : "rgba(100, 116, 139, 0.12)",
                          color: currentLevel >= 3 ? "#16a34a" : currentLevel >= 2 ? "#6366f1" : currentLevel >= 1 ? "#ca8a04" : "#64748b",
                          border: `1px solid ${currentLevel >= 3 ? "rgba(34, 197, 94, 0.3)" : currentLevel >= 2 ? "rgba(99, 102, 241, 0.3)" : currentLevel >= 1 ? "rgba(234, 179, 8, 0.3)" : "rgba(100, 116, 139, 0.3)"}`,
                        }}
                      >
                        <MdVerifiedUser size={16} />
                        Level {currentLevel}: {currentLevel === 3 ? "Advanced" : currentLevel === 2 ? "Identity Verified" : currentLevel === 1 ? "Basic" : "Unverified"}
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "6px 12px",
                          borderRadius: 20,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          background: profile?.kycStatus === "APPROVED" ? "rgba(34, 197, 94, 0.12)" : isSubmitted ? "rgba(245, 158, 11, 0.12)" : isRejected ? "rgba(239, 68, 68, 0.12)" : "rgba(100, 116, 139, 0.12)",
                          color: profile?.kycStatus === "APPROVED" ? "#16a34a" : isSubmitted ? "#f59e0b" : isRejected ? "#ef4444" : "#64748b",
                        }}
                      >
                        {profile?.kycStatus === "APPROVED" && <MdCheckCircle size={15} />}
                        {isSubmitted && <MdPending size={15} />}
                        {isRejected && <MdErrorOutline size={15} />}
                        {profile?.kycStatus || "PENDING"}
                      </span>
                    </div>
                  </div>

                  {/* KYC Feedback alerts */}
                  {isRejected && profile?.kycNotes && (
                    <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.08)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.25)", fontSize: "0.85rem", marginBottom: 20 }}>
                      <strong>KYC Review Notes:</strong> {profile.kycNotes}
                    </div>
                  )}

                  {isSubmitted && (
                    <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(245, 158, 11, 0.08)", color: "#b45309", border: "1px solid rgba(245, 158, 11, 0.25)", fontSize: "0.85rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                      <MdPending size={18} /> Documents submitted and currently under review by compliance.
                    </div>
                  )}

                  {isLevel3Approved && (
                    <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(34, 197, 94, 0.1)", color: "#16a34a", border: "1px solid rgba(34, 197, 94, 0.25)", fontSize: "0.85rem", fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                      <MdCheckCircle size={18} /> Advanced KYC has been fully verified. Editing is locked.
                    </div>
                  )}

                  {/* Level Progression Stepper */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28, marginTop: 16 }}>
                    {[
                      {
                        level: 1,
                        title: "Level 1: Basic",
                        desc: "Email & Phone Verification",
                        completed: isLevel1Complete || currentLevel >= 1,
                      },
                      {
                        level: 2,
                        title: "Level 2: Identity",
                        desc: "Official Document Verification",
                        completed: isLevel2Approved || currentLevel >= 2,
                      },
                      {
                        level: 3,
                        title: "Level 3: Advanced",
                        desc: "Address & Supporting Docs",
                        completed: isLevel3Approved || currentLevel >= 3,
                      },
                    ].map((stepItem) => (
                      <div
                        key={stepItem.level}
                        style={{
                          padding: "14px 16px",
                          borderRadius: 12,
                          background: stepItem.completed ? "rgba(34, 197, 94, 0.06)" : currentLevel + 1 === stepItem.level ? "var(--bg-hover)" : "var(--bg-card)",
                          border: `1.5px solid ${stepItem.completed ? "#16a34a" : currentLevel + 1 === stepItem.level ? "var(--accent)" : "var(--border)"}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            background: stepItem.completed ? "#16a34a" : currentLevel + 1 === stepItem.level ? "var(--accent)" : "var(--border)",
                            color: "#fff",
                            flexShrink: 0,
                          }}
                        >
                          {stepItem.completed ? "✓" : stepItem.level}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {stepItem.title}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {stepItem.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Tier 1: Basic Email & Phone ── */}
                  <div className="profile-kyc-tier-card">
                    <div className="profile-kyc-tier-header">
                      <div className="profile-kyc-tier-header-info">
                        <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 2px" }}>
                          1. Basic Contact Verification
                        </h4>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                          Verifies user identity via primary email address and SMS/Phone.
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          flexShrink: 0,
                          background: isLevel1Complete ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: isLevel1Complete ? "#16a34a" : "#ca8a04",
                        }}
                      >
                        {isLevel1Complete ? "Completed" : "Incomplete"}
                      </span>
                    </div>

                    <div className="profile-kyc-contact-grid">
                      <div className="profile-kyc-contact-card">
                        <div className="profile-kyc-contact-info">
                          <span className="profile-kyc-contact-label">Email Address</span>
                          <strong className="profile-kyc-contact-value" title={profile?.email || ""}>
                            {profile?.email || "—"}
                          </strong>
                        </div>
                        <span
                          className={`profile-kyc-contact-badge ${
                            profile?.emailVerified
                              ? "profile-kyc-contact-badge--ok"
                              : "profile-kyc-contact-badge--no"
                          }`}
                        >
                          {profile?.emailVerified ? "✓ Verified" : "Unverified"}
                        </span>
                      </div>

                      <div className="profile-kyc-contact-card">
                        <div className="profile-kyc-contact-info">
                          <span className="profile-kyc-contact-label">Phone Number</span>
                          <strong className="profile-kyc-contact-value" title={profile?.phone || ""}>
                            {profile?.phone || "—"}
                          </strong>
                        </div>
                        <span
                          className={`profile-kyc-contact-badge ${
                            profile?.phoneVerified
                              ? "profile-kyc-contact-badge--ok"
                              : "profile-kyc-contact-badge--no"
                          }`}
                        >
                          {profile?.phoneVerified ? "✓ Verified" : "Unverified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Tier 2: Identity Verification (Official Government ID) ── */}
                  <div className="profile-kyc-tier-card">
                    <div className="profile-kyc-tier-header">
                      <div className="profile-kyc-tier-header-info">
                        <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 2px" }}>
                          2. Identity Verification
                        </h4>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                          Upload an official government ID (Passport, National ID, Driver's License, or Voter's Card).
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          flexShrink: 0,
                          background: isLevel2Approved ? "rgba(34, 197, 94, 0.15)" : (formData.governmentIdNumber && (formData.governmentIdImage || profile?.governmentIdImage)) ? "rgba(99, 102, 241, 0.15)" : "rgba(100, 116, 139, 0.15)",
                          color: isLevel2Approved ? "#16a34a" : (formData.governmentIdNumber && (formData.governmentIdImage || profile?.governmentIdImage)) ? "#6366f1" : "#64748b",
                        }}
                      >
                        {isLevel2Approved ? "Verified (Level 2)" : "Identity ID"}
                      </span>
                    </div>

                    <div className="profile-form-row">
                      <div className="profile-form-field">
                        <label className="profile-form-label">Government ID Type *</label>
                        <select
                          className="modal-input"
                          value={formData.governmentIdType}
                          onChange={(e) => setFormData((p) => ({ ...p, governmentIdType: e.target.value }))}
                          disabled={isLevel2Approved}
                        >
                          <option value="">Select ID type</option>
                          <option value="PASSPORT">International Passport</option>
                          <option value="NATIONAL_ID">National ID / NIN</option>
                          <option value="DRIVER_LICENSE">Driver's License</option>
                          <option value="VOTER_CARD">Voter's Card</option>
                          <option value="OTHER">Other Official ID</option>
                        </select>
                      </div>

                      <div className="profile-form-field">
                        <label className="profile-form-label">Government ID Number *</label>
                        <input
                          className="modal-input"
                          type="text"
                          placeholder="e.g. A12345678"
                          value={formData.governmentIdNumber}
                          onChange={(e) => setFormData((p) => ({ ...p, governmentIdNumber: e.target.value }))}
                          disabled={isLevel2Approved}
                        />
                      </div>

                      <div className="profile-form-field" style={{ position: 'relative' }}>
                        <label className="profile-form-label">Upload Official ID Document *</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            className="profile-photo-btn"
                            onClick={() => govFileRef.current?.click()}
                            type="button"
                            disabled={isLevel2Approved}
                            style={{ opacity: isLevel2Approved ? 0.6 : 1, cursor: isLevel2Approved ? "not-allowed" : "pointer", }}
                          >
                            <MdUpload size={14} /> Select File
                          </button>
                          <input
                            ref={govFileRef}
                            type="file"
                            accept="image/*,.pdf"
                            style={{ display: "none" }}
                            onChange={handleGovIdChange}
                            disabled={isLevel2Approved}
                          />
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {formData.governmentIdImage instanceof File
                              ? formData.governmentIdImage.name
                              : profile?.governmentIdImage ? (
                                <a href={profile.governmentIdImage} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                                  View Document
                                </a>
                              ) : "No document"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Tier 3: Advanced KYC (Address & Additional Documents) ── */}
                  <div className="profile-kyc-tier-card" style={{ marginBottom: 24 }}>
                    <div className="profile-kyc-tier-header">
                      <div className="profile-kyc-tier-header-info">
                        <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 2px" }}>
                          3. Advanced KYC (Address & Supporting Documents)
                        </h4>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                          Residential address verification and additional documents (Utility Bill, Bank Statement, Tenancy).
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          flexShrink: 0,
                          background: isLevel3Approved ? "rgba(34, 197, 94, 0.15)" : "rgba(100, 116, 139, 0.15)",
                          color: isLevel3Approved ? "#16a34a" : "#64748b",
                        }}
                      >
                        {isLevel3Approved ? "Verified (Level 3)" : "Advanced KYC"}
                      </span>
                    </div>

                    <div className="profile-form-row" style={{ marginBottom: 14 }}>
                      <div className="profile-form-field">
                        <label className="profile-form-label">Street Address *</label>
                        <input
                          className="modal-input"
                          type="text"
                          placeholder="Full residential or business address"
                          value={formData.address}
                          onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                          disabled={isLevel3Approved}
                        />
                      </div>
                      <div className="profile-form-field">
                        <label className="profile-form-label">City *</label>
                        <input
                          className="modal-input"
                          type="text"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                          disabled={isLevel3Approved}
                        />
                      </div>
                      <div className="profile-form-field">
                        <label className="profile-form-label">Country *</label>
                        <select
                          className="modal-input"
                          value={formData.country}
                          onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                          disabled={isLevel3Approved}
                        >
                          <option value="">Select country</option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="profile-form-row">
                      <div className="profile-form-field">
                        <label className="profile-form-label">Proof of Address (Utility Bill / Tenancy / Bank Statement) *</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            className="profile-photo-btn"
                            onClick={() => proofFileRef.current?.click()}
                            type="button"
                            disabled={isLevel3Approved}
                            style={{ opacity: isLevel3Approved ? 0.6 : 1, cursor: isLevel3Approved ? "not-allowed" : "pointer", position: "relative" }}
                          >
                            <MdUpload size={14} /> Upload Proof
                          </button>
                          <input
                            ref={proofFileRef}
                            type="file"
                            accept="image/*,.pdf"
                            style={{ display: "none" }}
                            onChange={handleProofOfAddressChange}
                            disabled={isLevel3Approved}
                          />
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {formData.proofOfAddressImage instanceof File
                              ? formData.proofOfAddressImage.name
                              : profile?.proofOfAddressImage ? (
                                <a href={profile.proofOfAddressImage} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                                  View Proof
                                </a>
                              ) : ""}
                          </span>
                        </div>
                      </div>

                      <div className="profile-form-field">
                        <label className="profile-form-label">Additional Supporting Document (Optional)</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            className="profile-photo-btn"
                            onClick={() => addDocFileRef.current?.click()}
                            type="button"
                            disabled={isLevel3Approved}
                            style={{ opacity: isLevel3Approved ? 0.6 : 1, cursor: isLevel3Approved ? "not-allowed" : "pointer", position: "relative" }}
                          >
                            <MdUpload size={14} /> Upload Doc
                          </button>
                          <input
                            ref={addDocFileRef}
                            type="file"
                            accept="image/*,.pdf"
                            style={{ display: "none" }}
                            onChange={handleAddDocChange}
                            disabled={isLevel3Approved}
                          />
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {formData.additionalDocumentImage instanceof File
                              ? formData.additionalDocumentImage.name
                              : profile?.additionalDocumentImage ? (
                                <a href={profile.additionalDocumentImage} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                                  View Document
                                </a>
                              ) : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="profile-form-actions" style={{ marginTop: 20 }}>
                    <button
                      className="app_btn app_btn_cancel"
                      onClick={() => fetchProfile()}
                      disabled={isLevel3Approved}
                    >
                      Reset
                    </button>
                    <button
                      id="profile-save-kyc-btn"
                      className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`}
                      onClick={handleSavePersonal}
                      disabled={saving || isLevel3Approved}
                    >
                      <span className="btn_text">
                        {isSubmitted ? "Update Submission" : "Submit KYC Documents"}
                      </span>
                      {saving && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>
              );
            })()}
            {/* ── Security ── */}
            {activeTab === "security" && (
              <div className="profile-panel-section">
                <h3 className="profile-section-heading">Security</h3>
                <p className="profile-section-sub">Update your password.</p>

                <div
                  className="profile-form-field"
                  style={{ marginBottom: 24 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <label
                        className="profile-form-label"
                        htmlFor="profile-twofactor-toggle"
                      >
                        Two-factor authentication
                      </label>
                      <p
                        className="profile-form-sub"
                        style={{
                          margin: 0,
                          color: "var(--text-muted)",
                          fontSize: "0.875rem",
                        }}
                      >
                        Add an extra layer of login security for your account.
                      </p>
                    </div>
                    <label className="profile-toggle" style={{ margin: 0 }}>
                      <input
                        id="profile-twofactor-toggle"
                        type="checkbox"
                        checked={formData.twoFactorEnabled}
                        onChange={(e) =>
                          handleToggleTwoFactor(e.target.checked)
                        }
                        disabled={twoFactorSaving}
                      />
                      <span className="profile-toggle-track" />
                      <span className="profile-toggle-thumb" />
                    </label>
                  </div>
                </div>

                <Formik
                  initialValues={{
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  }}
                  validationSchema={passwordSchema}
                  onSubmit={handlePasswordChange}
                >
                  {({
                    errors,
                    touched,
                    values,
                    handleChange,
                    handleBlur,
                    isSubmitting,
                  }) => (
                    <Form>
                      <div
                        className="profile-form-field"
                        style={{ marginBottom: 16 }}
                      >
                        <label className="profile-form-label">
                          Current password
                        </label>
                        <div className="login_password_wrapper">
                          <input
                            id="profile-current-pw"
                            className={`modal-input ${touched.currentPassword && errors.currentPassword
                              ? "modal-input-error"
                              : ""
                              }`}
                            type={showCurrent ? "text" : "password"}
                            name="currentPassword"
                            placeholder="••••••••"
                            value={values.currentPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <button
                            type="button"
                            className="login_eye_btn"
                            onClick={() => setShowCurrent((p) => !p)}
                            tabIndex={-1}
                          >
                            {showCurrent ? (
                              <IoMdEyeOff size={16} />
                            ) : (
                              <IoMdEye size={16} />
                            )}
                          </button>
                        </div>
                        {touched.currentPassword && errors.currentPassword && (
                          <span className="login_field_error">
                            {errors.currentPassword}
                          </span>
                        )}
                      </div>

                      <div className="profile-form-row">
                        <div className="profile-form-field">
                          <label className="profile-form-label">
                            New password
                          </label>
                          <div className="login_password_wrapper">
                            <input
                              id="profile-new-pw"
                              className={`modal-input ${touched.newPassword && errors.newPassword
                                ? "modal-input-error"
                                : ""
                                }`}
                              type={showNew ? "text" : "password"}
                              name="newPassword"
                              placeholder="••••••••"
                              value={values.newPassword}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <button
                              type="button"
                              className="login_eye_btn"
                              onClick={() => setShowNew((p) => !p)}
                              tabIndex={-1}
                            >
                              {showNew ? (
                                <IoMdEyeOff size={16} />
                              ) : (
                                <IoMdEye size={16} />
                              )}
                            </button>
                          </div>
                          {touched.newPassword && errors.newPassword && (
                            <span className="login_field_error">
                              {errors.newPassword}
                            </span>
                          )}
                        </div>
                        <div className="profile-form-field">
                          <label className="profile-form-label">
                            Confirm password
                          </label>
                          <div className="login_password_wrapper">
                            <input
                              id="profile-confirm-pw"
                              className={`modal-input ${touched.confirmPassword &&
                                errors.confirmPassword
                                ? "modal-input-error"
                                : ""
                                }`}
                              type={showConfirm ? "text" : "password"}
                              name="confirmPassword"
                              placeholder="••••••••"
                              value={values.confirmPassword}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <button
                              type="button"
                              className="login_eye_btn"
                              onClick={() => setShowConfirm((p) => !p)}
                              tabIndex={-1}
                            >
                              {showConfirm ? (
                                <IoMdEyeOff size={16} />
                              ) : (
                                <IoMdEye size={16} />
                              )}
                            </button>
                          </div>
                          {touched.confirmPassword &&
                            errors.confirmPassword && (
                              <span className="login_field_error">
                                {errors.confirmPassword}
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="profile-form-actions">
                        <button
                          type="button"
                          className="app_btn app_btn_cancel"
                          onClick={() => { }}
                        >
                          <MdClose size={14} style={{ marginRight: 4 }} />{" "}
                          Cancel
                        </button>
                        <button
                          id="profile-update-pw-btn"
                          type="submit"
                          disabled={isSubmitting}
                          className={`app_btn app_btn_confirm ${isSubmitting ? "btn_loading" : ""
                            }`}
                          style={{ position: "relative", minWidth: 140 }}
                        >
                          <span
                            className="btn_text"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <MdArrowForward size={14} /> Update password
                          </span>
                          {isSubmitting && (
                            <span
                              className="btn_loader"
                              style={{ width: 16, height: 16 }}
                            />
                          )}
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
                <h3 className="profile-section-heading">
                  Notification Preferences
                </h3>
                <p className="profile-section-sub">
                  Choose how we notify you about account activity.
                </p>

                {settingsLoading && !settings ? (
                  <div
                    style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
                  >
                    Loading preferences…
                  </div>
                ) : (
                  <div className="profile-notif-list">
                    <NotifCard
                      title="Push Notifications"
                      desc="Receive alerts on your device for immediate updates."
                      checked={settings?.pushEnabled ?? true}
                      onChange={(e) =>
                        handleNotifToggle("pushEnabled", e.target.checked)
                      }
                      disabled={updatingNotif}
                    />
                    <NotifCard
                      title="Email Notifications"
                      desc="Receive a summary of important alerts via email."
                      checked={settings?.emailEnabled ?? true}
                      onChange={(e) =>
                        handleNotifToggle("emailEnabled", e.target.checked)
                      }
                      disabled={updatingNotif}
                    />
                    <NotifCard
                      title="SMS Notifications"
                      desc="Receive text messages for urgent activity."
                      badge="Premium"
                      checked={settings?.smsEnabled ?? false}
                      onChange={(e) =>
                        handleNotifToggle("smsEnabled", e.target.checked)
                      }
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
                  <p className="profile-section-sub">
                    Manage your active sessions across devices.
                  </p>
                  <div className="profile-session-row">
                    <button
                      id="profile-logout-btn"
                      onClick={async () => {
                        setLoggingOut(true);
                        await logout();
                      }}
                      disabled={loggingOut}
                      className={`app_btn app_btn_logout ${loggingOut ? "btn_loading" : ""
                        }`}
                      style={{ position: "relative" }}
                    >
                      <span className="btn_text">Logout</span>
                      {loggingOut && <ButtonLoader />}
                    </button>
                    <button
                      id="profile-logout-all-btn"
                      onClick={async () => {
                        setLoggingOutAll(true);
                        await logoutAll();
                      }}
                      disabled={loggingOutAll}
                      className={`app_btn app_btn_logout_all ${loggingOutAll ? "btn_loading" : ""
                        }`}
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
                  <p className="profile-danger-sub">
                    Permanently remove your account from Nora.
                  </p>
                  <p className="profile-danger-desc">
                    This will sign you out of every device, anonymize your name
                    and email, and revoke every saved login. Orders and audit
                    records you created stay attached to the business so other
                    team members can still see history.{" "}
                    <strong>You can't undo this.</strong>
                  </p>
                  <button
                    id="profile-delete-btn"
                    className="app_btn"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#dc2626",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                    onClick={() =>
                      toast.error(
                        "Please contact support to delete your account.",
                      )
                    }
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
