import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";
import {
  MdBuild,
  MdAdd,
  MdClose,
  MdExpandMore,
  MdExpandLess,
  MdCheck,
  MdPerson,
  MdFileCopy,
} from "react-icons/md";

/* ── helpers ──────────────────────────────────────────────── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "—";

/* actual statuses returned by the API */
const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const statusStyle = {
  PENDING: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  IN_PROGRESS: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  RESOLVED: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  CLOSED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.25)" },
};

function StatusBadge({ status }) {
  const s = statusStyle[status] || statusStyle.PENDING;
  return (
    <span
      style={{
        fontSize: "0.62rem",
        fontWeight: 800,
        padding: "2px 9px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        flexShrink: 0,
        letterSpacing: "0.03em",
      }}
    >
      {status}
    </span>
  );
}

/* ── Single Report Row ────────────────────────────────────── */
function ReportRow({ report, canUpdateStatus, onStatusChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(report.status);

  const reporter = report.user;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/icart/maintenance/${report.id}/status`, {
        status: newStatus,
      });
      setLocalStatus(newStatus);
      toast.success("Status updated");
      if (onStatusChanged) onStatusChanged(report.id, newStatus);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      {/* ── Collapsed header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 14px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Reporter avatar */}
        {reporter?.image ? (
          <img
            src={reporter.image}
            alt=""
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              border: "2px solid var(--border)",
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {reporter?.fullName ? (
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  color: "#ef4444",
                }}
              >
                {reporter.fullName[0].toUpperCase()}
              </span>
            ) : (
              <MdBuild size={15} style={{ color: "#ef4444" }} />
            )}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Report text preview */}
          <div
            style={{
              fontSize: "0.84rem",
              fontWeight: 700,
              color: "var(--text-body)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginBottom: 3,
            }}
          >
            {report.reportText || "Maintenance Report"}
          </div>
          {/* Reporter name + date */}
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {reporter?.fullName && (
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                }}
              >
                {reporter.fullName}
              </span>
            )}
            {reporter?.fullName && (
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "var(--text-muted)",
                  opacity: 0.4,
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
              {fmtDate(report.submittedAt || report.createdAt)}
            </span>
            {report.responses?.length > 0 && (
              <>
                <span
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "var(--text-muted)",
                    opacity: 0.4,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}
                >
                  {report.responses.length} checklist item
                  {report.responses.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        {report.responses?.find((r) => r.isIssue) && (
          <StatusBadge status={localStatus} />
        )}
        {expanded ? (
          <MdExpandLess
            size={16}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        ) : (
          <MdExpandMore
            size={16}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        )}
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* Reporter card */}
          {reporter && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                background: "var(--bg-hover)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {reporter.image ? (
                <img
                  src={reporter.image}
                  alt=""
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "2px solid var(--border)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "var(--bg-active)",
                    border: "1px solid rgba(203,108,220,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdPerson size={18} style={{ color: "var(--accent)" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                  }}
                >
                  {reporter.fullName || "Unknown"}
                </div>
                {reporter.email && (
                  <div
                    style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                  >
                    {reporter.email}
                    {reporter.phone ? ` · ${reporter.phone}` : ""}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                <div>Reported</div>
                <div style={{ fontWeight: 800, color: "var(--text-body)" }}>
                  {fmtDate(report.submittedAt || report.createdAt)}
                </div>
              </div>
            </div>
          )}

          {/* Full report text */}
          <div style={{ padding: "14px 14px 0" }}>
            <div
              style={{
                fontSize: "0.6rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Report
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.84rem",
                color: "var(--text-body)",
                lineHeight: 1.65,
                marginBottom: 14,
              }}
            >
              {report.reportText}
            </p>
          </div>

          {/* Q&A checklist */}
          {report.responses?.length > 0 && (
            <div style={{ padding: "0 14px 14px" }}>
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Checklist
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {report.responses.map((r, i) => {
                  const aLower = r.a?.toLowerCase();
                  const isYes = aLower === "yes";
                  const isNo = aLower === "no";
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "9px 12px",
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: 9,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      {(isYes || isNo) && (
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: isYes
                              ? "rgba(34,197,94,0.1)"
                              : "rgba(239,68,68,0.1)",
                            color: isYes ? "#16a34a" : "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isYes ? <MdCheck size={12} /> : <MdClose size={12} />}
                        </div>
                      )}
                      <div style={{ flex: 1, display: "flex", flexDirection: r.isIssue ? "column-reverse" : "column" }}>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            marginBottom: r.isIssue ? 0 : 1,
                            marginTop: r.isIssue ? 2 : 0,
                          }}
                        >
                          {r.q}
                        </div>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: r.isIssue ? "#ef4444" : "var(--text-body)",
                          }}
                        >
                          {r.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Images */}
          {report.images?.length > 0 && (
            <div style={{ padding: "0 14px 14px" }}>
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Images
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {report.images.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noreferrer">
                    <img
                      src={img}
                      alt={`Report image ${i + 1}`}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 9,
                        objectFit: "cover",
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                        display: "block",
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Cart context chip */}
          {report.cart && (
            <div style={{ padding: "0 14px 14px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "5px 11px",
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                <MdFileCopy size={12} style={{ color: "var(--text-muted)" }} />
                {report.cart.serialNumber}
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 4,
                    background: "var(--bg-active)",
                    color: "var(--accent)",
                    border: "1px solid rgba(203,108,220,0.25)",
                  }}
                >
                  {report.cart.status}
                </span>
              </div>
            </div>
          )}

          {/* Status updater */}
          {canUpdateStatus && (
            <div
              style={{
                padding: "12px 14px",
                borderTop: "1px solid var(--border)",
                background: "var(--bg-hover)",
              }}
            >
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Update Status
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map((s) => {
                  const st = statusStyle[s] || {};
                  const isActive = localStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => !isActive && handleStatusChange(s)}
                      disabled={updating || isActive}
                      style={{
                        height: 30,
                        padding: "0 12px",
                        borderRadius: 7,
                        border: `1px solid ${isActive ? st.border : "var(--border)"}`,
                        background: isActive ? st.bg : "var(--bg-card)",
                        color: isActive ? st.color : "var(--text-muted)",
                        cursor: isActive ? "default" : "pointer",
                        fontFamily: "inherit",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        opacity: updating ? 0.6 : 1,
                        transition: "all 0.12s",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {isActive && <MdCheck size={11} />}
                      {s.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Create Report Form ───────────────────────────────────── */
function CreateReportForm({ cartId, onCreated, onCancel }) {
  const [reportText, setReportText] = useState("");
  const [responses, setResponses] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const addResponse = () =>
    setResponses((p) => [...p, { q: "", a: "" }]);
  const updateResponse = (i, field, val) =>
    setResponses((p) =>
      p.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)),
    );
  const removeResponse = (i) =>
    setResponses((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!reportText.trim() || reportText.trim().length < 5)
      return toast.error("Report text must be at least 5 characters");
    setSubmitting(true);
    try {
      const validResponses = responses.filter(
        (r) => r.q.trim() && r.a.trim(),
      );
      const payload = {
        cartId,
        reportText: reportText.trim(),
        ...(validResponses.length > 0 ? { responses: validResponses } : {}),
      };
      const res = await api.post("/icart/maintenance", payload);
      toast.success("Report submitted");
      onCreated(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-hover)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: "0.62rem",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          marginBottom: 14,
        }}
      >
        New Maintenance Report
      </div>

      {/* Report text */}
      <div className="form-field">
        <label className="modal-label">Issue Description *</label>
        <textarea
          className="modal-input"
          rows={3}
          placeholder="Describe the maintenance issue in detail… (min 5 chars)"
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Optional checklist items */}
      {responses.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <label className="modal-label">Checklist Items</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {responses.map((r, i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                    }}
                  >
                    Item {i + 1}
                  </span>
                  <button
                    onClick={() => removeResponse(i)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      padding: 0,
                    }}
                  >
                    <MdClose size={13} />
                  </button>
                </div>
                <input
                  className="modal-input"
                  placeholder="Question / check item"
                  value={r.q}
                  onChange={(e) => updateResponse(i, "q", e.target.value)}
                  style={{ marginBottom: 6 }}
                />
                <input
                  className="modal-input"
                  placeholder="Answer / observation"
                  value={r.a}
                  onChange={(e) => updateResponse(i, "a", e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={addResponse}
        style={{
          background: "none",
          border: "none",
          color: "var(--accent)",
          fontWeight: 700,
          fontSize: "0.78rem",
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 0,
          marginBottom: 14,
        }}
      >
        <MdAdd size={14} /> Add checklist item
      </button>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="app_btn app_btn_cancel"
          style={{ flex: 1, height: 40 }}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          className={`app_btn app_btn_confirm${submitting ? " btn_loading" : ""}`}
          style={{
            flex: 2,
            height: 40,
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          <span className="btn_text">
            <MdBuild size={14} /> Submit Report
          </span>
          {submitting && (
            <span className="btn_loader" style={{ width: 13, height: 13 }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT  —  drop-in tab component for IcartDrawer
   ═══════════════════════════════════════════════════════════ */
export default function IcartReports({ cart, canUpdateStatus = true }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchReports = async () => {
    if (!cart?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/icart/maintenance/icart/${cart.id}`);
      const d = res.data.data;
      // API returns { items: [], total, page, limit, pages }
      setReports(Array.isArray(d) ? d : d?.items || []);
      setTotal(d?.total ?? 0);
    } catch {
      toast.error("Failed to load maintenance reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [cart?.id]);

  const handleStatusChanged = (reportId, newStatus) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)),
    );
  };

  return (
    <div className="icart_tab_content">
      {/* ── Header bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "var(--text-heading)",
            }}
          >
            General Reports
          </span>
          {total > 0 && (
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--bg-hover)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {total}
            </span>
          )}
        </div>
        {/* <button
          className={`app_btn${showForm ? " app_btn_cancel" : " app_btn_confirm"}`}
          style={{
            height: 34,
            padding: "0 14px",
            fontSize: "0.78rem",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? (
            <>
              <MdClose size={13} /> Cancel
            </>
          ) : (
            <>
              <MdAdd size={13} /> Report Issue
            </>
          )}
        </button> */}
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <CreateReportForm
          cartId={cart.id}
          onCreated={(newReport) => {
            setReports((p) => [newReport, ...p]);
            setTotal((t) => t + 1);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      ) : reports.length === 0 && !showForm ? (
        <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
          <MdBuild size={28} style={{ opacity: 0.3 }} />
          <span>No reports yet</span>
        </div>
      ) : (
        reports.map((r) => (
          <ReportRow
            key={r.id}
            report={r}
            canUpdateStatus={canUpdateStatus}
            onStatusChanged={handleStatusChanged}
          />
        ))
      )}
    </div>
  );
}