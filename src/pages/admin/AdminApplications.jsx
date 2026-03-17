import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdOutlineFactCheck,
  MdCheckCircle,
  MdExpandMore,
  MdExpandLess,
  MdCircle,
  MdSearch,
} from "react-icons/md";
import api from "../../api/axios";

const STATUS_COLORS = {
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
  ACTIVE: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
  },
  REJECTED: {
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

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.SUBMITTED;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: "0.62rem",
        fontWeight: 800,
        padding: "3px 9px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        flexShrink: 0,
      }}
    >
      <MdCircle size={5} />
      {status}
    </span>
  );
}

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function ApplicationCard({ app, onApprove, approving }) {
  const [expanded, setExpanded] = useState(false);
  const canApprove = app.status === "SUBMITTED";
  const user = app.user || app.owner;

  return (
    <div className="admin_card" style={{ flexDirection: "column", gap: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          width: "100%",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "var(--bg-active)",
            border: "1px solid rgba(203,108,220,0.2)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MdOutlineFactCheck size={17} />
        </div>

        <div className="admin_card_body">
          {/* Row 1 */}
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
                fontSize: "0.85rem",
                fontWeight: 800,
                color: "var(--text-heading)",
                fontFamily: "monospace",
              }}
            >
              #{app.id.slice(0, 8).toUpperCase()}
            </span>
            <StatusBadge status={app.status} />
          </div>
          {/* Row 2 — meta */}
          <div className="admin_card_meta">
            {user?.name && <span className="admin_meta_chip">{user.name}</span>}
            {user?.email && (
              <span className="admin_meta_chip">{user.email}</span>
            )}
            {app.type && <span className="admin_meta_chip">{app.type}</span>}
            {app.numberOfCarts && (
              <span className="admin_meta_chip">
                {app.numberOfCarts} iCart{app.numberOfCarts !== 1 ? "s" : ""}
              </span>
            )}
            <span className="admin_meta_chip">{fmtDate(app.createdAt)}</span>
          </div>
        </div>

        <div className="admin_card_actions">
          <button
            className="biz_icon_btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
          </button>
          {canApprove && (
            <button
              className={`app_btn app_btn_confirm${approving === app.id ? " btn_loading" : ""}`}
              style={{
                height: 32,
                padding: "0 14px",
                fontSize: "0.75rem",
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              onClick={() => onApprove(app.id)}
              disabled={!!approving}
            >
              <span className="btn_text">
                <MdCheckCircle size={13} /> Approve
              </span>
              {approving === app.id && (
                <span
                  className="btn_loader"
                  style={{ width: 12, height: 12 }}
                />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 7,
            }}
          >
            {[
              { label: "Application ID", value: app.id },
              { label: "Type", value: app.type },
              { label: "Status", value: app.status },
              { label: "# of Carts", value: app.numberOfCarts },
              { label: "Submitted", value: fmtDate(app.createdAt) },
              { label: "Updated", value: fmtDate(app.updatedAt) },
              ...(app.settings?.state?.name
                ? [
                    {
                      label: "State",
                      value: `${app.settings.state.name}${app.settings.state.country ? `, ${app.settings.state.country}` : ""}`,
                    },
                  ]
                : []),
              ...(app.settings?.currency
                ? [{ label: "Currency", value: app.settings.currency }]
                : []),
            ]
              .filter((r) => r.value != null)
              .map((r) => (
                <div
                  key={r.label}
                  style={{
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "7px 10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 2,
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.value}
                  </div>
                </div>
              ))}
          </div>

          {/* Invoices */}
          {app.invoiceDetails?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                Invoices
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {app.invoiceDetails.map((inv) => {
                  const is =
                    STATUS_COLORS[inv.status] || STATUS_COLORS.SUBMITTED;
                  return (
                    <div
                      key={inv.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "7px 11px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "var(--text-body)",
                        }}
                      >
                        Invoice #{inv.id.slice(0, 8).toUpperCase()}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            color: "var(--text-heading)",
                          }}
                        >
                          ₦{Number(inv.total || 0).toLocaleString()}
                        </span>
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: is.bg,
                            color: is.color,
                            border: `1px solid ${is.border}`,
                            textTransform: "uppercase",
                          }}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
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

export default function AdminApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await api.get("/contract/application/all");
      const d = r.data.data;
      setApps(Array.isArray(d) ? d : d?.items || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await api.post(`/contract/application/${id}/approve`);
      toast.success("Application approved");
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
    } finally {
      setApproving(null);
    }
  };

  const statuses = ["ALL", ...Object.keys(STATUS_COLORS)];
  const pendingCount = apps.filter((a) => a.status === "SUBMITTED").length;

  const filtered = apps.filter((a) => {
    const matchStatus = filter === "ALL" || a.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.id.toLowerCase().includes(q) ||
      a.user?.name?.toLowerCase().includes(q) ||
      a.user?.email?.toLowerCase().includes(q) ||
      a.owner?.name?.toLowerCase().includes(q) ||
      a.owner?.email?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="admin_page">
      <div className="admin_page_header">
        <div>
          <h2 className="admin_page_title">Contract Applications</h2>
          <p className="admin_page_sub">
            Review and approve iCart contract applications from users.
          </p>
        </div>
        {pendingCount > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 13px",
              background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.25)",
              borderRadius: 999,
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "#ca8a04",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#ca8a04",
              }}
            />
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Search + filter */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 200,
            height: 38,
            padding: "0 12px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
          }}
        >
          <MdSearch
            size={15}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
          <input
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "0.82rem",
              color: "var(--text-body)",
              fontFamily: "inherit",
            }}
            placeholder="Search by ID, name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {statuses.map((s) => {
            const count =
              s === "ALL"
                ? apps.length
                : apps.filter((a) => a.status === s).length;
            if (s !== "ALL" && count === 0) return null;
            const sc = s !== "ALL" ? STATUS_COLORS[s] : null;
            return (
              <button
                key={s}
                className={`icart_sub_nav_btn ${filter === s ? "icart_sub_nav_active" : ""}`}
                style={
                  filter === s && sc
                    ? {
                        color: sc.color,
                        borderColor: sc.border,
                        background: sc.bg,
                      }
                    : {}
                }
                onClick={() => setFilter(s)}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                {count > 0 && (
                  <span
                    style={{
                      marginLeft: 5,
                      fontSize: "0.61rem",
                      fontWeight: 800,
                      opacity: 0.8,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin_empty">
          <MdOutlineFactCheck size={28} style={{ opacity: 0.3 }} />
          <p className="admin_empty_title">
            {apps.length === 0
              ? "No applications yet"
              : "No matching applications"}
          </p>
          <p className="admin_empty_sub">
            {apps.length === 0
              ? "Contract applications from users will appear here."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="admin_card_list">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={handleApprove}
              approving={approving}
            />
          ))}
        </div>
      )}
    </div>
  );
}
