import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdOutlineFactCheck,
  MdCheck,
  MdCircle,
  MdChevronLeft,
  MdChevronRight,
  MdFilterList,
} from "react-icons/md";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";
import { StatusBadge, getS } from "./adminUtils";

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

function AppCard({ app, onApprove, approving }) {
  const s = getS(app.status);
  const user = app.user || app.owner;
  return (
    <div className="admin_card">
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
          {user?.fullName && (
            <span className="admin_meta_chip">{user.fullName}</span>
          )}
          {user?.name && !user?.fullName && (
            <span className="admin_meta_chip">{user.name}</span>
          )}
          {user?.email && <span className="admin_meta_chip">{user.email}</span>}
          {app.type && <span className="admin_meta_chip">{app.type}</span>}
          {app.numberOfCarts && (
            <span className="admin_meta_chip">
              {app.numberOfCarts} iCart{app.numberOfCarts !== 1 ? "s" : ""}
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
          onClick={() => onApprove(app.id)}
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

export default function AdminApplications({ open, onClose, onApproved }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  // Filters
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [states, setStates] = useState([]);
  const limit = 15;

  // Load states for country/state filter
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
        {/* Status */}
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

        {/* Type */}
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

        {/* State / country */}
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

        {/* Clear filters */}
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
  );
}
