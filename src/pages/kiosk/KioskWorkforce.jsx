import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdPerson,
  MdAdd,
  MdCheck,
  MdClose,
  MdRefresh,
  MdBlock,
  MdWorkOutline,
  MdAccessTime,
  MdSearch,
} from "react-icons/md";
import api from "../../api/axios";

/* ── Duration options ─────────────────────────────────────── */
const DURATION_OPTIONS = [
  { key: "1m", label: "1 Month", days: 30 },
  { key: "2m", label: "2 Months", days: 60 },
  { key: "3m", label: "3 Months", days: 90 },
  { key: "6m", label: "6 Months", days: 180 },
  { key: "1y", label: "1 Year", days: 365 },
  { key: "2y", label: "2 Years", days: 730 },
];

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
};

function StatusPill({ status }) {
  const s = offerStatusColors[status] || offerStatusColors.PENDING;
  return (
    <span
      className="kiosk_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status}
    </span>
  );
}

/* ── Hire Form ─────────────────────────────────────────────── */
function HireForm({ kioskId, onHired }) {
  const [hireable, setHireable] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [duration, setDuration] = useState("1m"); // option key
  const [salary, setSalary] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoadingList(true);
      try {
        const res = await api.get("/kiosk/operator/hirable");
        setHireable(res.data.data?.operators || res.data.data?.items || []);
      } catch {
        toast.error("Failed to load operators");
      } finally {
        setLoadingList(false);
      }
    };
    fetch();
  }, []);

  const filtered = hireable.filter((op) => {
    const name = op.user?.fullName || op.user?.name || op.user?.email || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmit = async () => {
    if (!selectedOperator) return toast.error("Select an operator");
    if (!duration) return toast.error("Select a contract duration");

    setSubmitting(true);
    try {
      await api.post("/kiosk/operator/job-offers", {
        operatorId: selectedOperator.id,
        kioskId,
        durationDays:
          DURATION_OPTIONS.find((d) => d.key === duration)?.days || 30,
        salary: salary ? Number(salary) : undefined,
        workingHours: workingHours.trim() || undefined,
        note: note.trim() || undefined,
      });
      toast.success("Job offer sent");
      onHired();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send offer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kiosk_hire_form">
      <div className="form-field">
        <label className="modal-label">Search Operators</label>
        <div className="kiosk_search_wrap">
          <MdSearch
            size={16}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
          <input
            className="modal-input"
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              flex: 1,
              outline: "none",
            }}
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loadingList ? (
        <div className="drawer_loading" style={{ padding: "20px 0" }}>
          <div
            className="page_loader_spinner"
            style={{ width: 20, height: 20 }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="kiosk_empty_inline">
          <MdPerson size={18} style={{ opacity: 0.3 }} />
          <span>No operators found</span>
        </div>
      ) : (
        <div className="kiosk_operator_list">
          {filtered.map((op) => (
            <div
              key={op.id}
              className={`kiosk_operator_row ${selectedOperator?.id === op.id ? "kiosk_operator_selected" : ""}`}
              onClick={() => setSelectedOperator(op)}
            >
              <div className="kiosk_operator_avatar">
                {(op.user?.fullName ||
                  op.user?.name ||
                  op.user?.email ||
                  "?")[0].toUpperCase()}
              </div>
              <div className="kiosk_operator_info">
                <div className="kiosk_operator_name">
                  {op.user?.fullName || op.user?.name || op.user?.email}
                </div>
                {op.state?.name && (
                  <div className="kiosk_operator_meta">{op.state.name}</div>
                )}
              </div>
              {selectedOperator?.id === op.id && (
                <MdCheck
                  size={16}
                  style={{ color: "var(--accent)", flexShrink: 0 }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="form-field" style={{ marginTop: 12 }}>
        <label className="modal-label">Contract Duration</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 6,
          }}
        >
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDuration(opt.key)}
              style={{
                height: 38,
                border: "1px solid var(--border)",
                borderRadius: 9,
                cursor: "pointer",
                background:
                  duration === opt.key ? "var(--bg-active)" : "var(--bg-hover)",
                color:
                  duration === opt.key ? "var(--accent)" : "var(--text-muted)",
                borderColor:
                  duration === opt.key
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="form-field">
          <label className="modal-label">Proposed Salary (NGN)</label>
          <input
            className="modal-input"
            type="number"
            min={0}
            placeholder="e.g. 50000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Working Hours</label>
          <input
            className="modal-input"
            placeholder="e.g. 8am – 5pm"
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="modal-label">Note</label>
        <input
          className="modal-input"
          placeholder="Any additional details for the operator"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          className={`app_btn app_btn_confirm ${submitting ? "btn_loading" : ""}`}
          style={{ flex: 1, height: 40 }}
          onClick={handleSubmit}
          disabled={submitting || !selectedOperator}
        >
          <span className="btn_text">Send Job Offer</span>
          {submitting && (
            <span className="btn_loader" style={{ width: 14, height: 14 }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Job Offer Card ────────────────────────────────────────── */
function JobOfferCard({ offer, onRefresh }) {
  const [renewDuration, setRenewDuration] = useState("1m");
  const [showRenew, setShowRenew] = useState(false);
  const [loading, setLoading] = useState(false);

  const canTerminate = offer.status === "ACCEPTED";
  const canRenew = offer.status === "ACCEPTED" || offer.status === "EXPIRED";

  const handleTerminate = async () => {
    if (!window.confirm("Terminate this contract?")) return;
    setLoading(true);
    try {
      await api.patch(`/kiosk/operator/job-offers/${offer.id}/terminate`);
      toast.success("Contract terminated");
      onRefresh();
    } catch {
      toast.error("Failed to terminate");
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!renewDuration) return toast.error("Select a duration");
    const days =
      DURATION_OPTIONS.find((d) => d.key === renewDuration)?.days || 30;
    setLoading(true);
    try {
      await api.patch(`/kiosk/operator/job-offers/${offer.id}/renew`, {
        durationDays: days,
      });
      toast.success("Contract renewed");
      setShowRenew(false);
      onRefresh();
    } catch {
      toast.error("Failed to renew");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const operatorName =
    offer.operator?.user?.fullName ||
    offer.operator?.user?.email ||
    (offer.operatorId
      ? `Operator #${offer.operatorId.slice(0, 6).toUpperCase()}`
      : "Operator");

  const operatorEmail = offer.operator?.user?.fullName
    ? offer.operator?.user?.email
    : null;
  const operatorState = offer.operator?.state?.name || null;

  // cart serial from the nested cart object
  const cartSerial = offer.cart?.serialNumber || "";

  const sc = offerStatusColors[offer.status] || offerStatusColors.PENDING;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      {/* Status accent bar */}
      <div style={{ height: 3, background: sc.border }} />

      <div style={{ padding: "14px 16px" }}>
        {/* Top: avatar + name + status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div
            className="kiosk_operator_avatar"
            style={{ width: 38, height: 38, fontSize: "0.9rem", flexShrink: 0 }}
          >
            {operatorName[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="kiosk_operator_name" style={{ marginBottom: 2 }}>
              {operatorName}
            </div>
            {(operatorEmail || operatorState) && (
              <div className="kiosk_operator_meta">
                {operatorEmail || operatorState}
              </div>
            )}
          </div>
          <StatusPill status={offer.status} />
        </div>

        {/* Meta chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: canTerminate || canRenew ? 12 : 0,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "4px 10px",
            }}
          >
            <MdAccessTime size={12} style={{ color: "var(--text-muted)" }} />
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
          {cartSerial && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "4px 10px",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-body)",
                  fontFamily: "monospace",
                }}
              >
                {cartSerial}
              </span>
            </div>
          )}
          {offer.endDate && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "4px 10px",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-body)",
                }}
              >
                Ends {formatDate(offer.endDate)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {(canTerminate || canRenew) && !showRenew && (
          <div style={{ display: "flex", gap: 8 }}>
            {canRenew && (
              <button
                className="app_btn app_btn_cancel"
                style={{
                  flex: 1,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  fontSize: "0.78rem",
                }}
                onClick={() => setShowRenew(true)}
              >
                <MdRefresh size={13} /> Renew
              </button>
            )}
            {canTerminate && (
              <button
                className="app_btn"
                style={{
                  flex: 1,
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
                disabled={loading}
              >
                {loading ? (
                  <span
                    className="btn_loader"
                    style={{ width: 13, height: 13 }}
                  />
                ) : (
                  <>
                    <MdBlock size={13} /> Terminate
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Renew inline form */}
        {showRenew && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 6,
              }}
            >
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setRenewDuration(opt.key)}
                  style={{
                    height: 34,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
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
                    fontSize: "0.73rem",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="app_btn app_btn_cancel"
                style={{ flex: 1, height: 36, fontSize: "0.78rem" }}
                onClick={() => setShowRenew(false)}
              >
                Cancel
              </button>
              <button
                className={`app_btn app_btn_confirm${loading ? " btn_loading" : ""}`}
                style={{
                  flex: 2,
                  height: 36,
                  fontSize: "0.78rem",
                  position: "relative",
                }}
                onClick={handleRenew}
                disabled={loading}
              >
                <span className="btn_text">Extend Contract</span>
                {loading && (
                  <span
                    className="btn_loader"
                    style={{ width: 12, height: 12 }}
                  />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main KioskWorkforce ───────────────────────────────────── */
export default function KioskWorkforce({ cart, onRefresh: parentRefresh }) {
  const [view, setView] = useState("offers"); // offers | hire
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      // job-offers returns offeredJobs = offers this owner sent out (with nested operator.user)
      const res = await api.get("/kiosk/operator/job-offers");
      const all = res.data.data?.offeredJobs || [];
      setOffers(
        all.filter((o) => o.kioskId === cart.id || o.cart?.id === cart.id),
      );
    } catch {
      toast.error("Failed to load job offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "offers") fetchOffers();
  }, [view]);

  // Current active operator
  const activeOperator = cart.operator || cart.currentOperator;

  return (
    <div className="kiosk_tab_content">
      {/* Current operator */}
      {activeOperator && (
        <>
          <div className="drawer_section_title">Current Operator</div>
          <div className="kiosk_current_operator">
            <div className="kiosk_operator_avatar kiosk_operator_avatar_lg">
              {(activeOperator.user?.fullName ||
                activeOperator.user?.name ||
                activeOperator.user?.email ||
                "O")[0].toUpperCase()}
            </div>
            <div>
              <div
                className="kiosk_operator_name"
                style={{ fontSize: "0.95rem" }}
              >
                {activeOperator.user?.fullName ||
                  activeOperator.user?.name ||
                  activeOperator.user?.email}
              </div>
              {activeOperator.user?.email &&
                (activeOperator.user?.fullName ||
                  activeOperator.user?.name) && (
                  <div className="kiosk_operator_meta">
                    {activeOperator.user.email}
                  </div>
                )}
              {activeOperator.state?.name && (
                <div className="kiosk_operator_meta">
                  {activeOperator.state.name}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Sub-nav */}
      <div
        className="kiosk_sub_nav"
        style={{ marginTop: activeOperator ? 20 : 0 }}
      >
        <button
          className={`kiosk_sub_nav_btn ${view === "offers" ? "kiosk_sub_nav_active" : ""}`}
          onClick={() => setView("offers")}
        >
          <MdWorkOutline size={13} /> Job Offers
        </button>
        <button
          className={`kiosk_sub_nav_btn ${view === "hire" ? "kiosk_sub_nav_active" : ""}`}
          onClick={() => setView("hire")}
          style={{ marginLeft: "auto" }}
        >
          <MdAdd size={13} /> Hire Operator
        </button>
      </div>

      {view === "hire" ? (
        <HireForm
          kioskId={cart.id}
          onHired={() => {
            setView("offers");
            fetchOffers();
            parentRefresh();
          }}
        />
      ) : loading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      ) : offers.length === 0 ? (
        <div className="kiosk_empty_inline" style={{ padding: "32px 0" }}>
          <MdWorkOutline size={24} style={{ opacity: 0.3 }} />
          <span>No job offers yet</span>
        </div>
      ) : (
        <div className="kiosk_tasks_list">
          {offers.map((offer) => (
            <JobOfferCard
              key={offer.id}
              offer={offer}
              onRefresh={fetchOffers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
