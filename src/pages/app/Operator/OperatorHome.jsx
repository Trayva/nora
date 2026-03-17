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
  MdOpenInNew,
  MdChevronRight,
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";
import OperatorCartDrawer from "./OperatorCartDrawer";

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
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  ACCEPTED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  REJECTED: {
    bg: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.25)",
  },
  TERMINATED: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
  EXPIRED: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
  ACTIVE: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
};

const profileStatusColors = {
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  APPROVED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  REJECTED: {
    bg: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.25)",
  },
  SUSPENDED: {
    bg: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.25)",
  },
};

function StatusBadge({ status, colors }) {
  const s = colors[status] || Object.values(colors)[0];
  return (
    <span
      className="icart_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      <MdCircle size={6} />
      {status}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysRemaining(endDate) {
  if (!endDate) return null;
  const diff = Math.ceil(
    (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24),
  );
  return diff;
}

/* ── Create Profile Form ─────────────────────────────────────── */
function CreateProfileForm({ states, onCreated, submitting, setSubmitting }) {
  const [stateId, setStateId] = useState("");
  const [certFile, setCertFile] = useState(null);
  const [certPreview, setCertPreview] = useState(null);
  const certRef = useRef(null);

  const handleCertFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setCertFile(f);
    if (f.type.startsWith("image/")) setCertPreview(URL.createObjectURL(f));
    else setCertPreview(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (stateId) fd.append("stateId", stateId);
      if (certFile) fd.append("certification", certFile);
      await api.post("/icart/operator/profile", fd);
      toast.success("Operator profile created!");
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="op_create_profile_card">
      <div className="op_create_profile_icon">
        <MdPerson size={28} />
      </div>
      <h3 className="op_create_profile_title">Become an Operator</h3>
      <p className="op_create_profile_sub">
        Create your operator profile to receive job offers from iCart owners.
      </p>

      <div className="op_create_profile_form">
        {/* Certification file upload */}
        <div className="form-field">
          <label className="modal-label">
            Certification Document (optional)
          </label>
          <div
            onClick={() => certRef.current?.click()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              background: "var(--bg-hover)",
              border: "1px dashed var(--border)",
              borderRadius: 10,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            {certPreview ? (
              <img
                src={certPreview}
                alt=""
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  objectFit: "cover",
                  flexShrink: 0,
                  border: "1px solid var(--border)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "var(--bg-active)",
                  border: "1px solid rgba(203,108,220,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MdUpload size={14} style={{ color: "var(--accent)" }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: certFile ? "var(--text-body)" : "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {certFile ? certFile.name : "Upload certificate (PDF or image)"}
              </div>
              <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
                e.g. Food Handler Certificate
              </div>
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
            <label className="modal-label">State (optional)</label>
            <select
              className="modal-input"
              value={stateId}
              onChange={(e) => setStateId(e.target.value)}
            >
              <option value="">Select state…</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.country ? `, ${s.country}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          className={`app_btn app_btn_confirm${submitting ? " btn_loading" : ""}`}
          style={{ width: "100%", height: 42, position: "relative" }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          <span className="btn_text">Create Profile</span>
          {submitting && (
            <span className="btn_loader" style={{ width: 18, height: 18 }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Renew Modal ─────────────────────────────────────────────── */
function RenewModal({ offer, onClose, onDone }) {
  const [renewDuration, setRenewDuration] = useState("1m");
  const [saving, setSaving] = useState(false);

  const handleRenew = async () => {
    const days =
      DURATION_OPTIONS.find((d) => d.key === renewDuration)?.days || 30;
    setSaving(true);
    try {
      await api.patch(`/icart/operator/job-offers/${offer.id}/renew`, {
        durationDays: days,
      });
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
      className="modal_backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 380,
        }}
      >
        <h3
          style={{
            margin: "0 0 4px",
            fontSize: "1rem",
            fontWeight: 800,
            color: "var(--text-heading)",
          }}
        >
          Renew Contract
        </h3>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
          }}
        >
          How long would you like to extend?
        </p>

        <div className="form-field">
          <label className="modal-label">Extension Duration</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRenewDuration(opt.key)}
                style={{
                  height: 40,
                  border: "1px solid var(--border)",
                  borderRadius: 9,
                  cursor: "pointer",
                  background:
                    renewDuration === opt.key
                      ? "var(--bg-active)"
                      : "var(--bg-hover)",
                  color:
                    renewDuration === opt.key
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  borderColor:
                    renewDuration === opt.key
                      ? "rgba(203,108,220,0.4)"
                      : "var(--border)",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button
            className="app_btn app_btn_cancel"
            style={{ flex: 1, height: 40 }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
            style={{ flex: 1, height: 40, position: "relative" }}
            onClick={handleRenew}
            disabled={saving}
          >
            <span className="btn_text">Extend Contract</span>
            {saving && (
              <span className="btn_loader" style={{ width: 16, height: 16 }} />
            )}
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
      await api.patch(`/icart/operator/job-offers/${offer.id}/respond`, {
        status,
      });
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
      await api.patch(`/icart/operator/job-offers/${offer.id}/terminate`);
      toast.success("Contract terminated.");
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || "Terminate failed");
    } finally {
      setActioning(null);
    }
  };

  // Cart name / serial — try several possible shapes
  // cart info comes directly on offer.cart
  const cartLabel =
    offer.cart?.serialNumber ||
    (offer.cartId ? `#${offer.cartId.slice(0, 8).toUpperCase()}` : "—");

  // who sent the offer — offeredBy.fullName
  const ownerLabel =
    offer.offeredBy?.fullName ||
    offer.offeredBy?.name ||
    offer.owner?.fullName ||
    "—";

  return (
    <>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        {/* Coloured top accent bar for pending */}
        {offer.status === "PENDING" && (
          <div style={{ height: 3, background: "rgba(234,179,8,0.7)" }} />
        )}
        {(offer.status === "ACTIVE" || offer.status === "ACCEPTED") && (
          <div style={{ height: 3, background: "rgba(34,197,94,0.7)" }} />
        )}

        <div style={{ padding: "14px 16px" }}>
          {/* Top row: cart icon + serial + from + status badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LuShoppingCart size={15} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 800,
                  color: "var(--text-heading)",
                  fontFamily: "monospace",
                }}
              >
                {cartLabel}
              </div>
              {ownerLabel !== "—" && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: 1,
                  }}
                >
                  from {ownerLabel}
                </div>
              )}
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.65rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 999,
                background: sc.bg,
                color: sc.color,
                border: `1px solid ${sc.border}`,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                flexShrink: 0,
              }}
            >
              <MdCircle size={5} />
              {offer.status}
            </span>
          </div>

          {/* Meta row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom:
                offer.status === "PENDING" ||
                offer.status === "ACTIVE" ||
                offer.status === "ACCEPTED"
                  ? 14
                  : 0,
            }}
          >
            <div
              className="icart_meta_row"
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "5px 10px",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <MdTimer size={12} style={{ color: "var(--text-muted)" }} />
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-body)",
                }}
              >
                {DURATION_OPTIONS.find((d) => d.days === offer.durationDays)
                  ?.label || `${offer.durationDays} days`}
              </span>
            </div>
            {offer.startDate && (
              <div
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "5px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <MdCalendarToday
                  size={11}
                  style={{ color: "var(--text-muted)" }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-body)",
                  }}
                >
                  Start: {formatDate(offer.startDate)}
                </span>
              </div>
            )}
            {offer.endDate && (
              <div
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "5px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <MdCalendarToday
                  size={11}
                  style={{ color: "var(--text-muted)" }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-body)",
                  }}
                >
                  End: {formatDate(offer.endDate)}
                </span>
              </div>
            )}
            {offer.status === "ACTIVE" && daysLeft !== null && (
              <div
                style={{
                  background:
                    daysLeft <= 7 ? "rgba(239,68,68,0.08)" : "var(--bg-hover)",
                  border: `1px solid ${daysLeft <= 7 ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
                  borderRadius: 8,
                  padding: "5px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <MdTimer
                  size={11}
                  style={{
                    color: daysLeft <= 7 ? "#ef4444" : "var(--text-muted)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: daysLeft <= 7 ? "#ef4444" : "var(--text-body)",
                  }}
                >
                  {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                </span>
              </div>
            )}
            {offer.salary != null && (
              <div
                style={{
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 8,
                  padding: "5px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <MdAttachMoney size={13} style={{ color: "#16a34a" }} />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#16a34a",
                  }}
                >
                  ₦{Number(offer.salary).toLocaleString()}/mo
                </span>
              </div>
            )}
            {offer.workingHours && (
              <div
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "5px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <MdAccessTime
                  size={11}
                  style={{ color: "var(--text-muted)" }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-body)",
                  }}
                >
                  {offer.workingHours}
                </span>
              </div>
            )}
            {(offer.cart?.location?.name || offer.cart?.locationId) && (
              <div
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "5px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <MdLocationOn
                  size={11}
                  style={{ color: "var(--text-muted)" }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-body)",
                  }}
                >
                  {offer.cart?.location?.name || `Location assigned`}
                </span>
              </div>
            )}
          </div>

          {/* Note from owner */}
          {offer.note && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "10px 12px",
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 9,
                marginBottom: 14,
              }}
            >
              <MdNotes
                size={14}
                style={{
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "var(--text-body)",
                  lineHeight: 1.5,
                }}
              >
                {offer.note}
              </p>
            </div>
          )}

          {/* Actions — PENDING */}
          {offer.status === "PENDING" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: 8,
              }}
            >
              <button
                className="app_btn"
                style={{
                  height: 38,
                  border: "1px solid var(--border)",
                  background: "var(--bg-hover)",
                  color: "var(--text-body)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  borderRadius: 9,
                  cursor: "pointer",
                  opacity: actioning ? 0.5 : 1,
                }}
                onClick={() => handleRespond("REJECTED")}
                disabled={!!actioning}
              >
                {actioning === "REJECTED" ? (
                  <span
                    className="btn_loader"
                    style={{ width: 14, height: 14 }}
                  />
                ) : (
                  <>
                    <MdClose size={14} /> Decline
                  </>
                )}
              </button>
              <button
                className="app_btn app_btn_confirm"
                style={{
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  position: "relative",
                }}
                onClick={() => handleRespond("ACCEPTED")}
                disabled={!!actioning}
              >
                {actioning === "ACCEPTED" ? (
                  <span
                    className="btn_loader"
                    style={{ width: 14, height: 14 }}
                  />
                ) : (
                  <>
                    <MdCheck size={14} /> Accept Offer
                  </>
                )}
              </button>
            </div>
          )}

          {/* Actions — ACTIVE / ACCEPTED */}
          {(offer.status === "ACTIVE" || offer.status === "ACCEPTED") && (
            <button
              className="app_btn"
              style={{
                width: "100%",
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.25)",
                background: "rgba(239,68,68,0.06)",
                borderRadius: 9,
                cursor: "pointer",
              }}
              onClick={handleTerminate}
              disabled={!!actioning}
            >
              {actioning === "TERMINATE" ? (
                <span
                  className="btn_loader"
                  style={{ width: 13, height: 13 }}
                />
              ) : (
                <>
                  <MdClose size={13} /> Terminate Contract
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
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
  const [offersOpen, setOffersOpen] = useState(true);

  const fetchAll = async () => {
    try {
      const [profileRes, offersRes] = await Promise.allSettled([
        api.get("/icart/operator/profile/me"),
        api.get("/icart/operator/job-offers"),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.data.data);
      } else {
        setProfile(null);
      }

      if (offersRes.status === "fulfilled") {
        const data = offersRes.value.data.data;
        // job-offers endpoint returns myOffers (offers sent to this operator)
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
    // Fetch states for the create profile form
    api
      .get("/config/state")
      .then((res) => {
        const d = res.data.data;
        setStates(Array.isArray(d) ? d : d?.items || []);
      })
      .catch(() => {});
  }, []);

  const pendingOffers = offers.filter((o) => o.status === "PENDING");
  const activeOffers = offers.filter(
    (o) => o.status === "ACTIVE" || o.status === "ACCEPTED",
  );
  const pastOffers = offers.filter(
    (o) =>
      o.status !== "PENDING" &&
      o.status !== "ACTIVE" &&
      o.status !== "ACCEPTED",
  );

  if (loading) {
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  }

  // Deduplicate active carts from active offers
  const activeCarts = activeOffers.reduce((acc, offer) => {
    const id = offer.cartId || offer.cart?.id;
    if (id && !acc.find((c) => c.id === id)) {
      acc.push({
        id,
        serialNumber: offer.cart?.serialNumber || id.slice(0, 8).toUpperCase(),
        location: offer.cart?.location,
        isOnline: offer.cart?.isOnline,
        offerId: offer.id,
        salary: offer.salary,
        workingHours: offer.workingHours,
        endDate: offer.endDate,
      });
    }
    return acc;
  }, []);

  return (
    <div className="page_wrapper">
      {/* Header */}
      <div className="icart_page_header">
        <div>
          <h2 className="page_title_big m-0">Operator</h2>
          <p className="welcome_message" style={{ marginBottom: 0 }}>
            Manage your operator profile and job offers
          </p>
        </div>
      </div>

      {/* ── Profile Section ── */}
      {!profile ? (
        <CreateProfileForm
          states={states}
          onCreated={fetchAll}
          submitting={creatingProfile}
          setSubmitting={setCreatingProfile}
        />
      ) : (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 18,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div
              className="icart_operator_avatar"
              style={{
                width: 44,
                height: 44,
                fontSize: "1.1rem",
                flexShrink: 0,
              }}
            >
              <MdPerson size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "var(--text-heading)",
                  marginBottom: 5,
                }}
              >
                My Operator Profile
              </div>
              <StatusBadge
                status={profile.isApproved ? "APPROVED" : "PENDING"}
                colors={profileStatusColors}
              />
            </div>
            {profile.isApproved && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#16a34a",
                  flexShrink: 0,
                }}
              >
                <MdVerified size={16} /> Hirable
              </div>
            )}
          </div>
          <div className="icart_item_meta" style={{ marginBottom: 0 }}>
            {profile.certification && (
              <div className="icart_meta_row">
                <span className="icart_meta_key">Certification</span>
                <a
                  href={profile.certification}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    color: "var(--accent)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    textDecoration: "none",
                  }}
                >
                  View Doc
                </a>
              </div>
            )}
            {profile.state?.name && (
              <div className="icart_meta_row">
                <span className="icart_meta_key">State</span>
                <span className="icart_meta_val">
                  {profile.state.name}
                  {profile.state.country ? `, ${profile.state.country}` : ""}
                </span>
              </div>
            )}
            {profile.createdAt && (
              <div className="icart_meta_row">
                <span className="icart_meta_key">Joined</span>
                <span className="icart_meta_val">
                  {formatDate(profile.createdAt)}
                </span>
              </div>
            )}
            {!profile.isApproved && (
              <div className="icart_meta_row">
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#ca8a04",
                    fontWeight: 500,
                  }}
                >
                  Your profile is awaiting admin approval before you can receive
                  job offers.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── My iCart(s) ── */}
      {profile && activeCarts.length > 0 && (
        <>
          <div className="icart_section_label_row" style={{ marginBottom: 12 }}>
            <span className="icart_section_label">My iCart</span>
            <span className="icart_section_count">{activeCarts.length}</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 28,
            }}
          >
            {activeCarts.map((c) => (
              <button
                key={c.id}
                onClick={() => setOpenCartId(c.id)}
                style={{
                  width: "100%",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: "16px 18px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(203,108,220,0.4)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 12px rgba(203,108,220,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Cart icon */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      flexShrink: 0,
                      background: "var(--bg-active)",
                      border: "1px solid rgba(203,108,220,0.2)",
                      color: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MdWork size={19} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.92rem",
                          fontWeight: 900,
                          color: "var(--text-heading)",
                          fontFamily: "monospace",
                        }}
                      >
                        {c.serialNumber}
                      </span>
                      {/* Online dot */}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: c.isOnline
                            ? "rgba(34,197,94,0.1)"
                            : "rgba(107,114,128,0.1)",
                          color: c.isOnline ? "#22c55e" : "#6b7280",
                          border: `1px solid ${c.isOnline ? "rgba(34,197,94,0.25)" : "rgba(107,114,128,0.2)"}`,
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: c.isOnline ? "#22c55e" : "#9ca3af",
                          }}
                        />
                        {c.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {c.location?.name && (
                        <span
                          style={{
                            fontSize: "0.73rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          📍 {c.location.name}
                        </span>
                      )}
                      {c.workingHours && (
                        <span
                          style={{
                            fontSize: "0.73rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          🕐 {c.workingHours}
                        </span>
                      )}
                      {c.salary && (
                        <span
                          style={{
                            fontSize: "0.73rem",
                            color: "#16a34a",
                            fontWeight: 600,
                          }}
                        >
                          ₦{Number(c.salary).toLocaleString()}/mo
                        </span>
                      )}
                      {c.endDate && (
                        <span
                          style={{
                            fontSize: "0.73rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          ends {formatDate(c.endDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <MdChevronRight
                    size={20}
                    style={{ color: "var(--text-muted)", flexShrink: 0 }}
                  />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Job Offers ── */}
      {profile && (
        <>
          <div
            className="icart_section_label_row icart_section_label_row_clickable"
            onClick={() => setOffersOpen((v) => !v)}
          >
            <span className="icart_section_label">Job Offers</span>
            <span className="icart_section_count">{offers.length}</span>
            {pendingOffers.length > 0 && (
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  background: "rgba(234,179,8,0.15)",
                  color: "#ca8a04",
                  border: "1px solid rgba(234,179,8,0.3)",
                  borderRadius: 999,
                  padding: "2px 8px",
                }}
              >
                {pendingOffers.length} pending
              </span>
            )}
            <span className="icart_section_chevron">
              {offersOpen ? (
                <MdExpandLess size={18} />
              ) : (
                <MdExpandMore size={18} />
              )}
            </span>
          </div>

          {offersOpen && (
            <>
              {offers.length === 0 ? (
                <div
                  className="icart_empty_state"
                  style={{ padding: "32px 0" }}
                >
                  <MdWork size={28} style={{ opacity: 0.3 }} />
                  <p className="icart_empty_title">No job offers yet</p>
                  <p className="icart_empty_sub">
                    {profile.isApproved
                      ? "iCart owners can send you offers once your profile is approved."
                      : "Once approved, job offers from iCart owners will appear here."}
                  </p>
                </div>
              ) : (
                <>
                  {pendingOffers.length > 0 && (
                    <>
                      <p
                        className="drawer_section_title"
                        style={{ marginBottom: 10 }}
                      >
                        <MdCircle size={6} style={{ color: "#ca8a04" }} />{" "}
                        Pending ({pendingOffers.length})
                      </p>
                      {pendingOffers.map((o) => (
                        <JobOfferCard
                          key={o.id}
                          offer={o}
                          onAction={fetchAll}
                        />
                      ))}
                    </>
                  )}
                  {activeOffers.length > 0 && (
                    <>
                      <p
                        className="drawer_section_title"
                        style={{
                          marginBottom: 10,
                          marginTop: pendingOffers.length ? 16 : 0,
                        }}
                      >
                        <MdCircle size={6} style={{ color: "#16a34a" }} />{" "}
                        Active ({activeOffers.length})
                      </p>
                      {activeOffers.map((o) => (
                        <JobOfferCard
                          key={o.id}
                          offer={o}
                          onAction={fetchAll}
                        />
                      ))}
                    </>
                  )}
                  {pastOffers.length > 0 && (
                    <>
                      <p
                        className="drawer_section_title"
                        style={{ marginBottom: 10, marginTop: 16 }}
                      >
                        History ({pastOffers.length})
                      </p>
                      {pastOffers.map((o) => (
                        <JobOfferCard
                          key={o.id}
                          offer={o}
                          onAction={fetchAll}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      <OperatorCartDrawer
        cartId={openCartId}
        onClose={() => setOpenCartId(null)}
      />
    </div>
  );
}
