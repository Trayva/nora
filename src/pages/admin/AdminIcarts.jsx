import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdCircle,
  MdExpandMore,
  MdExpandLess,
  MdOutlineShoppingCart,
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

const STATUS_COLORS = {
  PURCHASED: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
  },
  LEASED: {
    bg: "rgba(203,108,220,0.1)",
    color: "var(--accent)",
    border: "rgba(203,108,220,0.25)",
  },
  AVAILABLE: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  INACTIVE: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
};
const getStatus = (s) => STATUS_COLORS[s] || STATUS_COLORS.INACTIVE;

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

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: null },
];

/* ── iCart detail drawer ──────────────────────────────────── */
function IcartDetail({ cart, onClose }) {
  const [detail, setDetail] = useState(null);
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
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
    const ps = [];
    if (from)
      ps.push(`startDate=${encodeURIComponent(from + "T00:00:00.000Z")}`);
    if (to) ps.push(`endDate=${encodeURIComponent(to + "T23:59:59.999Z")}`);
    ps.push(`cartId=${cart.id}`);
    return `?${ps.join("&")}`;
  };

  const fetchAll = () => {
    setLoading(true);
    const q = buildQ();
    Promise.allSettled([
      api.get(`/icart/${cart.id}`),
      api.get(`/icart/sale${q}`),
      api.get(`/icart/sale/analytics${q}`),
    ])
      .then(([dR, sR, aR]) => {
        if (dR.status === "fulfilled") setDetail(dR.value.data.data);
        if (sR.status === "fulfilled") {
          const d = sR.value.data.data;
          setSales(Array.isArray(d) ? d : d?.items || d?.sales || []);
        }
        if (aR.status === "fulfilled") setAnalytics(aR.value.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, [cart.id, from, to]);

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
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0),
    }))
    .filter((m) => m.count > 0);

  const d = detail || cart;

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={d.serialNumber || cart.serialNumber}
      description={`iCart · ${d.status || cart.status}`}
      width={580}
    >
      {/* Status + meta chips */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}
      >
        {(() => {
          const s = getStatus(d.status);
          return (
            <span
              className="admin_status_badge"
              style={{
                background: s.bg,
                color: s.color,
                border: `1px solid ${s.border}`,
              }}
            >
              <MdCircle size={5} />
              {d.status}
            </span>
          );
        })()}
        {d.isOnline != null && (
          <span
            className="admin_meta_chip"
            style={{ color: d.isOnline ? "#16a34a" : "#6b7280" }}
          >
            {d.isOnline ? "Online" : "Offline"}
          </span>
        )}
        {d.isLocked != null && d.isLocked && (
          <span className="admin_meta_chip" style={{ color: "#ef4444" }}>
            Locked
          </span>
        )}
        {d.location?.name && (
          <span className="admin_meta_chip">{d.location.name}</span>
        )}
        {d.serviceRadius && (
          <span className="admin_meta_chip">{d.serviceRadius}km radius</span>
        )}
      </div>

      {/* Operators */}
      {d.operators?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8,
            }}
          >
            Operators ({d.operators.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {d.operators.map((op) => (
              <div
                key={op.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 9,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: "var(--bg-active)",
                    border: "1px solid rgba(203,108,220,0.2)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {(op.user?.fullName || "O").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                    }}
                  >
                    {op.user?.fullName || "Operator"}
                  </div>
                  <div
                    style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}
                  >
                    {op.user?.email}
                  </div>
                </div>
                <span
                  className="admin_meta_chip"
                  style={{ color: op.isApproved ? "#16a34a" : "#ca8a04" }}
                >
                  {op.isApproved ? "Approved" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date filter */}
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
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="icartSalesG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(203,108,220,0.3)" />
                  <stop offset="95%" stopColor="rgba(203,108,220,0)" />
                </linearGradient>
                <linearGradient id="icartProfitG" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#icartSalesG)"
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#icartProfitG)"
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
                  minWidth: 80,
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
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        Transactions{" "}
        <span className="admin_section_count" style={{ marginLeft: 6 }}>
          {sales.length}
        </span>
      </div>
      {sales.length === 0 ? (
        <div className="admin_empty">
          <p style={{ margin: 0, fontSize: "0.8rem" }}>
            No sales in this period.
          </p>
        </div>
      ) : (
        sales.map((sale) => {
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
                marginBottom: 5,
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
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                      fontFamily: "monospace",
                    }}
                  >
                    #{sale.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: "0.6rem",
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
                  style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}
                >
                  {sale.items?.length || 0} items ·{" "}
                  {sale.operator?.fullName ||
                    sale.operator?.user?.fullName ||
                    "Operator"}{" "}
                  · {fmtDate(sale.createdAt)}
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
        })
      )}
    </Drawer>
  );
}

