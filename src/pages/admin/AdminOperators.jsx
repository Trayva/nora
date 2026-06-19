import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdCircle,
  MdCheck,
  MdOutlineBadge,
  MdOutlineShoppingCart,
  MdOutlineLocationOn,
  MdExpandMore,
  MdExpandLess,
  MdPointOfSale,
  MdImage,
  MdOutlineDateRange,
} from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";

/* ── helpers ──────────────────────────────────────────────── */
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

const pmColors = {
  CASH: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.2)",
  },
  POS: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.2)",
  },
  TRANSFER: {
    bg: "rgba(168,85,247,0.1)",
    color: "#a855f7",
    border: "rgba(168,85,247,0.2)",
  },
  OTHER: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.2)",
  },
};


/* ── Operator detail drawer ───────────────────────────────── */
function SaleItemTable({ items }) {
  if (!items || items.length === 0) {
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
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Qty</th>
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Price</th>
            <th style={{ textAlign: "right", paddingBottom: 4 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", color: "var(--text)" }}>
              <td style={{ padding: "6px 0", fontWeight: 500 }}>{it.menuItem?.name || "Menu Item"}</td>
              <td style={{ padding: "6px 0", textAlign: "right" }}>{it.quantity}</td>
              <td style={{ padding: "6px 0", textAlign: "right" }}>₦{fmt(it.priceAtTime)}</td>
              <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600 }}>
                ₦{fmt(it.quantity * it.priceAtTime)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OperatorDetail({ operator, onClose, onApprove }) {
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [expandedSales, setExpandedSales] = useState({});

  const [preset, setPreset] = useState("30d");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISO(d);
  });
  const [to, setTo] = useState(() => toISO(new Date()));
  const [showCustom, setShowCustom] = useState(false);

  const u = operator.user || {};
  const st = operator.state || {};

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
    const ps = [`operatorId=${operator.userId}`];
    if (operator.kioskId) ps.push(`kioskId=${operator.kioskId}`);
    if (from)
      ps.push(`startDate=${encodeURIComponent(from + "T00:00:00.000Z")}`);
    if (to) ps.push(`endDate=${encodeURIComponent(to + "T23:59:59.999Z")}`);
    return `?${ps.join("&")}`;
  };

  const fetchData = () => {
    setLoading(true);
    const q = buildQ();
    Promise.allSettled([
      api.get(`/kiosk/sale${q}`),
      api.get(`/kiosk/sale/analytics${q}`),
    ])
      .then(([sR, aR]) => {
        if (sR.status === "fulfilled") {
          const d = sR.value.data.data;
          setSales(Array.isArray(d) ? d : d?.items || d?.sales || []);
        }
        if (aR.status === "fulfilled") setAnalytics(aR.value.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [operator.id, from, to]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.patch(`/kiosk/operator/${operator.id}/approve`, {});
      toast.success("Operator approved");
      onApprove?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setApproving(false);
    }
  };

  const handleUnapprove = async () => {
    setApproving(true);
    try {
      await api.patch(`/kiosk/operator/${operator.id}/unapprove`, {});
      toast.success("Operator unapproved");
      onApprove?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setApproving(false);
    }
  };

  const toggleSaleExpand = (id) => {
    setExpandedSales((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totals = analytics?.totals;
  const chartData = (analytics?.chartData || []).map((d) => ({
    ...d,
    sales: Math.round(d.sales || 0),
    profit: Math.round(d.profit || 0),
  }));

  const pmBreak = ["CASH", "POS", "TRANSFER", "OTHER"]
    .map((m) => ({
      method: m,
      count: sales.filter((s) => s.paymentMethod === m).length,
      total: sales
        .filter((s) => s.paymentMethod === m)
        .reduce((acc, s) => acc + (s.totalAmount || 0), 0),
    }))
    .filter((m) => m.count > 0);

  const statusStyle = operator.isApproved
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
      title={u.fullName || "Operator Details"}
      description={u.email || ""}
      width={560}
    >
      {/* Operator Profile Header Card */}
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
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            background: "rgba(203,108,220,0.1)",
            border: "2px solid rgba(203,108,220,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.3rem",
            fontWeight: 900,
            color: "var(--accent)",
            flexShrink: 0,
          }}
        >
          {(u.fullName || u.name || "O").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              marginBottom: 4,
            }}
          >
            {u.fullName || "Operator"}
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: 4 }}>
            State: {st.name || "No State assigned"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="admin_status_badge" style={{ ...statusStyle, textTransform: "uppercase" }}>
              <MdCircle size={5} />
              {operator.isApproved ? "APPROVED" : "PENDING"}
            </span>
            {operator.kioskId ? (
              <span className="admin_meta_chip" style={{ fontSize: "0.7rem", color: "#16a34a" }}>
                <MdOutlineShoppingCart size={11} /> {operator.kiosk?.serialNumber || "Assigned"}
              </span>
            ) : (
              <span className="admin_meta_chip" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                No Cart Assigned
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div>
          {operator.isApproved ? (
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

      {/* Custom range inputs */}
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

      {loading && (
        <div className="page_loader" style={{ padding: 12 }}>
          <div className="page_loader_spinner" />
        </div>
      )}

      {!loading && (
        <>
          {/* Statistics Grid */}
          {totals && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {[
                { label: "Total Revenue", val: totals.totalSales, accent: true, color: "var(--accent)" },
                { label: "Gross Profit", val: totals.totalProfit, accent: false, color: "#22c55e" },
                { label: "Cost of Sales", val: totals.totalCostOfSales, accent: false, color: "#ef4444" },
                { label: "Expenses", val: totals.totalExpenses, accent: false, color: "#f59e0b" },
                { label: "Owner split", val: totals.ownerProfit, accent: false, color: "var(--text-heading)" },
                { label: "Nora split", val: totals.noraProfit, accent: false, color: "var(--text-heading)" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: 12,
                    background: "var(--bg-card)",
                    border: `1px solid ${s.accent ? "rgba(203,108,220,0.25)" : "var(--border)"}`,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 4 }}>{s.label}</div>
                  <div
                    style={{
                      fontSize: "1.02rem",
                      fontWeight: 800,
                      color: s.accent ? "var(--accent)" : "var(--text-heading)",
                    }}
                  >
                    ₦{fmt(s.val)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recharts Area Chart */}
          {chartData.length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 10 }}>
                Revenue & Profit Trend
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="opSalesG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgba(203,108,220,0.3)" />
                      <stop offset="95%" stopColor="rgba(203,108,220,0)" />
                    </linearGradient>
                    <linearGradient id="opProfitG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgba(34,197,94,0.25)" />
                      <stop offset="95%" stopColor="rgba(34,197,94,0)" />
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
                    formatter={(v, n) => [`₦${fmt(v)}`, n === "sales" ? "Revenue" : "Profit"]}
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
                    dataKey="sales"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#opSalesG)"
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#opProfitG)"
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Payment Method breakdown */}
          {pmBreak.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              {pmBreak.map(({ method, count, total }) => {
                const c = pmColors[method] || pmColors.OTHER;
                return (
                  <div
                    key={method}
                    style={{
                      flex: 1,
                      minWidth: 90,
                      padding: "8px 10px",
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      borderRadius: 9,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        color: c.color,
                        textTransform: "uppercase",
                        marginBottom: 3,
                      }}
                    >
                      {method}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 900,
                        color: "var(--text-heading)",
                      }}
                    >
                      {count} <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>tx</span>
                    </div>
                    <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", marginTop: 2 }}>
                      ₦{fmt(total)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Transactions list */}
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
                Recent Transactions
              </span>
              <span className="admin_section_count">{sales.length}</span>
            </div>

            {sales.length === 0 ? (
              <div className="admin_empty">
                <p style={{ margin: 0, fontSize: "0.8rem" }}>No transactions in this period.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sales.map((sale) => {
                  const isExpanded = !!expandedSales[sale.id];
                  const pm = pmColors[sale.paymentMethod] || pmColors.OTHER;
                  return (
                    <div
                      key={sale.id}
                      style={{
                        padding: 12,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                      onClick={() => toggleSaleExpand(sale.id)}
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
                            <span
                              style={{
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                color: "var(--text-heading)",
                                fontFamily: "monospace",
                              }}
                            >
                              #{sale.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: "0.58rem",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: 999,
                                background: pm.bg,
                                color: pm.color,
                                border: `1px solid ${pm.border}`,
                              }}
                            >
                              {sale.paymentMethod}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {fmtDate(sale.createdAt)} · {sale.items?.length || 0} items
                            {sale.kiosk?.serialNumber ? ` · ${sale.kiosk.serialNumber}` : ""}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "var(--text-heading)" }}>
                            ₦{fmt(sale.totalAmount)}
                          </span>
                          {isExpanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <SaleItemTable items={sale.items} />
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

/* ── Main operators list ──────────────────────────────────── */
export default function AdminOperators({ open, onClose }) {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [approvedFilter, setApprovedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [states, setStates] = useState([]);
  const [selected, setSelected] = useState(null);
  const limit = 20;
  const searchTimer = useRef(null);

  useEffect(() => {
    api
      .get("/config/state")
      .then((r) => {
        const d = r.data.data;
        setStates(Array.isArray(d) ? d : d?.states || d?.items || []);
      })
      .catch(() => { });
  }, []);

  const fetchOps = async (
    s = search,
    sid = stateFilter,
    ap = approvedFilter,
    p = page,
  ) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (s.trim()) params.search = s.trim();
      if (sid) params.stateId = sid;
      if (ap !== "") params.isApproved = ap;
      const r = await api.get("/kiosk/operator", { params });
      const d = r.data.data;
      const list = Array.isArray(d) ? d : d?.operators || d?.items || [];
      setOperators(list);
      setTotal(d?.total || list.length);
    } catch {
      toast.error("Failed to load operators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchOps();
  }, [open]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => fetchOps(val, stateFilter, approvedFilter, 1),
      400,
    );
  };

  const handleState = (val) => {
    setStateFilter(val);
    setPage(1);
    fetchOps(search, val, approvedFilter, 1);
  };
  const handleApproved = (val) => {
    setApprovedFilter(val);
    setPage(1);
    fetchOps(search, stateFilter, val, 1);
  };
  const handlePage = (p) => {
    setPage(p);
    fetchOps(search, stateFilter, approvedFilter, p);
  };
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pendingCount = operators.filter((o) => !o.isApproved).length;

  return (
    <>
      <Drawer
        isOpen={open}
        onClose={onClose}
        title="Operators"
        description="All Kiosk operators on the platform"
        width={540}
      >
        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <div style={{ position: "relative", flex: 2, minWidth: 140 }}>
            <MdSearch
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              className="modal-input"
              style={{ paddingLeft: 30, marginBottom: 0 }}
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <select
            className="modal-input"
            style={{ marginBottom: 0, flex: 1, minWidth: 120 }}
            value={stateFilter}
            onChange={(e) => handleState(e.target.value)}
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="modal-input"
            style={{ marginBottom: 0, minWidth: 110 }}
            value={approvedFilter}
            onChange={(e) => handleApproved(e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
        </div>

        {/* Count */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <span className="admin_section_count">{total} total</span>
          {pendingCount > 0 && (
            <span
              className="admin_section_count"
              style={{
                background: "rgba(234,179,8,0.1)",
                color: "#ca8a04",
                border: "1px solid rgba(234,179,8,0.25)",
              }}
            >
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* List */}
        {!loading && operators.length === 0 ? (
          <div className="admin_empty">
            <p style={{ margin: 0, fontSize: "0.82rem" }}>
              No operators found.
            </p>
          </div>
        ) : (
          <div className="admin_drawer_list">
            {operators.map((op) => {
              const u = op.user || {};
              const st = op.state || {};
              return (
                <div
                  key={op.id}
                  className="admin_drawer_row"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(op)}
                >
                  <div
                    className="admin_drawer_avatar"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      color: "#f59e0b",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    {u.image ? <img className="img-profile" src={u.image} alt="" /> : (u.fullName || "O").charAt(0).toUpperCase()}
                  </div>
                  <div className="admin_drawer_info">
                    <div className="admin_drawer_name">
                      {u.fullName || "Operator"}
                    </div>
                    <div className="admin_drawer_sub">
                      {u.email}
                      {st.name ? ` · ${st.name}` : ""}
                      {op.kioskId ? " · Assigned" : " · Unassigned"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        padding: "1px 7px",
                        borderRadius: 999,
                        textTransform: "uppercase",
                        ...(op.isApproved
                          ? {
                            background: "rgba(34,197,94,0.1)",
                            color: "#16a34a",
                            border: "1px solid rgba(34,197,94,0.25)",
                          }
                          : {
                            background: "rgba(234,179,8,0.1)",
                            color: "#ca8a04",
                            border: "1px solid rgba(234,179,8,0.25)",
                          }),
                      }}
                    >
                      {op.isApproved ? "APPROVED" : "PENDING"}
                    </span>
                    {op.kioskId && (
                      <span
                        className="admin_meta_chip"
                        style={{ color: "#16a34a" }}
                      >
                        <MdOutlineShoppingCart size={10} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* Operator detail — closes list drawer first */}
      {selected && (
        <OperatorDetail
          operator={selected}
          onClose={() => setSelected(null)}
          onApprove={() => {
            setSelected(null);
            fetchOps();
          }}
        />
      )}
    </>
  );
}
