import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import {
  MdBuild,
  MdAdd,
  MdClose,
  MdExpandMore,
  MdExpandLess,
  MdCheck,
  MdPerson,
  MdSignalCellularAlt,
  MdWifi,
  MdWifiOff,
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";

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

/* ── Maintenance Checklist Constant ── */
const MAINTENANCE_CHECKLIST = {
  "Opening Routines": [
    "Self Implement Personal Hygiene Checklist",
    "Turn On Wafel Iron, Soft Icecream Machine and POS",
    "Check Water Level in Bain Marie and Turn On",
    "Place Caramel Tubs And Chocolate Tubs On Heating",
    "Put In Place, Stroopwafel Station",
    "Put In Place Milk Tea Station",
    "Sanitizer In Place & Filled As Needed",
    "Tissue Boxes Filled As Needed",
  ],
  "Service Routines": [
    "Customer Line Of Sight Is Clean",
    "Check Freshness & Toppings Every 15 Minutes",
    "Clean Wafel Station Frequently Especially The Cutting Board",
    "Make Sure At Least 50% of Tubs Full and Two Doughs Out",
    "Check Milk Tea Level",
  ],
  "Closing Routines": [
    "Switch Off POS, Wafel Iron and Soft Icecream Machine",
    "Empty All Caramel and Chocolate Tubs and Wash",
    "Wash Mixing Containers and Straw Containers",
    "Wipe Down All Working Surfaces",
    "Wash Bain Marie and Wipe Down",
    "Count Physical Inventory and Sign Off On Daily Report",
    "Store All Perishables in Fridge",
    "Turn Off Main Lights and Secure Cart",
  ],
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const statusStyle = {
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  IN_PROGRESS: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
  },
  RESOLVED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  CLOSED: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
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
      }}
    >
      {status}
    </span>
  );
}