/* ── Main list ────────────────────────────────────────────── */
export default function AdminIcarts() {
  const [carts, setCarts] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serial, setSerial] = useState("");
  const [stateId, setStateId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
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

  const fetchCarts = async (s = serial, sid = stateId, p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (s.trim()) params.serialNumber = s.trim();
      if (sid) params.stateId = sid;
      const r = await api.get("/icart", { params });
      const d = r.data.data;
      const list = Array.isArray(d) ? d : d?.icarts || d?.items || [];
      setCarts(list);
      setTotal(d?.total || list.length);
    } catch {
      toast.error("Failed to load iCarts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  const handleSerial = (val) => {
    setSerial(val);
    setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchCarts(val, stateId, 1), 400);
  };

  const handleState = (val) => {
    setStateId(val);
    setPage(1);
    fetchCarts(serial, val, 1);
  };
  const handlePage = (p) => {
    setPage(p);
    fetchCarts(serial, stateId, p);
  };
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="admin_section">
        <div className="admin_section_header">
          <span className="admin_section_title">iCart Fleet</span>
          <span className="admin_section_count">{total}</span>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
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
              placeholder="Serial number…"
              value={serial}
              onChange={(e) => handleSerial(e.target.value)}
            />
          </div>
          <select
            className="modal-input"
            style={{ marginBottom: 0, minWidth: 160 }}
            value={stateId}
            onChange={(e) => handleState(e.target.value)}
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {loading && (
            <div
              className="page_loader_spinner"
              style={{ width: 16, height: 16, alignSelf: "center" }}
            />
          )}
        </div>

        {/* List */}
        {!loading && carts.length === 0 ? (
          <div className="admin_empty">
            <p style={{ margin: 0, fontSize: "0.82rem" }}>No iCarts found.</p>
          </div>
        ) : (
          <div className="admin_drawer_list">
            {carts.map((c) => {
              const s = getStatus(c.status);
              return (
                <div
                  key={c.id}
                  className="admin_drawer_row"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(c)}
                >
                  <div
                    className="admin_drawer_avatar"
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      color: "#16a34a",
                      border: "1px solid rgba(34,197,94,0.2)",
                      fontFamily: "monospace",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                    }}
                  >
                    <MdOutlineShoppingCart size={16} />
                  </div>
                  <div className="admin_drawer_info">
                    <div
                      className="admin_drawer_name"
                      style={{ fontFamily: "monospace" }}
                    >
                      {c.serialNumber}
                    </div>
                    <div className="admin_drawer_sub">
                      {c.location?.name || c.state?.name || "—"}
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
                      className="admin_status_badge"
                      style={{
                        background: s.bg,
                        color: s.color,
                        border: `1px solid ${s.border}`,
                      }}
                    >
                      <MdCircle size={5} />
                      {c.status}
                    </span>
                    {c.isOnline != null && (
                      <span
                        className="admin_meta_chip"
                        style={{ color: c.isOnline ? "#16a34a" : "#6b7280" }}
                      >
                        {c.isOnline ? "Online" : "Offline"}
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
      </div>

      {selected && (
        <IcartDetail cart={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
