import { useState, useEffect, useRef } from "react";
import "./Operator.css";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import {
  MdCircle,
  MdWork,
  MdUpload,
  MdCheck,
  MdClose,
  MdPerson,
  MdCalendarToday,
  MdTimer,
  MdVerified,
  MdAdd,
  MdExpandMore,
  MdExpandLess,
  MdAttachMoney,
  MdAccessTime,
  MdNotes,
  MdLocationOn,
  MdChevronRight,
  MdOutlineWorkOutline,
  MdOutlineCheckCircle,
  MdOutlineHistory,
} from "react-icons/md";
import { LuStore } from "react-icons/lu";
import OperatorKioskDrawer from "./OperatorKioskDrawer";

/* ── Duration options ───────────────────────────────────────── */
const DURATION_OPTIONS = [
  { key: "1m", label: "1 Month", days: 30 },
  { key: "2m", label: "2 Months", days: 60 },
  { key: "3m", label: "3 Months", days: 90 },
  { key: "6m", label: "6 Months", days: 180 },
  { key: "1y", label: "1 Year", days: 365 },
  { key: "2y", label: "2 Years", days: 730 },
];

/* ── status colour maps ──────────────────────────────────────── */
const offerStatusColors = {
  PENDING: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  ACCEPTED: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  REJECTED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.25)" },
  TERMINATED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.25)" },
  EXPIRED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.25)" },
  ACTIVE: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
};

const profileStatusColors = {
  PENDING: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  APPROVED: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  REJECTED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.25)" },
  SUSPENDED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.25)" },
};

