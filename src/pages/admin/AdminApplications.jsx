import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdOutlineFactCheck,
  MdCheck,
  MdChevronLeft,
  MdChevronRight,
  MdOutlinePerson,
  MdOutlineLocationOn,
  MdOutlineReceiptLong,
  MdOutlineDescription,
  MdClose,
  MdExpandMore,
  MdExpandLess,
  MdCircle,
  MdReceiptLong,
  MdCalendarToday,
} from "react-icons/md";
import { LuStore } from "react-icons/lu";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";
import { StatusBadge, getS } from "./adminUtils_";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const CONTRACT_TYPES = ["LEASE", "PURCHASE"];
const CONTRACT_STATUSES = [
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "ACTIVE",
  "INACTIVE",
];

/* ── Detail row helper ── */
function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "8px 10px",
        background: "var(--bg-hover)",
        border: "1px solid var(--border)",
        borderRadius: 9,
      }}
    >
      <div
        style={{
          fontSize: "0.6rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "var(--text-body)",
        }}
      >
        {String(value)}
      </div>
    </div>
  );
}

/* ── Section block ── */
function Section({ icon: Icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px 0",
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: "var(--bg-active)",
            border: "1px solid rgba(203,108,220,0.2)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={13} />
        </div>
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 800,
            color: "var(--text-heading)",
            flex: 1,
            textAlign: "left",
          }}
        >
          {title}
        </span>
        {open ? (
          <MdExpandLess size={15} style={{ color: "var(--text-muted)" }} />
        ) : (
          <MdExpandMore size={15} style={{ color: "var(--text-muted)" }} />
        )}
      </button>
      {open && <div style={{ paddingTop: 4 }}>{children}</div>}
    </div>
  );
}

/* ── Application detail drawer ── */
const appStatusColors = {
  SUBMITTED: {
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
  ACTIVE: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  INACTIVE: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
  CANCELLED: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
};
const invStatusColors = {
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  PAID: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  OVERDUE: {
    bg: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.25)",
  },
  CANCELLED: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
};

