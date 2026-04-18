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
        <div style={{ padding: "20px" }}>
          <div className="skeleton_shimmer skeleton_rect" style={{ height: "40px", marginBottom: "12px" }} />
          <div className="skeleton_shimmer skeleton_rect" style={{ height: "100px", marginBottom: "12px" }} />
          <div className="skeleton_shimmer skeleton_rect" style={{ height: "60px" }} />
        </div>
      )}

      {/* ── Hero ── */}
      {!loading && (
        <>
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
                    </div>
                    <div className="contract_invoice_item_right">
                      <span className="contract_invoice_item_qty">
                        × {item.quantity}
                      </span>
                      <span className="contract_invoice_item_amount">
                        ₦{Number(item.amount * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="contract_invoice_total">
                  <span className="contract_invoice_total_label">Total</span>
                  <span className="contract_invoice_total_amount">
                    ₦{Number(inv.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
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
          {app.type && <span className="admin_meta_chip">{app.type}</span>}
          <span className="admin_meta_chip">{fmtDate(app.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
const ItemListSkeleton = ({ count = 5 }) => (
  <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: "10px" }}>
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="admin_card" style={{ cursor: "default" }}>
        <div className="skeleton_shimmer skeleton_circle" style={{ width: "36px", height: "36px" }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton_shimmer skeleton_text" style={{ width: "20%", height: "14px", marginBottom: "8px" }} />
          <div className="skeleton_shimmer skeleton_text" style={{ width: "60%", height: "10px" }} />
        </div>
        <div className="skeleton_shimmer skeleton_rect" style={{ width: "70px", height: "24px", borderRadius: "18px" }} />
      </div>
    ))}
  </div>
);

/* ── Main drawer ── */
export default function AdminApplications({ open, onClose, onApproved }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [selected, setSelected] = useState(null);

  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [stateId, setStateId] = useState("");
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

  const fetchApps = async (s = status, t = type, sid = stateId, p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (s) params.status = s;
      if (t) params.type = t;
      if (sid) params.stateId = sid;
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

  const applyFilter = (s, t, sid) => {
    setStatus(s);
    setType(t);
    setStateId(sid);
    setPage(1);
    fetchApps(s, t, sid, 1);
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
    fetchApps(status, type, stateId, p);
  };
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <Drawer
        isOpen={open}
        onClose={onClose}
        title="Applications"
        description="All contract applications submitted by applicants"
        width={540}
      >
        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 14,
            padding: "0 10px"
          }}
        >
          <select
            className="modal-input"
            style={{ marginBottom: 0, flex: 1, minWidth: 100 }}
            value={status}
            onChange={(e) => applyFilter(e.target.value, type, stateId)}
          >
            <option value="">Status</option>
            {CONTRACT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="modal-input"
            style={{ marginBottom: 0, flex: 1, minWidth: 100 }}
            value={type}
            onChange={(e) => applyFilter(status, e.target.value, stateId)}
          >
            <option value="">Type</option>
            {CONTRACT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            className="modal-input"
            style={{ marginBottom: 0, flex: 2, minWidth: 120 }}
            value={stateId}
            onChange={(e) => applyFilter(status, type, e.target.value)}
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <ItemListSkeleton />
        ) : items.length === 0 ? (
          <div className="admin_empty">
            <p style={{ margin: 0, fontSize: "0.82rem" }}>No applications found.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 10px" }}>
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
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <button className="biz_icon_btn" onClick={() => handlePage(page - 1)} disabled={page <= 1}>
              <MdChevronLeft size={16} />
            </button>
            <span style={{ fontSize: "0.8rem", alignSelf: "center" }}>{page} / {totalPages}</span>
            <button className="biz_icon_btn" onClick={() => handlePage(page + 1)} disabled={page >= totalPages}>
              <MdChevronRight size={16} />
            </button>
          </div>
        )}
      </Drawer>

      {selected && (
        <AppDetail
          app={selected}
          onClose={() => setSelected(null)}
          onApproved={() => {
            fetchApps();
            onApproved?.();
          }}
        />
      )}
    </>
  );
}
