import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  MdPointOfSale,
  MdTrendingUp,
  MdCalendarToday,
  MdFilterList,
  MdImage,
  MdClose,
} from "react-icons/md";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
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

const fmtChartDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
    : "";

const toISODate = (d) => d.toISOString().split("T")[0];

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
  { label: "1y", days: 365 },
  { label: "All", days: null },
];

/* ── Sub-components ───────────────────────────────────────── */
function PaymentBadge({ method }) {
  const c = pmColors[method] || pmColors.OTHER;
  return (
    <span
      style={{
        fontSize: "0.62rem",
        fontWeight: 800,
        padding: "2px 8px",
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        flexShrink: 0,
      }}
    >
      {method}
    </span>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          marginBottom: 6,
        }}
      >
        {fmtChartDate(label)}
      </div>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: p.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            {p.dataKey === "sales" ? "Revenue" : "Profit"}
          </span>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              marginLeft: "auto",
              paddingLeft: 12,
            }}
          >
            ₦{fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SaleRow({ sale }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 14px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--bg-active)",
            border: "1px solid rgba(203,108,220,0.2)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MdPointOfSale size={13} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 2,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--text-body)",
                fontFamily: "monospace",
              }}
            >
              #{sale.id.slice(0, 8).toUpperCase()}
            </span>
            <PaymentBadge method={sale.paymentMethod} />
            {sale.cart?.serialNumber && (
              <span
                style={{
                  fontSize: "0.64rem",
                  fontWeight: 700,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                {sale.cart.serialNumber}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              flexWrap: "wrap",
            }}
          >
            <span>
              {sale.items?.length || 0} item
              {sale.items?.length !== 1 ? "s" : ""}
            </span>
            <span>·</span>
            <span>
              {sale.operator?.fullName ||
                sale.operator?.user?.fullName ||
                "Operator"}
            </span>
            <span>·</span>
            <span>{fmtDate(sale.createdAt)}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 900,
              color: "var(--text-heading)",
            }}
          >
            ₦{fmt(sale.totalAmount)}
          </div>
        </div>
        {expanded ? (
          <MdExpandLess
            size={15}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        ) : (
          <MdExpandMore
            size={15}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        )}
      </div>

      {expanded && sale.items?.length > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--bg-hover)",
          }}
        >
          {sale.items.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                borderBottom:
                  idx < sale.items.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              {item.menuItem?.image ? (
                <img
                  src={item.menuItem.image}
                  alt=""
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 5,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 5,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdImage size={12} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                  }}
                >
                  {item.menuItem?.name || "Item"}
                </div>
                <div
                  style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                >
                  qty: {item.quantity}
                </div>
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--text-heading)",
                  flexShrink: 0,
                }}
              >
                ₦{fmt(item.priceAtTime)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function AdminSalesAnalytics() {
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [icarts, setIcarts] = useState([]);

  // Filters
  const [preset, setPreset] = useState("30d");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISODate(d);
  });
  const [to, setTo] = useState(() => toISODate(new Date()));
  const [showCustom, setShowCustom] = useState(false);
  const [selectedCart, setSelectedCart] = useState(""); // icart id filter
  const [paymentFilter, setPaymentFilter] = useState("ALL"); // payment method filter

  // Fetch all icarts for the filter dropdown
  useEffect(() => {
    api
      .get("/icart")
      .then((r) => {
        const d = r.data.data;
        const list = Array.isArray(d) ? d : d?.items || d?.icarts || [];
        setIcarts(list);
      })
      .catch(() => {});
  }, []);

  const applyPreset = (p) => {
    setPreset(p.label);
    if (p.days === null) {
      setFrom("");
      setTo("");
      setShowCustom(false);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - p.days);
      setFrom(toISODate(start));
      setTo(toISODate(end));
      setShowCustom(false);
    }
  };

  const buildQuery = () => {
    const params = [];
    if (from)
      params.push(`startDate=${encodeURIComponent(from + "T00:00:00.000Z")}`);
    if (to) params.push(`endDate=${encodeURIComponent(to + "T23:59:59.999Z")}`);
    if (selectedCart) params.push(`cartId=${selectedCart}`);
    return params.length ? `?${params.join("&")}` : "";
  };

  const fetchData = () => {
    setLoading(true);
    const q = buildQuery();
    Promise.allSettled([
      api.get(`/icart/sale${q}`),
      api.get(`/icart/sale/analytics${q}`),
    ])
      .then(([salesRes, analyticsRes]) => {
        if (salesRes.status === "fulfilled") {
          const d = salesRes.value.data.data;
          const all = Array.isArray(d) ? d : d?.items || d?.sales || [];
          setSales(all);
        } else {
          toast.error("Failed to load sales");
        }
        if (analyticsRes.status === "fulfilled") {
          setAnalytics(analyticsRes.value.data.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [from, to, selectedCart]);

  // Client-side payment method filter
  const filteredSales =
    paymentFilter === "ALL"
      ? sales
      : sales.filter((s) => s.paymentMethod === paymentFilter);

  const totals = analytics?.totals;
  const chartData = (analytics?.chartData || []).map((d) => ({
    ...d,
    sales: Math.round(d.sales || 0),
    profit: Math.round(d.profit || 0),
  }));

  const pmBreakdown = ["CASH", "POS", "TRANSFER", "OTHER"]
    .map((m) => ({
      method: m,
      count: sales.filter((s) => s.paymentMethod === m).length,
      total: sales
        .filter((s) => s.paymentMethod === m)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0),
    }))
    .filter((m) => m.count > 0);

  // Top carts by revenue
  const cartBreakdown = Object.values(
    sales.reduce((acc, s) => {
      const cid = s.cartId || s.cart?.id;
      const serial =
        s.cart?.serialNumber || cid?.slice(0, 8).toUpperCase() || "Unknown";
      if (!acc[cid]) acc[cid] = { serial, count: 0, total: 0 };
      acc[cid].count++;
      acc[cid].total += s.totalAmount || 0;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="admin_section">
      <div className="admin_section_header">
        <span className="admin_section_title">Sales Analytics</span>
        <span className="admin_section_count">{sales.length} transactions</span>
      </div>

      {/* ── Filters row ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "flex-end",
          marginBottom: 16,
        }}
      >
        {/* Date presets */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              style={{
                height: 34,
                padding: "0 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "0.75rem",
                transition: "all 0.15s",
                background:
                  preset === p.label ? "var(--bg-active)" : "var(--bg-hover)",
                color:
                  preset === p.label ? "var(--accent)" : "var(--text-muted)",
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
              height: 34,
              padding: "0 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: "0.75rem",
              transition: "all 0.15s",
              background:
                preset === "custom" ? "var(--bg-active)" : "var(--bg-hover)",
              color:
                preset === "custom" ? "var(--accent)" : "var(--text-muted)",
              border: `1px solid ${preset === "custom" ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <MdCalendarToday size={12} /> Custom
          </button>
        </div>

        {/* iCart filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <select
            className="modal-input"
            style={{ height: 34, minWidth: 160, marginBottom: 0 }}
            value={selectedCart}
            onChange={(e) => setSelectedCart(e.target.value)}
          >
            <option value="">All iCarts</option>
            {icarts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.serialNumber || c.id.slice(0, 8).toUpperCase()}
              </option>
            ))}
          </select>
          {selectedCart && (
            <button
              onClick={() => setSelectedCart("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <MdClose size={16} />
            </button>
          )}
        </div>

        {/* Payment method filter */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {["ALL", "CASH", "POS", "TRANSFER"].map((m) => {
            const c = m !== "ALL" ? pmColors[m] : null;
            const active = paymentFilter === m;
            return (
              <button
                key={m}
                onClick={() => setPaymentFilter(m)}
                style={{
                  height: 34,
                  padding: "0 11px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  background: active
                    ? c
                      ? c.bg
                      : "var(--bg-active)"
                    : "var(--bg-hover)",
                  color: active
                    ? c
                      ? c.color
                      : "var(--accent)"
                    : "var(--text-muted)",
                  border: `1px solid ${active ? (c ? c.border : "rgba(203,108,220,0.4)") : "var(--border)"}`,
                }}
              >
                {m}
              </button>
            );
          })}
        </div>

        {loading && (
          <div
            className="page_loader_spinner"
            style={{ width: 16, height: 16 }}
          />
        )}
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
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

      {/* ── Summary cards ── */}
      {totals && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {[
            { label: "Total Revenue", value: totals.totalSales, accent: true },
            { label: "Total Profit", value: totals.totalProfit, accent: false },
            {
              label: "Cost of Sales",
              value: totals.totalCostOfSales,
              accent: false,
            },
            { label: "Owner Profit", value: totals.ownerProfit, accent: false },
            {
              label: "Total Expenses",
              value: totals.totalExpenses,
              accent: false,
            },
            { label: "Nora Profit", value: totals.noraProfit, accent: false },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: s.accent ? "var(--bg-active)" : "var(--bg-hover)",
                border: `1px solid ${s.accent ? "rgba(203,108,220,0.2)" : "var(--border)"}`,
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 900,
                  color: s.accent ? "var(--accent)" : "var(--text-heading)",
                }}
              >
                ₦{fmt(s.value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Chart ── */}
      {chartData.length > 0 && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "16px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 14,
            }}
          >
            <MdTrendingUp size={15} style={{ color: "var(--accent)" }} />
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Sales Trend
            </span>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {[
                { color: "var(--accent)", label: "Revenue" },
                { color: "#22c55e", label: "Profit" },
              ].map((l) => (
                <div
                  key={l.label}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: l.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="adminSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="rgba(203,108,220,0.3)"
                    stopOpacity={1}
                  />
                  <stop
                    offset="95%"
                    stopColor="rgba(203,108,220,0)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient
                  id="adminProfitGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="rgba(34,197,94,0.25)"
                    stopOpacity={1}
                  />
                  <stop
                    offset="95%"
                    stopColor="rgba(34,197,94,0)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={fmtChartDate}
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                }
                width={44}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#adminSalesGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#adminProfitGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Two-col: payment breakdown + top carts ── */}
      {(pmBreakdown.length > 0 || cartBreakdown.length > 0) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {/* Payment breakdown */}
          {pmBreakdown.length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                }}
              >
                By Payment Method
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {pmBreakdown.map(({ method, count, total }) => {
                  const c = pmColors[method] || pmColors.OTHER;
                  return (
                    <div
                      key={method}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                        borderRadius: 9,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: c.color,
                          minWidth: 60,
                        }}
                      >
                        {method}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          flex: 1,
                        }}
                      >
                        {count} sale{count !== 1 ? "s" : ""}
                      </span>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          color: "var(--text-heading)",
                        }}
                      >
                        ₦{fmt(total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top iCarts by revenue */}
          {cartBreakdown.length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 10,
                }}
              >
                Top iCarts by Revenue
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {cartBreakdown.map(({ serial, count, total }, idx) => (
                  <div
                    key={serial}
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
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        color: "var(--text-muted)",
                        minWidth: 16,
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                        fontFamily: "monospace",
                        flex: 1,
                      }}
                    >
                      {serial}
                    </span>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {count} sales
                    </span>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        color: "var(--accent)",
                      }}
                    >
                      ₦{fmt(total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Transactions list ── */}
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
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "var(--text-heading)",
          }}
        >
          Transactions
        </span>
        <span className="admin_section_count">{filteredSales.length}</span>
        {paymentFilter !== "ALL" && (
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            filtered by {paymentFilter}
          </span>
        )}
      </div>

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="admin_empty">
          <MdPointOfSale size={24} style={{ opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: "0.82rem" }}>
            No transactions in this period.
          </p>
        </div>
      ) : (
        <div>
          {filteredSales.map((sale) => (
            <SaleRow key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  );
}