function ColorBadge({ status, colors }) {
  const s = colors[status] || Object.values(colors)[0];
  return (
    <span
      className="kiosk_status_badge"
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

function AppDetail({ app: initial, onClose, onApproved }) {
  const [app, setApp] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/contract/application/${initial.id}`)
      .then((r) => {
        const d = r.data.data;
        if (d) setApp(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initial.id]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.post(`/contract/application/${app.id}/approve`);
      toast.success("Application approved");
      setApp((prev) => ({ ...prev, status: "APPROVED" }));
      onApproved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setApproving(false);
    }
  };

  const user = app.user || app.owner || app.applicant;
  const invoices = app.invoiceDetails || (app.invoice ? [app.invoice] : []);
  const carts = app.carts || [];
  const payments = app.payments || app.paymentSchedule || [];

  return (
    <Drawer isOpen onClose={onClose} title="Contract Application" width={520}>
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "16px 0",
          }}
        >
          <div
            className="page_loader_spinner"
            style={{ width: 18, height: 18 }}
          />
        </div>
      )}

      {/* ── Hero ── */}
      <div className="contract_drawer_hero" style={{ marginBottom: 16 }}>
        <div className="contract_drawer_hero_left">
          <span className="contract_drawer_id">
            #{app.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="contract_drawer_date">
            <MdCalendarToday size={11} /> Submitted {fmtDate(app.createdAt)}
          </span>
        </div>
        <ColorBadge status={app.status} colors={appStatusColors} />
      </div>

      {/* ── Meta grid ── */}
      <div className="contract_meta_grid" style={{ marginBottom: 20 }}>
        <div className="contract_meta_item">
          <span className="contract_meta_label">Type</span>
          <span className="contract_meta_value">{app.type || "—"}</span>
        </div>
        <div className="contract_meta_item">
          <span className="contract_meta_label">Kiosks Ordered</span>
          <span className="contract_meta_value">
            {app.numberOfKiosks ?? "—"}
          </span>
        </div>
        {app.state?.name && (
          <div className="contract_meta_item">
            <span className="contract_meta_label">State</span>
            <span className="contract_meta_value">
              {app.state.name}
              {app.state.country ? `, ${app.state.country}` : ""}
            </span>
          </div>
        )}
        {app.kioskSize && (
          <div className="contract_meta_item">
            <span className="contract_meta_label">Kiosk Size</span>
            <span className="contract_meta_value">{app.kioskSize}</span>
          </div>
        )}
        {app.duration && (
          <div className="contract_meta_item">
            <span className="contract_meta_label">Duration</span>
            <span className="contract_meta_value">{app.duration} months</span>
          </div>
        )}
        {app.type !== "PURCHASE" && app.contractStartDate && (
          <div className="contract_meta_item">
            <span className="contract_meta_label">Contract Start</span>
            <span className="contract_meta_value">
              {fmtDate(app.contractStartDate)}
            </span>
          </div>
        )}
        {app.contractStatus && (
          <div className="contract_meta_item">
            <span className="contract_meta_label">Contract Status</span>
            <span className="contract_meta_value">{app.contractStatus}</span>
          </div>
        )}
        {app.nextInvoiceAt && (
          <div className="contract_meta_item">
            <span className="contract_meta_label">Next Invoice</span>
            <span className="contract_meta_value">
              {fmtDate(app.nextInvoiceAt)}
            </span>
          </div>
        )}
        {app.approvedAt && (
          <div className="contract_meta_item">
            <span className="contract_meta_label">Approved</span>
            <span className="contract_meta_value">
              {fmtDate(app.approvedAt)}
            </span>
          </div>
        )}
        {app.rejectedAt && (
          <div className="contract_meta_item">
            <span className="contract_meta_label">Rejected</span>
            <span className="contract_meta_value">
              {fmtDate(app.rejectedAt)}
            </span>
          </div>
        )}
        {app.rejectionReason && (
          <div className="contract_meta_item" style={{ gridColumn: "1 / -1" }}>
            <span className="contract_meta_label">Rejection Reason</span>
            <span className="contract_meta_value">{app.rejectionReason}</span>
          </div>
        )}
        {app.notes && (
          <div className="contract_meta_item" style={{ gridColumn: "1 / -1" }}>
            <span className="contract_meta_label">Notes</span>
            <span className="contract_meta_value">{app.notes}</span>
          </div>
        )}
      </div>

      {/* ── Approve button (if SUBMITTED) ── */}
      {app.status === "SUBMITTED" && (
        <button
          className={`app_btn app_btn_confirm${approving ? " btn_loading" : ""}`}
          style={{
            height: 36,
            padding: "0 18px",
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            marginBottom: 20,
          }}
          onClick={handleApprove}
          disabled={approving}
        >
          <span className="btn_text">
            <MdCheck size={13} /> Approve Application
          </span>
          {approving && (
            <span className="btn_loader" style={{ width: 12, height: 12 }} />
          )}
        </button>
      )}

      {/* ── Applicant ── */}
      {user && (
        <div className="contract_section">
          <div className="contract_section_header">
            <MdOutlinePerson size={15} color="var(--accent)" />
            <span className="contract_section_title">Applicant</span>
          </div>
          <div className="contract_meta_grid">
            {(user.fullName || user.name) && (
              <div className="contract_meta_item">
                <span className="contract_meta_label">Name</span>
                <span className="contract_meta_value">
                  {user.fullName || user.name}
                </span>
              </div>
            )}
            {user.email && (
              <div className="contract_meta_item">
                <span className="contract_meta_label">Email</span>
                <span className="contract_meta_value">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="contract_meta_item">
                <span className="contract_meta_label">Phone</span>
                <span className="contract_meta_value">{user.phone}</span>
              </div>
            )}
            {user.id && (
              <div className="contract_meta_item">
                <span className="contract_meta_label">User ID</span>
                <span
                  className="contract_meta_value"
                  style={{ fontFamily: "monospace" }}
                >
                  #{user.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Invoices ── */}
      {invoices.map((inv, idx) => (
        <div key={inv.id || idx} className="contract_section">
          <div className="contract_section_header">
            <MdReceiptLong size={15} color="var(--accent)" />
            <span className="contract_section_title">
              Invoice{invoices.length > 1 ? ` ${idx + 1}` : ""}
            </span>
            <ColorBadge status={inv.status} colors={invStatusColors} />
          </div>
          <div className="contract_invoice_block">
            {inv.items?.map((item, i) => (
              <div key={i} className="contract_invoice_item">
                <div className="contract_invoice_item_info">
                  <span className="contract_invoice_item_title">
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="contract_invoice_item_desc">
                      {item.description}
                    </span>
                  )}
                </div>
                <div className="contract_invoice_item_right">
                  <span className="contract_invoice_item_qty">
                    × {item.quantity}
                  </span>
                  <span className="contract_invoice_item_amount">
                    {Number(item.amount * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            <div className="contract_invoice_total">
              <span className="contract_invoice_total_label">Total</span>
              <span className="contract_invoice_total_amount">
                {Number(inv.total || 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="contract_invoice_meta_row">
            <span className="contract_meta_label">Due Date</span>
            <span className="contract_meta_value">{fmtDate(inv.dueDate)}</span>
          </div>
          {inv.paidAt && (
            <div className="contract_invoice_meta_row" style={{ marginTop: 4 }}>
              <span className="contract_meta_label">Paid</span>
              <span className="contract_meta_value">
                {fmtDate(inv.paidAt)}
                {inv.paymentMethod ? ` via ${inv.paymentMethod}` : ""}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* ── Payment schedule ── */}
      {payments.length > 0 && (
        <div className="contract_section">
          <div className="contract_section_header">
            <MdReceiptLong size={15} color="var(--accent)" />
            <span className="contract_section_title">Payment Schedule</span>
            <span className="contract_section_count">{payments.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {payments.map((p, i) => {
              const ps =
                p.status === "PAID"
                  ? invStatusColors.PAID
                  : p.status === "OVERDUE"
                    ? invStatusColors.OVERDUE
                    : invStatusColors.PENDING;
              return (
                <div
                  key={p.id || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                        marginBottom: 2,
                      }}
                    >
                      Payment {i + 1}
                      {p.label ? ` · ${p.label}` : ""}
                    </div>
                    <div
                      style={{
                        fontSize: "0.66rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Due: {fmtDate(p.dueDate || p.due_date)}
                      {p.paidAt && ` · Paid: ${fmtDate(p.paidAt)}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 900,
                        color: "var(--text-heading)",
                      }}
                    >
                      ₦{Number(p.amount || 0).toLocaleString()}
                    </div>
                    {p.status && (
                      <span
                        className="kiosk_status_badge"
                        style={{
                          background: ps.bg,
                          color: ps.color,
                          border: `1px solid ${ps.border}`,
                        }}
                      >
                        <MdCircle size={5} />
                        {p.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Assigned Kiosks ── */}
      <div className="contract_section">
        <div className="contract_section_header">
          <LuStore size={14} color="var(--accent)" />
          <span className="contract_section_title">Assigned Kiosks</span>
          <span className="contract_section_count">{carts.length}</span>
        </div>
        {carts.length > 0 ? (
          <div className="drawer_items_list">
            {carts.map((cart) => (
              <div key={cart.id} className="drawer_item_row">
                <div className="drawer_item_img drawer_item_img_placeholder">
                  <LuStore size={14} />
                </div>
                <div className="drawer_item_info">
                  <span
                    className="concept_item_name"
                    style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  >
                    {cart.serialNumber}
                  </span>
                  <span className="concept_item_desc">{cart.status}</span>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  <span
                    className={`kiosk_indicator ${cart.isOnline ? "kiosk_ind_on" : "kiosk_ind_off"}`}
                    style={{ fontSize: "0.65rem", padding: "2px 7px" }}
                  >
                    {cart.isOnline ? "Online" : "Offline"}
                  </span>
                  <span
                    className={`kiosk_indicator ${cart.isLocked ? "kiosk_ind_locked" : "kiosk_ind_unlocked"}`}
                    style={{ fontSize: "0.65rem", padding: "2px 7px" }}
                  >
                    {cart.isLocked ? "Locked" : "Unlocked"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="contract_empty_carts">
            <LuStore size={22} style={{ opacity: 0.25 }} />
            <span>No Kiosks assigned yet</span>
          </div>
        )}
      </div>
    </Drawer>
  );
}

/* ── List card ── */
function AppCard({ app, onSelect, onApprove, approving }) {
  const s = getS(app.status);
  const user = app.user || app.owner || app.applicant;
  return (
    <div
      className="admin_card"
      style={{ cursor: "pointer" }}
      onClick={() => onSelect(app)}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: s.bg,
          border: `1px solid ${s.border}`,
          color: s.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <MdOutlineFactCheck size={16} />
      </div>
      <div className="admin_card_body">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 4,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              fontFamily: "monospace",
            }}
          >
            #{app.id.slice(0, 8).toUpperCase()}
          </span>
          <StatusBadge status={app.status} />
        </div>
        <div className="admin_card_meta">
          {(user?.fullName || user?.name) && (
            <span className="admin_meta_chip">
              {user.fullName || user.name}
            </span>
          )}
          {user?.email && <span className="admin_meta_chip">{user.email}</span>}
          {app.type && <span className="admin_meta_chip">{app.type}</span>}
          {app.numberOfKiosks && (
            <span className="admin_meta_chip">
              {app.numberOfKiosks} Kiosk{app.numberOfKiosks !== 1 ? "s" : ""}
            </span>
          )}
          {app.state?.name && (
            <span className="admin_meta_chip">{app.state.name}</span>
          )}
          <span className="admin_meta_chip">{fmtDate(app.createdAt)}</span>
        </div>
      </div>
      {app.status === "SUBMITTED" && (
        <button
          className={`app_btn app_btn_confirm${approving === app.id ? " btn_loading" : ""}`}
          style={{
            height: 34,
            padding: "0 14px",
            fontSize: "0.75rem",
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onApprove(app.id);
          }}
          disabled={!!approving}
        >
          <span className="btn_text">
            <MdCheck size={13} /> Approve
          </span>
          {approving === app.id && (
            <span className="btn_loader" style={{ width: 12, height: 12 }} />
          )}
        </button>
      )}
    </div>
  );
}

/* ── Main drawer ── */
export default function AdminApplications({ open, onClose, onApproved }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [selected, setSelected] = useState(null);

  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [states, setStates] = useState([]);
  const limit = 15;

  useEffect(() => {
    api
      .get("/config/state")
      .then((r) => {
        const d = r.data.data;
        setStates(Array.isArray(d) ? d : d?.states || d?.items || []);
      })
      .catch(() => {});
  }, []);

  const fetchApps = async (s = status, t = type, c = country, p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (s) params.status = s;
      if (t) params.type = t;
      if (c) params.stateId = c;
      const r = await api.get("/contract/application/all", { params });
      const d = r.data.data;
      const list = Array.isArray(d) ? d : d?.items || d?.applications || [];
      setItems(list);
      setTotal(d?.total || list.length);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchApps();
  }, [open]);

  const applyFilter = (s, t, c, p = 1) => {
    setStatus(s);
    setType(t);
    setCountry(c);
    setPage(p);
    fetchApps(s, t, c, p);
  };

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await api.post(`/contract/application/${id}/approve`);
      toast.success("Approved");
      fetchApps();
      onApproved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setApproving(null);
    }
  };

  const handlePage = (p) => {
    setPage(p);
    fetchApps(status, type, country, p);
  };
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pending = items.filter((a) => a.status === "SUBMITTED").length;
  const activeFilters = [status, type, country].filter(Boolean).length;

  return (
    <>
      <Drawer
        isOpen={open}
        onClose={onClose}
        title="Contract Applications"
        description="All contract applications across the platform"
        width={600}
      >
        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 14,
            alignItems: "center",
          }}
        >
          <select
            className="modal-input"
            style={{ marginBottom: 0, flex: 1, minWidth: 120 }}
            value={status}
            onChange={(e) => applyFilter(e.target.value, type, country)}
          >
            <option value="">All Statuses</option>
            {CONTRACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="modal-input"
            style={{ marginBottom: 0, flex: 1, minWidth: 110 }}
            value={type}
            onChange={(e) => applyFilter(status, e.target.value, country)}
          >
            <option value="">All Types</option>
            {CONTRACT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="modal-input"
            style={{ marginBottom: 0, flex: 1, minWidth: 130 }}
            value={country}
            onChange={(e) => applyFilter(status, type, e.target.value)}
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {activeFilters > 0 && (
            <button
              className="app_btn app_btn_cancel"
              style={{
                height: 38,
                padding: "0 12px",
                fontSize: "0.75rem",
                whiteSpace: "nowrap",
              }}
              onClick={() => applyFilter("", "", "")}
            >
              Clear ({activeFilters})
            </button>
          )}
          {loading && (
            <div
              className="page_loader_spinner"
              style={{ width: 16, height: 16 }}
            />
          )}
        </div>

        {/* Count row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span className="admin_section_count">{total} total</span>
          {pending > 0 && (
            <span
              className="admin_section_count"
              style={{
                background: "rgba(234,179,8,0.1)",
                color: "#ca8a04",
                border: "1px solid rgba(234,179,8,0.25)",
              }}
            >
              {pending} pending
            </span>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="page_loader">
            <div className="page_loader_spinner" />
          </div>
        ) : items.length === 0 ? (
          <div className="admin_empty">
            <p style={{ margin: 0, fontSize: "0.82rem" }}>
              No applications found.
            </p>
          </div>
        ) : (
          <div className="admin_card_list">
            {items.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onSelect={setSelected}
                onApprove={handleApprove}
                approving={approving}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 16,
            }}
          >
            <button
              className="biz_icon_btn"
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1}
            >
              <MdChevronLeft size={16} />
            </button>
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              Page {page} of {totalPages}
            </span>
            <button
              className="biz_icon_btn"
              onClick={() => handlePage(page + 1)}
              disabled={page >= totalPages}
            >
              <MdChevronRight size={16} />
            </button>
          </div>
        )}
      </Drawer>

      {/* Detail drawer */}
      {selected && (
        <AppDetail
          app={selected}
          onClose={() => setSelected(null)}
          onApproved={() => {
            fetchApps();
            onApproved?.();
            // update the item in list too
            setItems((prev) =>
              prev.map((a) =>
                a.id === selected.id ? { ...a, status: "APPROVED" } : a,
              ),
            );
          }}
        />
      )}
    </>
  );
}