/* ── Single Report Row ── */
function ReportRow({ report, canUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(report.status);

  const reporter = report.user;
  const cart = report.cart;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/icart/maintenance/${report.id}/status`, {
        status: newStatus,
      });
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
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      {/* Collapsed header */}
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

      {/* Expanded body */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* Reporter card with avatar, name, email, phone */}
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
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "2px solid var(--border)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "var(--bg-active)",
                    border: "1px solid rgba(203,108,220,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MdPerson size={18} style={{ color: "var(--accent)" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                    marginBottom: 2,
                  }}
                >
                  {reporter.fullName || "Unknown"}
                </div>
                <div
                  style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                >
                  {[reporter.email, reporter.phone].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Submitted
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "var(--text-body)",
                  }}
                >
                  {fmtDate(report.submittedAt || report.createdAt)}
                </div>
              </div>
            </div>
          )}

          {/* Report text */}
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
                margin: "0 0 14px",
                fontSize: "0.84rem",
                color: "var(--text-body)",
                lineHeight: 1.65,
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
                      alt=""
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 9,
                        objectFit: "cover",
                        border: "1px solid var(--border)",
                        display: "block",
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Cart context chip — visible when aggregator sees embedded cart data */}
          {cart && (
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
                Cart
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: "var(--bg-active)",
                    border: "1px solid rgba(203,108,220,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LuShoppingCart
                    size={15}
                    style={{ color: "var(--accent)" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      color: "var(--text-body)",
                      fontFamily: "monospace",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {cart.serialNumber}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      marginTop: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: cart.isOnline ? "#16a34a" : "#6b7280",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      {cart.isOnline ? (
                        <MdWifi size={11} />
                      ) : (
                        <MdWifiOff size={11} />
                      )}
                      {cart.isOnline ? "Online" : "Offline"}
                    </span>
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        background: "var(--text-muted)",
                        opacity: 0.4,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.62rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {cart.menuItems?.length || 0} item
                      {(cart.menuItems?.length || 0) !== 1 ? "s" : ""}
                    </span>
                    {cart.serviceRadius > 0 && (
                      <>
                        <span
                          style={{
                            width: 3,
                            height: 3,
                            borderRadius: "50%",
                            background: "var(--text-muted)",
                            opacity: 0.4,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.62rem",
                            color: "var(--text-muted)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <MdSignalCellularAlt size={10} />
                          {cart.serviceRadius} km
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {cart.status && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 999,
                      flexShrink: 0,
                      background: "var(--bg-active)",
                      color: "var(--accent)",
                      border: "1px solid rgba(203,108,220,0.25)",
                    }}
                  >
                    {cart.status}
                  </span>
                )}
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

/* ── Create Report Form ── */
function CreateReportForm({ cartId, onCreated, onCancel }) {
  const [reportText, setReportText] = useState("");
  const [responses, setResponses] = useState(() => {
    const initial = [];
    Object.values(MAINTENANCE_CHECKLIST).forEach((items) => {
      items.forEach((q) => {
        initial.push({ q, a: "No", isPredefined: true });
      });
    });
    return initial;
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const addResponse = ({ q = '', isIssue = false }) => setResponses((p) => [...p, { q, a: "", isIssue }]);
  const updateResponse = (i, field, val) =>
    setResponses((p) =>
      p.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)),
    );
  const removeResponse = (i) =>
    setResponses((p) => p.filter((_, idx) => idx !== i));

  const toggleChecklistItem = (q) => {
    setResponses((prev) =>
      prev.map((r) => (r.q === q ? { ...r, a: r.a === "Yes" ? "No" : "Yes" } : r)),
    );
  };

  const handleSubmit = async () => {
    if (!reportText.trim() || reportText.trim().length < 5)
      return toast.error("Report text must be at least 5 characters");
    setSubmitting(true);
    try {
      const validResponses = responses.filter((r) => r.q.trim() && r.a.trim());

      const formData = new FormData();
      formData.append("cartId", cartId);
      formData.append("reportText", reportText.trim());

      if (validResponses.length > 0) {
        formData.append("responses", JSON.stringify(validResponses));
      }

      images.forEach((img) => {
        formData.append("images", img);
      });

      const res = await api.post("/icart/maintenance", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

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
        New Report
      </div>

      <div className="form-field">
        <label className="modal-label">Description *</label>
        <textarea
          className="modal-input"
          rows={3}
          placeholder="Describe the your report (min 5 chars)"
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        {Object.entries(MAINTENANCE_CHECKLIST).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ flex: 1, height: 1, background: "var(--bg-card)" }} />
              {group}
              <div style={{ flex: 1, height: 1, background: "var(--bg-card)" }} />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 8,
              }}
            >
              {items.map((item) => {
                const isChecked = responses.find((r) => r.q === item)?.a === "Yes";
                return (
                  <div
                    key={item}
                    onClick={() => toggleChecklistItem(item)}
                    style={{
                      padding: "8px 12px",
                      background: isChecked ? "rgba(203,108,220,0.08)" : "var(--bg-card)",
                      border: `1px solid ${isChecked ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `2px solid ${isChecked ? "var(--accent)" : "var(--text-muted)"}`,
                        background: isChecked ? "var(--accent)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isChecked && <MdCheck size={12} style={{ color: "#fff" }} />}
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: isChecked ? 700 : 500,
                        color: isChecked ? "var(--text-body)" : "var(--text-muted)",
                        lineHeight: 1.3,
                      }}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {responses.filter((r) => !r.isPredefined).length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <label className="modal-label">Observations & Issues</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {responses.map((r, i) => {
              if (r.isPredefined) return null;
              return (
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
                        color: r.isIssue ? "#ef4444" : "var(--text-muted)",
                      }}
                    >
                      {r.isIssue ? "Issue" : `Custom Item ${i + 1}`}
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
                    disabled={r.isIssue}
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
              );
            })}
          </div>
        </div>
      )}

      <div className="form-field">
        <label className="modal-label">Upload Images (Optional)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          className="modal-input"
          onChange={(e) => setImages(Array.from(e.target.files))}
          style={{ padding: "8px 12px" }}
        />
        {images.length > 0 && (
          <div style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {images.length} image(s) selected
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
        <button
          onClick={() => addResponse({ q: `Issue/Problem`, isIssue: true })}
          style={{
            background: "var(--accent)",
            border: "1px solid var(--accent)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.78rem",
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "7px 10px",
            marginBottom: 14,
            borderRadius: 8
          }}
        >
          <MdAdd size={14} /> Report an issue
        </button>
      </div>

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

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT — used in AggregatorPage
   ═══════════════════════════════════════════════════════ */
export default function MaintenanceTab({ cartId, canUpdateStatus = false }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchReports = async () => {
    if (!cartId) return;
    setLoading(true);
    try {
      const res = await api.get(`/icart/maintenance/icart/${cartId}`);
      const d = res.data.data;
      setReports(Array.isArray(d) ? d : d?.items || []);
      setTotal(d?.total ?? 0);
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 800,
              color: "var(--text-heading)",
            }}
          >
            Reports
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
        <button
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
              <MdAdd size={13} /> Submit Report
            </>
          )}
        </button>
      </div>

      {showForm && (
        <CreateReportForm
          cartId={cartId}
          onCreated={(newReport) => {
            setReports((p) => [newReport, ...p]);
            setTotal((t) => t + 1);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

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
          <ReportRow key={r.id} report={r} canUpdateStatus={canUpdateStatus} />
        ))
      )}
    </div>
  );
}
