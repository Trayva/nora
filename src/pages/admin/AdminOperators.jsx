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
function OperatorDetail({ operator, onClose, onApprove }) {
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

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

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={u.fullName || "Operator"}
      description={u.email || ""}
      width={560}
    >
      {/* Status + meta */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}
      >
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 800,
            padding: "2px 9px",
            borderRadius: 999,
            ...(operator.isApproved
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
            textTransform: "uppercase",
          }}
        >
          {operator.isApproved ? "APPROVED" : "PENDING"}
        </span>
        {st.name && (
          <span className="admin_meta_chip">
            <MdOutlineLocationOn size={11} /> {st.name}
            {st.country ? `, ${st.country}` : ""}
          </span>
        )}
        {operator.kioskId ? (
          <span className="admin_meta_chip" style={{ color: "#16a34a" }}>
            <MdOutlineShoppingCart size={11} /> Assigned to cart
          </span>
        ) : (
          <span className="admin_meta_chip" style={{ color: "#6b7280" }}>
            No cart assigned
          </span>
        )}
        {u.phone && <span className="admin_meta_chip">{u.phone}</span>}
        {!operator.isApproved && (
          <button
            className={`app_btn app_btn_confirm${approving ? " btn_loading" : ""}`}
            style={{
              height: 28,
              padding: "0 12px",
              fontSize: "0.72rem",
              position: "relative",
              marginLeft: "auto",
            }}
            onClick={handleApprove}
            disabled={approving}
          >
            <span className="btn_text">
              <MdCheck size={12} /> Approve
            </span>
            {approving && (
              <span className="btn_loader" style={{ width: 11, height: 11 }} />
            )}
          </button>
        )}
      </div>

      {/* Current cart info */}
      {operator.kioskId && (
        <div
          style={{
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 11,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MdOutlineShoppingCart size={16} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--text-heading)",
              }}
            >
              Currently Assigned
            </div>
            <div
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                fontFamily: "monospace",
              }}
            >
              {operator.kioskId}
            </div>
          </div>
        </div>
      )}

      {/* Date presets */}
      <div
        style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}
      >
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            style={{
              height: 30,
              padding: "0 11px",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: "0.72rem",
              background:
                preset === p.label ? "var(--bg-active)" : "var(--bg-hover)",
              color: preset === p.label ? "var(--accent)" : "var(--text-muted)",
              border: `1px solid ${preset === p.label ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => {
            setPreset("custom");
            setShowCustom((v) => !v);
          }}
          style={{
            height: 30,
            padding: "0 11px",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: "0.72rem",
            background:
              preset === "custom" ? "var(--bg-active)" : "var(--bg-hover)",
            color: preset === "custom" ? "var(--accent)" : "var(--text-muted)",
            border: `1px solid ${preset === "custom" ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
          }}
        >
          Custom
        </button>
        {loading && (
          <div
            className="page_loader_spinner"
            style={{ width: 14, height: 14, alignSelf: "center" }}
          />
        )}
      </div>
      {showCustom && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div className="form-field" style={{ marginBottom: 0, flex: 1 }}>
            <label className="modal-label">From</label>
            <input
              className="modal-input"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPreset("custom");
              }}
            />
          </div>
          <div className="form-field" style={{ marginBottom: 0, flex: 1 }}>
            <label className="modal-label">To</label>
            <input
              className="modal-input"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPreset("custom");
              }}
            />
          </div>
        </div>
      )}

      {/* Summary cards */}
      {totals && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {[
            { l: "Revenue", v: totals.totalSales, accent: true },
            { l: "Profit", v: totals.totalProfit, accent: false },
            { l: "Cost", v: totals.totalCostOfSales, accent: false },
            { l: "Expenses", v: totals.totalExpenses, accent: false },
            { l: "Owner", v: totals.ownerProfit, accent: false },
            { l: "Nora", v: totals.noraProfit, accent: false },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                padding: "10px 12px",
                background: s.accent ? "var(--bg-active)" : "var(--bg-hover)",
                border: `1px solid ${s.accent ? "rgba(203,108,220,0.2)" : "var(--border)"}`,
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 3,
                }}
              >
                {s.l}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 900,
                  color: s.accent ? "var(--accent)" : "var(--text-heading)",
                }}
              >
                ₦{fmt(s.v)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
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
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
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
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
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
                tickFormatter={(v) =>
                  `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                }
                width={38}
              />
              <Tooltip
                formatter={(v, n) => [
                  `₦${fmt(v)}`,
                  n === "sales" ? "Revenue" : "Profit",
                ]}
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

      {/* Payment breakdown */}
      {pmBreak.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
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
                  minWidth: 70,
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
                    fontSize: "0.82rem",
                    fontWeight: 900,
                    color: "var(--text-heading)",
                  }}
                >
                  {count}
                </div>
                <div
                  style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}
                >
                  ₦{fmt(total)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sales list */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Transactions
        </span>
        <span className="admin_section_count">{sales.length}</span>
      </div>

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : sales.length === 0 ? (
        <div className="admin_empty">
          <p style={{ margin: 0, fontSize: "0.8rem" }}>
            No transactions in this period.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {sales.map((sale) => {
            const pm = pmColors[sale.paymentMethod] || pmColors.OTHER;
            return (
              <div
                key={sale.id}
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                        fontFamily: "monospace",
                      }}
                    >
                      #{sale.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: "0.58rem",
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: 999,
                        background: pm.bg,
                        color: pm.color,
                        border: `1px solid ${pm.border}`,
                      }}
                    >
                      {sale.paymentMethod}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: "0.64rem", color: "var(--text-muted)" }}
                  >
                    {sale.items?.length || 0} items
                    {sale.cart?.serialNumber
                      ? ` · ${sale.cart.serialNumber}`
                      : ""}
                    {" · "}
                    {fmtDate(sale.createdAt)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 900,
                    color: "var(--text-heading)",
                    flexShrink: 0,
                  }}
                >
                  ₦{fmt(sale.totalAmount)}
                </div>
              </div>
            );
          })}
        </div>
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
      .catch(() => {});
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
                    {(u.fullName || "O").charAt(0).toUpperCase()}
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
