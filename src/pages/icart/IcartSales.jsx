import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  MdPointOfSale, MdTrendingUp, MdExpandMore, MdExpandLess, MdImage,
} from "react-icons/md";
import api from "../../api/axios";

/* ── helpers ──────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";

const fmtChartDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";

const pmColors = {
  CASH:     { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", border: "rgba(34,197,94,0.2)" },
  POS:      { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
  TRANSFER: { bg: "rgba(168,85,247,0.1)",  color: "#a855f7", border: "rgba(168,85,247,0.2)" },
  OTHER:    { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.2)" },
};

function PaymentBadge({ method }) {
  const c = pmColors[method] || pmColors.OTHER;
  return (
    <span style={{
      fontSize: "0.62rem", fontWeight: 800, padding: "2px 8px",
      borderRadius: 999, background: c.bg, color: c.color,
      border: `1px solid ${c.border}`, textTransform: "uppercase",
      letterSpacing: "0.05em", flexShrink: 0,
    }}>
      {method}
    </span>
  );
}

/* ── Custom tooltip ───────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
        {fmtChartDate(label)}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
            {p.dataKey === "sales" ? "Revenue" : "Profit"}
          </span>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-heading)", marginLeft: "auto", paddingLeft: 12 }}>
            ₦{fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Sale Row ─────────────────────────────────────────────── */
function SaleRow({ sale }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 12, overflow: "hidden", marginBottom: 6,
    }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="icart_task_icon"><MdPointOfSale size={13} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-body)", fontFamily: "monospace" }}>
              #{sale.id.slice(0, 8).toUpperCase()}
            </span>
            <PaymentBadge method={sale.paymentMethod} />
          </div>
          <div className="icart_task_meta">
            <span>{sale.items?.length || 0} item{sale.items?.length !== 1 ? "s" : ""}</span>
            <span className="contract_row_dot">·</span>
            <span>{sale.operator?.fullName || "Operator"}</span>
            <span className="contract_row_dot">·</span>
            <span>{fmtDate(sale.createdAt)}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "var(--text-heading)" }}>
            ₦{fmt(sale.totalAmount)}
          </div>
        </div>
        {expanded
          ? <MdExpandLess size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          : <MdExpandMore size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        }
      </div>

      {expanded && sale.items?.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-hover)" }}>
          {sale.items.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 14px",
                borderBottom: idx < sale.items.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              {item.menuItem?.image ? (
                <img src={item.menuItem.image} alt="" style={{ width: 26, height: 26, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 26, height: 26, borderRadius: 5, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MdImage size={12} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-body)" }}>
                  {item.menuItem?.name || "Item"}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>qty: {item.quantity}</div>
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-heading)", flexShrink: 0 }}>
                ₦{fmt(item.priceAtTime)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export default function IcartSales({ cart }) {
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/icart/sale"),
      api.get("/icart/sale/analytics"),
    ]).then(([salesRes, analyticsRes]) => {
      if (salesRes.status === "fulfilled") {
        const d = salesRes.value.data.data;
        const all = Array.isArray(d) ? d : d?.items || [];
        setSales(all.filter((s) => s.cartId === cart.id || s.cart?.id === cart.id));
      }
      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value.data.data);
      }
    }).catch(() => toast.error("Failed to load sales"))
      .finally(() => setLoading(false));
  }, [cart.id]);

  if (loading) return (
    <div className="drawer_loading"><div className="page_loader_spinner" /></div>
  );

  const totals = analytics?.totals;
  const chartData = (analytics?.chartData || []).map((d) => ({
    ...d,
    date: d.date,
    sales: Math.round(d.sales),
    profit: Math.round(d.profit),
  }));

  // Payment breakdown
  const pmBreakdown = ["CASH", "POS", "TRANSFER", "OTHER"].map((m) => ({
    method: m,
    count: sales.filter((s) => s.paymentMethod === m).length,
    total: sales.filter((s) => s.paymentMethod === m).reduce((sum, s) => sum + (s.totalAmount || 0), 0),
  })).filter((m) => m.count > 0);

  return (
    <div className="icart_tab_content">
      {/* ── Summary cards ── */}
      {totals && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Total Revenue", value: `₦${fmt(totals.totalSales)}`, accent: false },
            { label: "Total Profit",  value: `₦${fmt(totals.totalProfit)}`, accent: true },
            { label: "Owner Profit",  value: `₦${fmt(totals.ownerProfit)}`, accent: false },
            { label: "Vendor Profit", value: `₦${fmt(totals.vendorProfit)}`, accent: false },
          ].map((s) => (
            <div key={s.label} style={{
              background: s.accent ? "var(--bg-active)" : "var(--bg-hover)",
              border: `1px solid ${s.accent ? "rgba(203,108,220,0.2)" : "var(--border)"}`,
              borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 900, color: s.accent ? "var(--accent)" : "var(--text-heading)" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Chart ── */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <MdTrendingUp size={15} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sales Trend
            </span>
            {/* Legend */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              {[{ color: "var(--accent)", label: "Revenue" }, { color: "#22c55e", label: "Profit" }].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(203,108,220,0.3)" stopOpacity={1} />
                  <stop offset="95%" stopColor="rgba(203,108,220,0)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(34,197,94,0.25)" stopOpacity={1} />
                  <stop offset="95%" stopColor="rgba(34,197,94,0)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtChartDate}
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false} tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                width={42}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone" dataKey="sales" stroke="var(--accent)" strokeWidth={2}
                fill="url(#salesGrad)" dot={false} activeDot={{ r: 4 }}
              />
              <Area
                type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2}
                fill="url(#profitGrad)" dot={false} activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Payment breakdown ── */}
      {pmBreakdown.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            By Payment Method
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(pmBreakdown.length, 4)}, 1fr)`, gap: 6 }}>
            {pmBreakdown.map(({ method, count, total }) => {
              const c = pmColors[method] || pmColors.OTHER;
              return (
                <div key={method} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 800, color: c.color, textTransform: "uppercase", marginBottom: 4 }}>{method}</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "var(--text-heading)" }}>{count}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 1 }}>₦{fmt(total)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sales list ── */}
      <div className="drawer_section_title" style={{ marginBottom: 10 }}>
        Transactions
        <span className="icart_section_count" style={{ marginLeft: 8 }}>{sales.length}</span>
      </div>

      {sales.length === 0 ? (
        <div className="icart_empty_inline" style={{ padding: "32px 0" }}>
          <MdPointOfSale size={24} style={{ opacity: 0.3 }} />
          <span>No sales recorded yet</span>
        </div>
      ) : (
        <div>{sales.map((sale) => <SaleRow key={sale.id} sale={sale} />)}</div>
      )}
    </div>
  );
}