function StatusBadge({ status, colors }) {
  const s = colors[status] || Object.values(colors)[0];
  return (
    <span className="op-status-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <MdCircle size={5} />
      {status}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysRemaining(endDate) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
}

/* ── Meta chip ───────────────────────────────────────────────── */
function MetaChip({ icon: Icon, label, color, bg, border }) {
  return (
    <span className="op-meta-chip" style={bg ? { background: bg, border: `1px solid ${border}`, color } : {}}>
      {Icon && <Icon size={11} style={{ color: color || "var(--text-muted)" }} />}
      <span style={color ? { color } : {}}>{label}</span>
    </span>
  );
}

/* ── Create Profile Form ─────────────────────────────────────── */
function CreateProfileForm({ states, onCreated, submitting, setSubmitting, existing, onCancel }) {
  const [stateId, setStateId] = useState(existing?.state?.id || existing?.stateId || "");
  const [certFile, setCertFile] = useState(null);
  const [certPreview, setCertPreview] = useState(existing?.certification || null);
  const [certName, setCertName] = useState(existing?.certification ? "Uploaded · change" : "");
  const certRef = useRef(null);

  const handleCertFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setCertFile(f);
    setCertName(f.name);
    if (f.type.startsWith("image/")) setCertPreview(URL.createObjectURL(f));
    else setCertPreview(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (stateId) fd.append("stateId", stateId);
      if (certFile) fd.append("certification", certFile);
      await api.post("/kiosk/operator/profile", fd);
      toast.success(existing ? "Operator profile updated!" : "Operator profile created!");
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="op-onboard-card">
      <div className="op-onboard-icon">
        <MdOutlineWorkOutline size={32} />
      </div>
      <h3 className="op-onboard-title">{existing ? "Update Operator Profile" : "Become an Operator"}</h3>
      <p className="op-onboard-sub">
        {existing ? "Update your operator location and certification documents." : "Create your operator profile to receive job offers from Kiosk owners."}
      </p>

      <div className="op-onboard-form">
        {/* Certification upload */}
        <div className="form-field">
          <label className="modal-label">Certification Document <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
          <div
            className="op-upload-zone"
            onClick={() => certRef.current?.click()}
          >
            {certPreview ? (
              <div className="op-upload-preview-wrap">
                {certPreview.startsWith("blob:") || certPreview.includes("res.cloudinary.com") ? (
                  <img src={certPreview} alt="" className="op-upload-preview" />
                ) : (
                  <div className="op-upload-icon">
                    <MdUpload size={16} style={{ color: "var(--accent)" }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="op-upload-icon">
                <MdUpload size={16} style={{ color: "var(--accent)" }} />
              </div>
            )}
            <div className="op-upload-text">
              <span className="op-upload-name">
                {certName || "Upload certificate"}
              </span>
              <span className="op-upload-hint">PDF or image · Food Handler Certificate</span>
            </div>
          </div>
          <input
            ref={certRef}
            type="file"
            accept="image/*,application/pdf"
            style={{ display: "none" }}
            onChange={handleCertFile}
          />
        </div>

        {states.length > 0 && (
          <div className="form-field">
            <label className="modal-label">State <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
            <select className="modal-input" value={stateId} onChange={(e) => setStateId(e.target.value)}>
              <option value="">Select state…</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.country ? `, ${s.country}` : ""}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          {onCancel && (
            <button
              type="button"
              className="app_btn app_btn_cancel"
              style={{ flex: 1, height: 44 }}
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel Edit
            </button>
          )}
          <button
            id="op-create-profile-btn"
            className={`app_btn app_btn_confirm${submitting ? " btn_loading" : ""}`}
            style={{ flex: 1, height: 44, position: "relative" }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            <span className="btn_text">{existing ? "Update Profile" : "Create Profile"}</span>
            {submitting && <span className="btn_loader" style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Renew Modal ─────────────────────────────────────────────── */
function RenewModal({ offer, onClose, onDone }) {
  const [renewDuration, setRenewDuration] = useState("1m");
  const [saving, setSaving] = useState(false);

  const handleRenew = async () => {
    const days = DURATION_OPTIONS.find((d) => d.key === renewDuration)?.days || 30;
    setSaving(true);
    try {
      await api.patch(`/kiosk/operator/job-offers/${offer.id}/renew`, { durationDays: days });
      toast.success("Contract renewed!");
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Renew failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(4px)" }}
    >
      <div onClick={(e) => e.stopPropagation()} className="op-modal-box">
        <h3 className="op-modal-title">Renew Contract</h3>
        <p className="op-modal-sub">How long would you like to extend?</p>

        <div className="form-field">
          <label className="modal-label">Extension Duration</label>
          <div className="op-duration-grid">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`op-duration-btn ${renewDuration === opt.key ? "op-duration-btn--active" : ""}`}
                onClick={() => setRenewDuration(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="op-modal-actions">
          <button className="app_btn app_btn_cancel" style={{ flex: 1, height: 40 }} onClick={onClose}>Cancel</button>
          <button
            className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
            style={{ flex: 1, height: 40, position: "relative" }}
            onClick={handleRenew}
            disabled={saving}
          >
            <span className="btn_text">Extend</span>
            {saving && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Job Offer Card ──────────────────────────────────────────── */
function JobOfferCard({ offer, onAction }) {
  const [actioning, setActioning] = useState(null);
  const daysLeft = daysRemaining(offer.endDate);
  const sc = offerStatusColors[offer.status] || offerStatusColors.PENDING;

  const handleRespond = async (status) => {
    setActioning(status);
    try {
      await api.patch(`/kiosk/operator/job-offers/${offer.id}/respond`, { status });
      toast.success(`Offer ${status.toLowerCase()}!`);
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActioning(null);
    }
  };

  const handleTerminate = async () => {
    if (!window.confirm("Terminate this contract?")) return;
    setActioning("TERMINATE");
    try {
      await api.patch(`/kiosk/operator/job-offers/${offer.id}/terminate`);
      toast.success("Contract terminated.");
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || "Terminate failed");
    } finally {
      setActioning(null);
    }
  };

  const kioskLabel = offer.kiosk?.serialNumber || (offer.kioskId ? `#${offer.kioskId.slice(0, 8).toUpperCase()}` : "—");
  const ownerLabel = offer.offeredBy?.fullName || offer.offeredBy?.name || offer.owner?.fullName || null;

  // Accent top stripe color
  const stripe =
    offer.status === "PENDING" ? "#f59e0b" :
      (offer.status === "ACTIVE" || offer.status === "ACCEPTED") ? "#22c55e" :
        "transparent";

  return (
    <div className="op-offer-card">
      <div className="op-offer-stripe" style={{ background: stripe }} />

      <div className="op-offer-body">
        {/* Header row */}
        <div className="op-offer-header">
          <div className="op-offer-kiosk-icon">
            <LuStore size={15} />
          </div>
          <div className="op-offer-kiosk-info">
            <span className="op-offer-kiosk-serial">{kioskLabel}</span>
            {ownerLabel && <span className="op-offer-kiosk-from">from {ownerLabel}</span>}
          </div>
          <span className="op-status-badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, flexShrink: 0 }}>
            <MdCircle size={5} />
            {offer.status}
          </span>
        </div>

        {/* Meta chips */}
        <div className="op-offer-meta">
          <MetaChip icon={MdTimer} label={DURATION_OPTIONS.find((d) => d.days === offer.durationDays)?.label || `${offer.durationDays}d`} />
          {offer.startDate && <MetaChip icon={MdCalendarToday} label={`Start: ${formatDate(offer.startDate)}`} />}
          {offer.endDate && <MetaChip icon={MdCalendarToday} label={`End: ${formatDate(offer.endDate)}`} />}
          {offer.status === "ACTIVE" && daysLeft !== null && (
            <MetaChip
              icon={MdTimer}
              label={daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
              color={daysLeft <= 7 ? "#ef4444" : undefined}
              bg={daysLeft <= 7 ? "rgba(239,68,68,0.08)" : undefined}
              border={daysLeft <= 7 ? "rgba(239,68,68,0.25)" : undefined}
            />
          )}
          {offer.salary != null && (
            <MetaChip
              icon={MdAttachMoney}
              label={`₦${Number(offer.salary).toLocaleString()}/mo`}
              color="#16a34a"
              bg="rgba(34,197,94,0.08)"
              border="rgba(34,197,94,0.2)"
            />
          )}
          {offer.workingHours && <MetaChip icon={MdAccessTime} label={offer.workingHours} />}
          {(offer.kiosk?.location?.name || offer.kiosk?.locationId) && (
            <MetaChip
              icon={MdLocationOn}
              label={offer.kiosk?.location?.city || offer.kiosk?.location?.name || "Location assigned"}
            />
          )}
        </div>

        {/* Note */}
        {offer.note && (
          <div className="op-offer-note">
            <MdNotes size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 1 }} />
            <p>{offer.note}</p>
          </div>
        )}

        {/* Actions */}
        {offer.status === "PENDING" && (
          <div className="op-offer-actions">
            <button
              className="op-action-btn op-action-decline"
              onClick={() => handleRespond("REJECTED")}
              disabled={!!actioning}
            >
              {actioning === "REJECTED" ? <span className="btn_loader" style={{ width: 13, height: 13 }} /> : <><MdClose size={13} /> Decline</>}
            </button>
            <button
              className="op-action-btn op-action-accept"
              onClick={() => handleRespond("ACCEPTED")}
              disabled={!!actioning}
            >
              {actioning === "ACCEPTED" ? <span className="btn_loader" style={{ width: 13, height: 13 }} /> : <><MdCheck size={13} /> Accept Offer</>}
            </button>
          </div>
        )}
        {(offer.status === "ACTIVE" || offer.status === "ACCEPTED") && (
          <button
            className="op-action-btn op-action-terminate"
            onClick={handleTerminate}
            disabled={!!actioning}
            style={{ width: "100%" }}
          >
            {actioning === "TERMINATE" ? <span className="btn_loader" style={{ width: 13, height: 13 }} /> : <><MdClose size={13} /> Terminate Contract</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function OperatorHome() {
  const [openCartId, setOpenCartId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // pending | active | history
  const [isEditing, setIsEditing] = useState(false);

  const fetchAll = async () => {
    try {
      const [profileRes, offersRes] = await Promise.allSettled([
        api.get("/kiosk/operator/profile/me"),
        api.get("/kiosk/operator/job-offers"),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.data.data);
      } else {
        setProfile(null);
      }

      if (offersRes.status === "fulfilled") {
        const data = offersRes.value.data.data;
        setOffers(data?.myOffers || data?.jobOffers || []);
      }
    } catch {
      toast.error("Failed to load operator data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    api.get("/config/state").then((res) => {
      const d = res.data.data;
      setStates(Array.isArray(d) ? d : d?.items || []);
    }).catch(() => { });
  }, []);

  const pendingOffers = offers.filter((o) => o.status === "PENDING");
  const activeOffers = offers.filter((o) => o.status === "ACTIVE" || o.status === "ACCEPTED");
  const pastOffers = offers.filter((o) => o.status !== "PENDING" && o.status !== "ACTIVE" && o.status !== "ACCEPTED");

  // Auto-select a non-empty tab on load
  useEffect(() => {
    if (!loading) {
      if (pendingOffers.length > 0) setActiveTab("pending");
      else if (activeOffers.length > 0) setActiveTab("active");
      else setActiveTab("history");
    }
  }, [loading]);

  const activeCarts = activeOffers.reduce((acc, offer) => {
    const id = offer.kioskId || offer.kiosk?.id;
    if (id && !acc.find((c) => c.id === id)) {
      acc.push({
        id,
        serialNumber: offer.kiosk?.serialNumber || id.slice(0, 8).toUpperCase(),
        location: offer.kiosk?.location,
        isOnline: offer.kiosk?.isOnline,
        offerId: offer.id,
        salary: offer.salary,
        workingHours: offer.workingHours,
        endDate: offer.endDate,
      });
    }
    return acc;
  }, []);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="page_wrapper op-page">
        <div className="op-skeleton-profile" />
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <div className="skeleton_shimmer skeleton_rect" style={{ height: 36, borderRadius: 10, flex: 1 }} />
          <div className="skeleton_shimmer skeleton_rect" style={{ height: 36, borderRadius: 10, flex: 1 }} />
          <div className="skeleton_shimmer skeleton_rect" style={{ height: 36, borderRadius: 10, flex: 1 }} />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="skeleton_shimmer skeleton_rect" style={{ height: 130, borderRadius: 14, marginBottom: 10 }} />
        ))}
      </div>
    );
  }

  const tabOffers = activeTab === "pending" ? pendingOffers : activeTab === "active" ? activeOffers : pastOffers;

  // State 2: Profile Awaiting Approval
  if (profile && !profile.isApproved && !isEditing) {
    return (
      <div className="app-pending-container">
        <div className="app-pending-card">
          <div className="app-pending-header">
            <div className="app-pending-badge">
              <span className="pulse-dot" />
              Under Review
            </div>
            <h2 className="app-pending-title">Application Submitted</h2>
            <p className="app-pending-subtitle">
              Your operator profile is currently pending administrator approval.
              Once approved, you will be able to receive job offers and manage kiosks.
            </p>
          </div>

          {/* Stepper Timeline */}
          <div className="app-timeline">
            <div className="app-timeline-step completed">
              <div className="app-step-node">
                <MdCheck size={18} />
              </div>
              <span className="app-step-label">Apply</span>
              <span className="app-step-desc">Profile created</span>
            </div>
            <div className="app-timeline-step active">
              <div className="app-step-node">
                <MdAccessTime size={18} />
              </div>
              <span className="app-step-label">Review</span>
              <span className="app-step-desc">Operator verification</span>
            </div>
            <div className="app-timeline-step">
              <div className="app-step-node">3</div>
              <span className="app-step-label">Activate</span>
              <span className="app-step-desc">Receive job offers</span>
            </div>
          </div>

          {/* Submitted Info Grid */}
          <div className="app-review-details">
            <div className="app-review-sec">
              <h4 className="app-review-sectitle">Profile Details</h4>
              <div className="app-review-info-list">
                <div className="app-review-info-item">
                  <span className="app-review-label">Operating State</span>
                  <span className="app-review-value">{profile.state?.name || "—"}</span>
                </div>
                <div className="app-review-info-item">
                  <span className="app-review-label">Role Type</span>
                  <span className="app-review-value">Kiosk Operator</span>
                </div>
                <div className="app-review-info-item">
                  <span className="app-review-label">Submitted On</span>
                  <span className="app-review-value">{formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="app-review-sec">
              <h4 className="app-review-sectitle">Uploaded Documents</h4>
              <div className="app-doc-cards">
                {profile.certification ? (
                  <a
                    href={profile.certification}
                    target="_blank"
                    rel="noreferrer"
                    className="app-doc-card"
                  >
                    <div className="app-doc-icon">
                      <MdOutlineWorkOutline size={16} />
                    </div>
                    <div className="app-doc-meta">
                      <span className="app-doc-name">Food Handler Certificate</span>
                      <span className="app-doc-action">View Document →</span>
                    </div>
                  </a>
                ) : (
                  <div className="app-doc-card" style={{ opacity: 0.5, cursor: "default" }}>
                    <div className="app-doc-icon" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>
                      <MdOutlineWorkOutline size={16} />
                    </div>
                    <div className="app-doc-meta">
                      <span className="app-doc-name" style={{ color: "var(--text-muted)" }}>Food Handler Certificate</span>
                      <span className="app-doc-action" style={{ color: "var(--text-muted)" }}>Not Provided</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="app-refresh-btn-glowing"
              onClick={() => setIsEditing(true)}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <MdPerson size={18} />
              <span>Edit Profile</span>
            </button>

            <button
              className="app-refresh-btn-glowing"
              onClick={fetchAll}
            >
              <MdOutlineHistory size={18} />
              <span>Check Status</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page_wrapper op-page">
      {/* ── Page header ── */}
      <div className="op-page-header">
        {/* <div>
          <h1 className="op-page-title">Operator</h1>
          <p className="op-page-sub">Manage your profile and job offers</p>
        </div> */}
        {profile && (
          <div className="op-hirable-chip">
            {profile.isApproved
              ? <><MdVerified size={14} /> Hirable</>
              : <><MdCircle size={7} /> Pending approval</>
            }
          </div>
        )}
      </div>

      {/* ── Profile or Onboarding ── */}
      {!profile || isEditing ? (
        <CreateProfileForm
          states={states}
          onCreated={() => {
            fetchAll();
            setIsEditing(false);
          }}
          submitting={creatingProfile}
          setSubmitting={setCreatingProfile}
          existing={isEditing ? profile : null}
          onCancel={isEditing ? () => setIsEditing(false) : null}
        />
      ) : (
        <div className="op-profile-card">
          <div className="op-profile-avatar">
            <MdPerson size={22} />
          </div>
          <div className="op-profile-info">
            <span className="op-profile-name">My Operator Profile</span>
            <StatusBadge status={profile.isApproved ? "APPROVED" : "PENDING"} colors={profileStatusColors} />
          </div>
          <div className="op-profile-meta">
            {profile.state?.name && (
              <span className="op-meta-chip"><MdLocationOn size={11} style={{ color: "var(--text-muted)" }} /> {profile.state.name}</span>
            )}
            {profile.createdAt && (
              <span className="op-meta-chip"><MdCalendarToday size={11} style={{ color: "var(--text-muted)" }} /> {formatDate(profile.createdAt)}</span>
            )}
            {profile.certification && (
              <a href={profile.certification} target="_blank" rel="noreferrer" className="op-cert-link">
                View Cert →
              </a>
            )}
          </div>
          {!profile.isApproved && (
            <p className="op-pending-notice">
              Your profile is awaiting admin approval before you can receive job offers.
            </p>
          )}
        </div>
      )}

      {/* ── Active Kiosks ── */}
      {profile && activeCarts.length > 0 && (
        <div className="op-section">
          <div className="op-section-header">
            <span className="op-section-label">My Kiosk</span>
            <span className="op-count-badge">{activeCarts.length}</span>
          </div>
          <div className="op-kiosk-list">
            {activeCarts.map((c) => (
              <button
                key={c.id}
                id={`op-kiosk-${c.id}`}
                className="op-kiosk-card"
                onClick={() => setOpenCartId(c.id)}
              >
                <div className="op-kiosk-icon">
                  <MdWork size={19} />
                </div>
                <div className="op-kiosk-details">
                  <div className="op-kiosk-top-row">
                    <span className="op-kiosk-serial">{c.serialNumber}</span>
                    <span className={`op-online-dot ${c.isOnline ? "op-online-dot--on" : ""}`}>
                      <span />
                      {c.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="op-kiosk-meta-row">
                    {c.location?.name && <span>📍 {c.location.name}</span>}
                    {c.workingHours && <span>🕐 {c.workingHours}</span>}
                    {c.salary && <span style={{ color: "#16a34a", fontWeight: 600 }}>₦{Number(c.salary).toLocaleString()}/mo</span>}
                    {c.endDate && <span>ends {formatDate(c.endDate)}</span>}
                  </div>
                </div>
                <MdChevronRight size={20} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Job Offers — tab layout ── */}
      {profile && (
        <div className="op-section">
          <div className="op-section-header" style={{ marginBottom: 12 }}>
            <span className="op-section-label">Job Offers</span>
            <span className="op-count-badge">{offers.length}</span>
            {pendingOffers.length > 0 && (
              <span className="op-pending-badge">{pendingOffers.length} pending</span>
            )}
          </div>

          {/* Tab bar */}
          <div className="op-offer-tabs">
            <button
              id="op-tab-pending"
              className={`op-offer-tab ${activeTab === "pending" ? "op-offer-tab--active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <MdCircle size={7} style={{ color: "#f59e0b" }} />
              Pending
              {pendingOffers.length > 0 && <span className="op-tab-count">{pendingOffers.length}</span>}
            </button>
            <button
              id="op-tab-active"
              className={`op-offer-tab ${activeTab === "active" ? "op-offer-tab--active" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              <MdOutlineCheckCircle size={13} style={{ color: "#22c55e" }} />
              Active
              {activeOffers.length > 0 && <span className="op-tab-count">{activeOffers.length}</span>}
            </button>
            <button
              id="op-tab-history"
              className={`op-offer-tab ${activeTab === "history" ? "op-offer-tab--active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <MdOutlineHistory size={13} />
              History
              {pastOffers.length > 0 && <span className="op-tab-count">{pastOffers.length}</span>}
            </button>
          </div>

          {/* Tab content */}
          <div key={activeTab} className="op-offers-list">
            {tabOffers.length === 0 ? (
              <div className="op-empty-state">
                <MdWork size={30} style={{ opacity: 0.2 }} />
                <p className="kiosk_empty_title">
                  {activeTab === "pending" ? "No pending offers" :
                    activeTab === "active" ? "No active contracts" :
                      "No past offers"}
                </p>
                <p className="kiosk_empty_sub">
                  {activeTab === "pending" && (profile.isApproved
                    ? "Kiosk owners can send you offers once your profile is visible."
                    : "Once approved, job offers will appear here.")}
                  {activeTab === "active" && "Active contracts will appear here."}
                  {activeTab === "history" && "Completed and terminated contracts appear here."}
                </p>
              </div>
            ) : (
              tabOffers.map((o) => (
                <JobOfferCard key={o.id} offer={o} onAction={fetchAll} />
              ))
            )}
          </div>
        </div>
      )}

      <OperatorKioskDrawer
        kioskId={openCartId}
        onClose={() => setOpenCartId(null)}
        onUpdate={fetchAll}
      />
    </div>
  );
}
