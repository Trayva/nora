import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import {
  MdBuild,
  MdAdd,
  MdExpandMore,
  MdExpandLess,
  MdClose,
  MdImage,
  MdCircle,
  MdCheck,
  MdWarning,
  MdError,
  MdInfo,
  MdUpload,
} from "react-icons/md";

/* ── helpers ── */
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

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TYPE_OPTIONS     = ["MECHANICAL", "ELECTRICAL", "PLUMBING", "STRUCTURAL", "OTHER"];
const STATUS_OPTIONS   = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const priorityStyle = {
  LOW:      { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  MEDIUM:   { bg: "rgba(234,179,8,0.1)",   color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  HIGH:     { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "rgba(239,68,68,0.25)" },
  CRITICAL: { bg: "rgba(168,85,247,0.1)",  color: "#a855f7", border: "rgba(168,85,247,0.25)" },
};
const statusStyle = {
  OPEN:        { bg: "rgba(234,179,8,0.1)",  color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  IN_PROGRESS: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  RESOLVED:    { bg: "rgba(34,197,94,0.1)",  color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  CLOSED:      { bg: "rgba(107,114,128,0.1)",color: "#6b7280", border: "rgba(107,114,128,0.25)" },
};

function Badge({ label, styleMap, fallbackBg = "var(--bg-hover)" }) {
  const s = styleMap?.[label] || { bg: fallbackBg, color: "var(--text-muted)", border: "var(--border)" };
  return (
    <span
      style={{
        fontSize: "0.62rem", fontWeight: 800, padding: "2px 8px",
        borderRadius: 999, background: s.bg, color: s.color,
        border: `1px solid ${s.border}`, flexShrink: 0, letterSpacing: "0.04em",
      }}
    >
      {label}
    </span>
  );
}

/* ── Report Row ── */
function ReportRow({ report, canUpdateStatus }) {
  const [expanded, setExpanded]   = useState(false);
  const [updating, setUpdating]   = useState(false);
  const [localStatus, setLocalStatus] = useState(report.status);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/icart/maintenance/${report.id}/status`, { status: newStatus });
      setLocalStatus(newStatus);
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 14, overflow: "hidden", marginBottom: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 14px", cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <MdBuild size={15} style={{ color: "#ef4444" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.85rem", fontWeight: 700, color: "var(--text-body)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              marginBottom: 3,
            }}
          >
            {report.reportText?.slice(0, 80) || "Maintenance Report"}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <Badge label={report.priority || "LOW"} styleMap={priorityStyle} />
            <Badge label={report.type || "OTHER"} styleMap={{}} fallbackBg="var(--bg-hover)" />
            <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
              {fmtDate(report.createdAt)}
            </span>
          </div>
        </div>
        <Badge label={localStatus || "OPEN"} styleMap={statusStyle} />
        {expanded
          ? <MdExpandLess size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          : <MdExpandMore size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        }
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 16px" }}>
          {/* Full report text */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 6 }}>
              Report
            </div>
            <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-body)", lineHeight: 1.65 }}>
              {report.reportText}
            </p>
          </div>

          {/* Responses / Q&A */}
          {report.responses?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 8 }}>
                Checklist
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {report.responses.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "9px 12px", background: "var(--bg-hover)",
                      border: "1px solid var(--border)", borderRadius: 9,
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 2 }}>
                      {r.q}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-body)", fontWeight: 600 }}>
                      {r.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {report.images?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 8 }}>
                Images
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {report.images.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noreferrer">
                    <img
                      src={img}
                      alt={`Report image ${i + 1}`}
                      style={{
                        width: 72, height: 72, borderRadius: 9,
                        objectFit: "cover", border: "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reporter info */}
          {report.reporter && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                padding: "8px 11px", background: "var(--bg-hover)",
                border: "1px solid var(--border)", borderRadius: 9,
              }}
            >
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "var(--bg-active)",
                  border: "1px solid rgba(203,108,220,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "var(--accent)" }}>
                  {(report.reporter.fullName || report.reporter.email || "?")[0].toUpperCase()}
                </span>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>Reported by</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-body)", fontWeight: 700 }}>
                  {report.reporter.fullName || report.reporter.email}
                </div>
              </div>
            </div>
          )}

          {/* Status updater */}
          {canUpdateStatus && (
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 8 }}>
                Update Status
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUS_OPTIONS.map((s) => {
                  const st = statusStyle[s] || {};
                  const active = localStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => !active && handleStatusChange(s)}
                      disabled={updating || active}
                      style={{
                        height: 30, padding: "0 12px", borderRadius: 7,
                        border: `1px solid ${active ? st.border : "var(--border)"}`,
                        background: active ? st.bg : "var(--bg-hover)",
                        color: active ? st.color : "var(--text-muted)",
                        cursor: active ? "default" : "pointer",
                        fontFamily: "inherit", fontWeight: 700, fontSize: "0.72rem",
                        opacity: updating ? 0.6 : 1, transition: "all 0.12s",
                      }}
                    >
                      {active && <MdCheck size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />}
                      {s}
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

/* ── Create Report Form ── */
function CreateReportForm({ cartId, onCreated, onCancel }) {
  const [reportText, setReportText] = useState("");
  const [priority, setPriority]     = useState("MEDIUM");
  const [type, setType]             = useState("OTHER");
  const [responses, setResponses]   = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const addResponse = () =>
    setResponses((p) => [...p, { q: "", a: "" }]);
  const updateResponse = (i, field, val) =>
    setResponses((p) => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const removeResponse = (i) =>
    setResponses((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!reportText.trim() || reportText.trim().length < 5)
      return toast.error("Report text must be at least 5 characters");
    setSubmitting(true);
    try {
      const payload = {
        cartId,
        reportText: reportText.trim(),
        priority,
        type,
        ...(responses.filter((r) => r.q.trim() && r.a.trim()).length > 0
          ? { responses: responses.filter((r) => r.q.trim() && r.a.trim()) }
          : {}),
      };
      const res = await api.post("/icart/maintenance", payload);
      toast.success("Maintenance report created");
      onCreated(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-hover)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 16, marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: "0.62rem", fontWeight: 900, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 14,
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
          placeholder="Describe the issue in detail… (min 5 characters)"
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      {/* Priority + Type */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div className="form-field">
          <label className="modal-label">Priority *</label>
          <select className="modal-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="modal-label">Type *</label>
          <select className="modal-input" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Responses / checklist */}
      {responses.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <label className="modal-label">Checklist Items</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {responses.map((r, i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "10px 12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)" }}>
                    Item {i + 1}
                  </span>
                  <button
                    onClick={() => removeResponse(i)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-muted)", display: "flex", padding: 0,
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
          background: "none", border: "none", color: "var(--accent)",
          fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
          fontFamily: "inherit", display: "flex", alignItems: "center",
          gap: 4, padding: 0, marginBottom: 14,
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
          style={{ flex: 2, height: 40, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          <span className="btn_text"><MdBuild size={14} /> Submit Report</span>
          {submitting && <span className="btn_loader" style={{ width: 13, height: 13 }} />}
        </button>
      </div>
    </div>
  );
}

/* ── Main MaintenanceTab export ── */
export default function MaintenanceTab({ cartId, canUpdateStatus = false }) {
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/maintenance/icart/${cartId}`);
      const d = res.data.data;
      setReports(Array.isArray(d) ? d : d?.items || d?.reports || []);
    } catch {
      toast.error("Failed to load maintenance reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cartId) fetchReports();
  }, [cartId]);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-heading)" }}>
            Maintenance Reports
          </span>
          {reports.length > 0 && (
            <span
              style={{
                marginLeft: 8, fontSize: "0.68rem", fontWeight: 700,
                padding: "2px 8px", borderRadius: 999,
                background: "var(--bg-hover)", color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {reports.length}
            </span>
          )}
        </div>
        <button
          className={`app_btn${showForm ? " app_btn_cancel" : " app_btn_confirm"}`}
          style={{ height: 34, padding: "0 14px", fontSize: "0.78rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? <><MdClose size={13} /> Cancel</> : <><MdAdd size={13} /> Report Issue</>}
        </button>
      </div>

      {showForm && (
        <CreateReportForm
          cartId={cartId}
          onCreated={(newReport) => {
            setReports((p) => [newReport, ...p]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="drawer_loading"><div className="page_loader_spinner" /></div>
      ) : reports.length === 0 && !showForm ? (
        <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
          <MdBuild size={28} style={{ opacity: 0.3 }} />
          <span>No maintenance reports</span>
        </div>
      ) : (
        reports.map((r) => (
          <ReportRow key={r.id} report={r} canUpdateStatus={canUpdateStatus} />
        ))
      )}
    </div>
  );
}