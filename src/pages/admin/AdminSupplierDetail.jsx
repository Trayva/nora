import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdCircle,
  MdCheck,
  MdExpandMore,
  MdExpandLess,
  MdOutlineLocalShipping,
  MdOutlineDateRange,
  MdClose,
} from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";

/* ── Helpers ──────────────────────────────────────────────── */
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

const fmtChart = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
    : "";

const toISO = (d) => d.toISOString().split("T")[0];

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: null },
];

/* ── Supply Request Item Component ────────────────────────── */
function SupplyItemTable({ items, machineryItems }) {
  const ingItems = (items || []).map((it) => ({
    id: it.id,
    name: it.ingredient?.name || "Ingredient",
    qty: it.quantity,
    supplied: it.suppliedQuantity,
    price: it.priceAtTime,
    unit: it.ingredient?.unit || "pcs",
  }));

  const machItems = (machineryItems || []).map((it) => ({
    id: it.id,
    name: it.machinery?.name || "Machinery",
    qty: it.quantity,
    supplied: it.suppliedQuantity,
    price: it.priceAtTime,
    unit: "pcs",
  }));

  const all = [...ingItems, ...machItems];

  if (all.length === 0) {
    return <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: 8 }}>No items listed.</div>;
  }

  return (
    <div
      style={{
        marginTop: 6,
        padding: "8px 10px",
        background: "var(--bg-active)",
        borderRadius: 8,
        border: "1px solid var(--border)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600 }}>
            <th style={{ textAlign: "left", paddingBottom: 4 }}>Item</th>
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Req Qty</th>
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Del Qty</th>
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Price</th>
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {all.map((it) => (
            <tr key={it.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", color: "var(--text)" }}>
              <td style={{ padding: "6px 0", fontWeight: 500 }}>{it.name}</td>
              <td style={{ padding: "6px 0", textAlign: "right" }}>{it.qty} {it.unit}</td>
              <td style={{ padding: "6px 0", textAlign: "right" }}>
                {it.supplied !== null ? `${it.supplied} ${it.unit}` : "—"}
              </td>
              <td style={{ padding: "6px 0", textAlign: "right" }}>₦{fmt(it.price)}</td>
              <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600 }}>
                ₦{fmt((it.supplied !== null ? it.supplied : it.qty) * it.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main Supplier Detail Component ──────────────────────── */
export default function AdminSupplierDetail({ supplier, onClose, onStatusChange }) {
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [expandedRequests, setExpandedRequests] = useState({});

  const [preset, setPreset] = useState("30d");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISO(d);
  });
  const [to, setTo] = useState(() => toISO(new Date()));
  const [showCustom, setShowCustom] = useState(false);

  const applyPreset = (p) => {
    setPreset(p.label);
    if (p.days === null) {
      setFrom("");
      setTo("");
      setShowCustom(false);
    } else {
      const end = new Date(),
        start = new Date();
      start.setDate(start.getDate() - p.days);
      setFrom(toISO(start));
      setTo(toISO(end));
      setShowCustom(false);
    }
  };

  const buildQ = () => {
    const ps = [`supplierId=${supplier.id}`];
    if (from) ps.push(`startDate=${encodeURIComponent(from + "T00:00:00.000Z")}`);
    if (to) ps.push(`endDate=${encodeURIComponent(to + "T23:59:59.999Z")}`);
    return `?${ps.join("&")}`;
  };

  const fetchData = () => {
    setLoading(true);
    const q = buildQ();
    Promise.allSettled([
      api.get(`/supplier/${supplier.id}/analytics${q}`),
      api.get(`/kiosk/supply${q}`),
    ])
      .then(([aR, sR]) => {
        if (aR.status === "fulfilled") {
          setAnalytics(aR.value.data.data);
        }
        if (sR.status === "fulfilled") {
          const d = sR.value.data.data;
          setRequests(Array.isArray(d) ? d : d?.requests || d?.items || []);
        }
      })
      .catch((err) => {
        toast.error("Failed to load supplier statistics");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [supplier.id, from, to]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.patch(`/supplier/${supplier.id}/approve`, {});
      toast.success("Supplier approved");
      onStatusChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve supplier");
    } finally {
      setApproving(false);
    }
  };

  const handleUnapprove = async () => {
    setApproving(true);
    try {
      await api.patch(`/supplier/${supplier.id}/unapprove`, {});
      toast.success("Supplier unapproved");
      onStatusChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unapprove supplier");
    } finally {
      setApproving(false);
    }
  };

  const toggleRequestExpand = (id) => {
    setExpandedRequests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const stats = analytics?.stats || {};
  const chartData = (analytics?.chartData || []).map((d) => ({
    ...d,
    amount: Math.round(d.amount || 0),
  }));

  const branding = supplier.branding || {};
  const isApproved = supplier.isApproved;

  const statusStyle = isApproved
    ? {
        background: "rgba(34,197,94,0.1)",
        color: "#16a34a",
        border: "1px solid rgba(34,197,94,0.25)",
      }
    : {
        background: "rgba(234,179,8,0.1)",
        color: "#ca8a04",
        border: "1px solid rgba(234,179,8,0.25)",
      };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={supplier.businessName || "Supplier Details"}
      description={supplier.email}
      width={540}
    >
      {/* Supplier Profile Info Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
          padding: "14px 16px",
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}
      >
        {branding.logo ? (
          <img
            src={branding.logo}
            alt=""
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              background: branding.color ? `${branding.color}22` : "var(--bg-active)",
              border: `2px solid ${branding.color || "var(--border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
              fontWeight: 900,
              color: branding.color || "var(--accent)",
              flexShrink: 0,
            }}
          >
            {(supplier.businessName || "S").charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              marginBottom: 4,
            }}
          >
            {supplier.businessName}
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: 4 }}>
            State: {supplier.state?.name || "No State assigned"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="admin_status_badge" style={statusStyle}>
              <MdCircle size={5} />
              {isApproved ? "APPROVED" : "PENDING"}
            </span>
            {supplier.membershipExpiry && (
              <span className="admin_meta_chip" style={{ fontSize: "0.7rem" }}>
                Expires: {fmtDate(supplier.membershipExpiry)}
              </span>
            )}
          </div>
        </div>

        {/* Approve/Unapprove Toggle Button */}
        <div>
          {isApproved ? (
            <button
              className={`app_btn app_btn_cancel${approving ? " btn_loading" : ""}`}
              style={{ height: 32, padding: "0 12px", fontSize: "0.78rem", position: "relative" }}
              onClick={handleUnapprove}
              disabled={approving}
            >
              <span className="btn_text">Unapprove</span>
              {approving && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
            </button>
          ) : (
            <button
              className={`app_btn app_btn_confirm${approving ? " btn_loading" : ""}`}
              style={{ height: 32, padding: "0 12px", fontSize: "0.78rem", position: "relative" }}
              onClick={handleApprove}
              disabled={approving}
            >
              <span className="btn_text">
                <MdCheck size={12} /> Approve
              </span>
              {approving && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
            </button>
          )}
        </div>
      </div>

      {/* Date Filter presets */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: 6,
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className={`app_btn`}
              style={{
                height: 28,
                padding: "0 12px",
                fontSize: "0.75rem",
                borderRadius: 6,
                background: preset === p.label ? "var(--bg-card)" : "transparent",
                color: preset === p.label ? "var(--text-heading)" : "var(--text-muted)",
                border: "none",
                fontWeight: preset === p.label ? 700 : 500,
                boxShadow: preset === p.label ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
          <button
            className={`app_btn`}
            style={{
              height: 28,
              padding: "0 12px",
              fontSize: "0.75rem",
              borderRadius: 6,
              background: showCustom ? "var(--bg-card)" : "transparent",
              color: showCustom ? "var(--text-heading)" : "var(--text-muted)",
              border: "none",
              fontWeight: showCustom ? 700 : 500,
            }}
            onClick={() => {
              setShowCustom(true);
              setPreset("");
            }}
          >
            Custom
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", color: "var(--text-muted)", fontSize: "0.7rem", gap: 4 }}>
          <MdOutlineDateRange size={14} />
          {from ? fmtDate(from) : "Start"} – {to ? fmtDate(to) : "End"}
        </div>
      </div>

      {/* Custom range input controls */}
      {showCustom && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 16,
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 10,
          }}
        >
          <div>
            <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              From Date
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="modal-input"
              style={{ height: 32, fontSize: "0.78rem" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              To Date
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="modal-input"
              style={{ height: 32, fontSize: "0.78rem" }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : (
        <>
          {/* Statistics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div className="stat_card_small" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>Total Requests</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-heading)" }}>
                {stats.totalRequests || 0}
              </div>
            </div>
            <div className="stat_card_small" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>Delivered / Received</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#16a34a" }}>
                {stats.receivedRequests || 0} <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>/ {stats.totalRequests || 0}</span>
              </div>
            </div>
            <div className="stat_card_small" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>Earned Revenue</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-heading)" }}>
                ₦{fmt(stats.receivedAmount || 0)}
              </div>
            </div>
            <div className="stat_card_small" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>Logistics Costs</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-heading)" }}>
                ₦{fmt(stats.totalLogistics || 0)}
              </div>
            </div>
          </div>

          {/* Area Chart visualising Supply amount */}
          {chartData.length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 10 }}>
                Earned Revenue Trend
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="supSalesG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgba(139, 92, 246, 0.3)" />
                      <stop offset="95%" stopColor="rgba(139, 92, 246, 0)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtChart}
                    tick={{ fontSize: 9, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    width={38}
                  />
                  <Tooltip
                    formatter={(v) => [`₦${fmt(v)}`, "Revenue"]}
                    labelFormatter={fmtChart}
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: "0.72rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#supSalesG)"
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Supply Requests list */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "var(--text-heading)",
                }}
              >
                Recent Supplies
              </span>
              <span className="admin_section_count">{requests.length}</span>
            </div>

            {requests.length === 0 ? (
              <div className="admin_empty">
                <p style={{ margin: 0, fontSize: "0.8rem" }}>No supply requests found for this filter.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requests.map((req) => {
                  const isExpanded = !!expandedRequests[req.id];
                  const itemsCount = (req.items?.length || 0) + (req.supplyRequestMachineryItems?.length || 0);
                  const statusColors = {
                    PENDING: { bg: "rgba(234,179,8,0.1)", text: "#ca8a04", border: "rgba(234,179,8,0.2)" },
                    SUPPLIER_REVIEWED: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6", border: "rgba(59,130,246,0.2)" },
                    SHIPPED: { bg: "rgba(168,85,247,0.1)", text: "#a855f7", border: "rgba(168,85,247,0.2)" },
                    RECEIVED: { bg: "rgba(34,197,94,0.1)", text: "#16a34a", border: "rgba(34,197,94,0.2)" },
                    CANCELLED: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
                  };

                  const currentColors = statusColors[req.status] || {
                    bg: "rgba(107,114,128,0.1)",
                    text: "#6b7280",
                    border: "rgba(107,114,128,0.2)",
                  };

                  return (
                    <div
                      key={req.id}
                      style={{
                        padding: 12,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                      onClick={() => toggleRequestExpand(req.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-heading)" }}>
                              Kiosk {req.kiosk?.serialNumber || req.kioskId.slice(0, 8)}
                            </span>
                            <span
                              style={{
                                fontSize: "0.64rem",
                                padding: "2px 6px",
                                borderRadius: 4,
                                fontWeight: 600,
                                background: currentColors.bg,
                                color: currentColors.text,
                                border: `1px solid ${currentColors.border}`,
                              }}
                            >
                              {req.status}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {fmtDate(req.createdAt)} · {itemsCount} items
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-heading)" }}>
                            ₦{fmt(req.totalAmount)}
                          </span>
                          {isExpanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <SupplyItemTable items={req.items} machineryItems={req.supplyRequestMachineryItems} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}
