import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import {
  MdCircle,
  MdWork,
  MdCheck,
  MdClose,
  MdRefresh,
  MdPerson,
  MdCalendarToday,
  MdTimer,
  MdVerified,
  MdAdd,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";

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
    (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

/* ── Create Profile Form ─────────────────────────────────────── */
function CreateProfileForm({ states, onCreated, submitting, setSubmitting }) {
  const [form, setForm] = useState({ certification: "", stateId: "" });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {};
      if (form.certification) payload.certification = form.certification;
      if (form.stateId) payload.stateId = form.stateId;
      await api.post("/icart/operator/profile", payload);
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
        <div className="form-field">
          <label className="modal-label">Certification (optional)</label>
          <input
            className="modal-input"
            placeholder="e.g. Food Handler Certificate #12345"
            value={form.certification}
            onChange={(e) =>
              setForm((f) => ({ ...f, certification: e.target.value }))
            }
          />
        </div>

        {states.length > 0 && (
          <div className="form-field">
            <label className="modal-label">State (optional)</label>
            <select
              className="modal-input"
              value={form.stateId}
              onChange={(e) =>
                setForm((f) => ({ ...f, stateId: e.target.value }))
              }
            >
              <option value="">Select state…</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}, {s.country}
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
          {submitting && <span className="btn_loader" style={{ width: 18, height: 18 }} />}
        </button>
      </div>
    </div>
  );
}

/* ── Renew Modal ─────────────────────────────────────────────── */
function RenewModal({ offer, onClose, onDone }) {
  const [days, setDays] = useState(30);
  const [saving, setSaving] = useState(false);

  const handleRenew = async () => {
    setSaving(true);
    try {
      await api.patch(`/icart/operator/job-offers/${offer.id}/renew`, {
        durationDays: Number(days),
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
        className="modal_card"
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
          Add days to your current contract.
        </p>

        <div className="form-field">
          <label className="modal-label">Additional Days</label>
          <input
            className="modal-input"
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
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
            <span className="btn_text">Renew</span>
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
  const [showRenew, setShowRenew] = useState(false);
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
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
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
              <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--text-heading)", fontFamily: "monospace" }}>
                {cartLabel}
              </div>
              {ownerLabel !== "—" && (
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: offer.status === "PENDING" || offer.status === "ACTIVE" || offer.status === "ACCEPTED" ? 14 : 0 }}>
            <div className="icart_meta_row" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <MdTimer size={12} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-body)" }}>{offer.durationDays} days</span>
            </div>
            {offer.startDate && (
              <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <MdCalendarToday size={11} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-body)" }}>Start: {formatDate(offer.startDate)}</span>
              </div>
            )}
            {offer.endDate && (
              <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <MdCalendarToday size={11} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-body)" }}>End: {formatDate(offer.endDate)}</span>
              </div>
            )}
            {(offer.status === "ACTIVE") && daysLeft !== null && (
              <div style={{ background: daysLeft <= 7 ? "rgba(239,68,68,0.08)" : "var(--bg-hover)", border: `1px solid ${daysLeft <= 7 ? "rgba(239,68,68,0.25)" : "var(--border)"}`, borderRadius: 8, padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <MdTimer size={11} style={{ color: daysLeft <= 7 ? "#ef4444" : "var(--text-muted)" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: daysLeft <= 7 ? "#ef4444" : "var(--text-body)" }}>
                  {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                </span>
              </div>
            )}
          </div>

          {/* Actions — PENDING */}
          {offer.status === "PENDING" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
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
                {actioning === "REJECTED"
                  ? <span className="btn_loader" style={{ width: 14, height: 14 }} />
                  : <><MdClose size={14} /> Decline</>
                }
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
                {actioning === "ACCEPTED"
                  ? <span className="btn_loader" style={{ width: 14, height: 14 }} />
                  : <><MdCheck size={14} /> Accept Offer</>
                }
              </button>
            </div>
          )}

          {/* Actions — ACTIVE / ACCEPTED */}
          {(offer.status === "ACTIVE" || offer.status === "ACCEPTED") && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="app_btn app_btn_cancel"
                style={{ flex: 1, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: "0.78rem" }}
                onClick={() => setShowRenew(true)}
              >
                <MdRefresh size={13} /> Renew
              </button>
              <button
                className="app_btn"
                style={{
                  flex: 1, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  fontSize: "0.78rem", fontWeight: 600,
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.25)",
                  background: "rgba(239,68,68,0.06)",
                  borderRadius: 9, cursor: "pointer",
                }}
                onClick={handleTerminate}
                disabled={!!actioning}
              >
                {actioning === "TERMINATE"
                  ? <span className="btn_loader" style={{ width: 13, height: 13 }} />
                  : <><MdClose size={13} /> Terminate</>
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {showRenew && (
        <RenewModal
          offer={offer}
          onClose={() => setShowRenew(false)}
          onDone={onAction}
        />
      )}
    </>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function OperatorHome() {
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
    (o) => o.status === "ACTIVE" || o.status === "ACCEPTED"
  );
  const pastOffers = offers.filter(
    (o) =>
      o.status !== "PENDING" && o.status !== "ACTIVE" && o.status !== "ACCEPTED"
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
            marginBottom: 28,
          }}
        >
          {/* Avatar + name + status */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div
              className="icart_operator_avatar"
              style={{ width: 44, height: 44, fontSize: "1.1rem", flexShrink: 0 }}
            >
              <MdPerson size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-heading)", marginBottom: 5 }}>
                My Operator Profile
              </div>
              <StatusBadge
                status={profile.isApproved ? "APPROVED" : "PENDING"}
                colors={profileStatusColors}
              />
            </div>
            {profile.isApproved && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 600, color: "#16a34a", flexShrink: 0 }}>
                <MdVerified size={16} />
                Hirable
              </div>
            )}
          </div>

          {/* Meta block */}
          <div className="icart_item_meta" style={{ marginBottom: 0 }}>
            {profile.certification && (
              <div className="icart_meta_row">
                <span className="icart_meta_key">Certification</span>
                <span className="icart_meta_val">{profile.certification}</span>
              </div>
            )}
            {profile.state?.name && (
              <div className="icart_meta_row">
                <span className="icart_meta_key">State</span>
                <span className="icart_meta_val">
                  {profile.state.name}{profile.state.country ? `, ${profile.state.country}` : ""}
                </span>
              </div>
            )}
            {profile.cart?.serialNumber && (
              <div className="icart_meta_row">
                <span className="icart_meta_key">Assigned Cart</span>
                <span className="icart_meta_val" style={{ fontFamily: "monospace" }}>
                  {profile.cart.serialNumber}
                </span>
              </div>
            )}
            {profile.createdAt && (
              <div className="icart_meta_row">
                <span className="icart_meta_key">Joined</span>
                <span className="icart_meta_val">{formatDate(profile.createdAt)}</span>
              </div>
            )}
            {!profile.isApproved && (
              <div className="icart_meta_row">
                <span style={{ fontSize: "0.75rem", color: "#ca8a04", fontWeight: 500 }}>
                  Your profile is awaiting admin approval before you can receive job offers.
                </span>
              </div>
            )}
          </div>
        </div>
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
                <div className="icart_empty_state" style={{ padding: "32px 0" }}>
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
                  {/* Pending */}
                  {pendingOffers.length > 0 && (
                    <>
                      <p className="drawer_section_title" style={{ marginBottom: 10 }}>
                        <MdCircle size={6} style={{ color: "#ca8a04" }} />
                        Pending ({pendingOffers.length})
                      </p>
                      {pendingOffers.map((o) => (
                        <JobOfferCard key={o.id} offer={o} onAction={fetchAll} />
                      ))}
                    </>
                  )}

                  {/* Active */}
                  {activeOffers.length > 0 && (
                    <>
                      <p className="drawer_section_title" style={{ marginBottom: 10, marginTop: pendingOffers.length ? 16 : 0 }}>
                        <MdCircle size={6} style={{ color: "#16a34a" }} />
                        Active ({activeOffers.length})
                      </p>
                      {activeOffers.map((o) => (
                        <JobOfferCard key={o.id} offer={o} onAction={fetchAll} />
                      ))}
                    </>
                  )}

                  {/* Past */}
                  {pastOffers.length > 0 && (
                    <>
                      <p className="drawer_section_title" style={{ marginBottom: 10, marginTop: 16 }}>
                        History ({pastOffers.length})
                      </p>
                      {pastOffers.map((o) => (
                        <JobOfferCard key={o.id} offer={o} onAction={fetchAll} />
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}