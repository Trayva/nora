import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdExpandMore, MdExpandLess, MdImage, MdOutlineShoppingBag,
  MdPhone, MdLocationOn, MdRefresh,
} from "react-icons/md";
import api from "../../api/axios";

/* ── helpers ──────────────────────────────────────────────── */
const fmt     = (n) => Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 });
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "PREPARING", "COMPLETED", "DISPATCHED", "DELIVERED", "CANCELLED"];

const STATUS_STYLE = {
  PENDING:    { bg: "rgba(234,179,8,0.1)",   color: "#ca8a04",       border: "rgba(234,179,8,0.25)"   },
  ACCEPTED:   { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6",       border: "rgba(59,130,246,0.25)"  },
  PREPARING:  { bg: "rgba(168,85,247,0.1)",  color: "#a855f7",       border: "rgba(168,85,247,0.25)"  },
  COMPLETED:  { bg: "rgba(34,197,94,0.1)",   color: "#16a34a",       border: "rgba(34,197,94,0.25)"   },
  DISPATCHED: { bg: "rgba(203,108,220,0.1)", color: "var(--accent)", border: "rgba(203,108,220,0.25)" },
  DELIVERED:  { bg: "rgba(34,197,94,0.1)",   color: "#16a34a",       border: "rgba(34,197,94,0.25)"   },
  CANCELLED:  { bg: "rgba(107,114,128,0.1)", color: "#6b7280",       border: "rgba(107,114,128,0.25)" },
};
const PMT_STYLE = {
  PAID:    { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", border: "rgba(34,197,94,0.25)"   },
  PENDING: { bg: "rgba(234,179,8,0.1)",   color: "#ca8a04", border: "rgba(234,179,8,0.25)"   },
  FAILED:  { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "rgba(239,68,68,0.25)"   },
};

function StatusChip({ status, colors = STATUS_STYLE }) {
  const s = colors[status] || colors.PENDING || { bg: "var(--bg-hover)", color: "var(--text-muted)", border: "var(--border)" };
  return (
    <span style={{ fontSize: "0.62rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
      {status}
    </span>
  );
}

/* ── Next statuses a user can transition to ── */
const NEXT_STATUSES = {
  PENDING:    ["ACCEPTED", "CANCELLED"],
  ACCEPTED:   ["PREPARING", "CANCELLED"],
  PREPARING:  ["COMPLETED", "DISPATCHED", "CANCELLED"],
  COMPLETED:  [],
  DISPATCHED: ["DELIVERED"],
  DELIVERED:  [],
  CANCELLED:  [],
};

/* ── Single order card ── */
function OrderCard({ order, onUpdated }) {
  const [expanded, setExpanded]   = useState(false);
  const [updating, setUpdating]   = useState(null);

  const s  = STATUS_STYLE[order.status] || STATUS_STYLE.PENDING;
  const ps = PMT_STYLE[order.paymentStatus] || PMT_STYLE.PENDING;
  const nextStatuses = NEXT_STATUSES[order.status] || [];

  const updateStatus = async (status) => {
    setUpdating(status);
    try {
      await api.patch(`/icart/shop/order/${order.id}/status/operator`, { status });
      toast.success(`Order ${status.toLowerCase()}`);
      onUpdated?.({ ...order, status });
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update"); }
    finally { setUpdating(null); }
  };

  return (
    <div style={{ background: "var(--bg-card)", border: `1px solid ${order.status === "PENDING" ? "rgba(234,179,8,0.35)" : "var(--border)"}`, borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
      {/* Colour top stripe */}
      <div style={{ height: 3, background: s.color, opacity: 0.7 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpanded((v) => !v)}>
        {/* Queue number */}
        <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 900, flexShrink: 0 }}>
          #{order.queueNumber}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-heading)", fontFamily: "monospace" }}>{order.orderNumber}</span>
            <StatusChip status={order.status} />
            {order.paymentStatus === "PAID" && (
              <span style={{ fontSize: "0.62rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
                PAID
              </span>
            )}
            {order.paymentStatus === "FAILED" && (
              <span style={{ fontSize: "0.62rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
                FAILED
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, color: "var(--text-body)" }}>{order.customerName}</span>
            <span>{fmtDate(order.createdAt)} {fmtTime(order.createdAt)}</span>
            <span style={{ fontWeight: 700, color: "var(--text-heading)" }}>₦{fmt(order.totalAmount)}</span>
          </div>
        </div>

        {expanded ? <MdExpandLess size={16} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />
                  : <MdExpandMore size={16} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-hover)" }}>
          {/* Customer info */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 10 }}>
            {order.customerPhone && (
              <a href={`tel:${order.customerPhone}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
                <MdPhone size={12} />{order.customerPhone}
              </a>
            )}
            {order.customerEmail && (
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{order.customerEmail}</span>
            )}
          </div>

          {/* Delivery address */}
          {order.deliveryAddress && (
            <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <MdLocationOn size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: "0.72rem", color: "var(--text-body)", lineHeight: 1.4 }}>{order.deliveryAddress}</span>
            </div>
          )}

          {/* Items */}
          <div>
            {order.items?.map((item, i) => (
              <div key={item.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: i < order.items.length - 1 ? "1px solid var(--border)" : "none" }}>
                {item.menuItem?.image
                  ? <img src={item.menuItem.image} alt="" style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 32, height: 32, borderRadius: 7, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdImage size={13} style={{ color: "var(--text-muted)" }} /></div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-body)" }}>{item.menuItem?.name || "Item"}</div>
                  {item.menuItem?.description && (
                    <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.menuItem.description}</div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)" }}>₦{fmt(item.priceAtTime)}</div>
                  <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>× {item.quantity}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</span>
            <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--accent)" }}>₦{fmt(order.totalAmount)}</span>
          </div>

          {/* Status actions */}
          {nextStatuses.length > 0 && (
            <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {nextStatuses.map((ns) => {
                const ns_s = STATUS_STYLE[ns];
                const isLoading = updating === ns;
                const isDanger  = ns === "CANCELLED";
                return (
                  <button
                    key={ns}
                    onClick={() => updateStatus(ns)}
                    disabled={!!updating}
                    style={{
                      height: 32, padding: "0 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                      fontWeight: 800, fontSize: "0.72rem", border: `1px solid ${isDanger ? "rgba(239,68,68,0.3)" : ns_s.border}`,
                      background: isDanger ? "rgba(239,68,68,0.07)" : ns_s.bg,
                      color: isDanger ? "#ef4444" : ns_s.color,
                      opacity: updating && !isLoading ? 0.5 : 1,
                      display: "inline-flex", alignItems: "center", gap: 5, position: "relative",
                    }}
                  >
                    {isLoading
                      ? <><span className="btn_loader" style={{ width: 11, height: 11, borderColor: isDanger ? "#ef4444" : ns_s.color, borderTopColor: "transparent" }} /> {ns}</>
                      : ns
                    }
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main IcartOrders tab ── */
export default function IcartOrders({ cartId }) {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("ALL");
  const [stats, setStats]         = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await api.get("/icart/shop/orders", { params: { cartId } });
      const d = r.data.data;
      setOrders(d?.orders || []);
      setStats(d?.stats || {});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load orders");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [cartId]);

  const handleUpdated = (updated) => {
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
  };

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const pending  = stats.PENDING || 0;

  return (
    <div className="icart_tab_content">
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Orders
        </span>
        {pending > 0 && (
          <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "1px solid rgba(234,179,8,0.25)" }}>
            {pending} pending
          </span>
        )}
        <button onClick={fetchOrders} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 }} title="Refresh">
          <MdRefresh size={16} />
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="icart_sub_nav" style={{ marginBottom: 14 }}>
        {["ALL", ...ORDER_STATUSES].map((s) => {
          const count = s === "ALL" ? orders.length : orders.filter((o) => o.status === s).length;
          if (s !== "ALL" && count === 0) return null;
          const ss = STATUS_STYLE[s];
          const isActive = filter === s;
          return (
            <button key={s}
              className={`icart_sub_nav_btn ${isActive ? "icart_sub_nav_active" : ""}`}
              style={isActive && ss ? { color: ss.color, borderColor: ss.border, background: ss.bg } : {}}
              onClick={() => setFilter(s)}
            >
              {s === "ALL" ? "All" : s}
              {count > 0 && <span style={{ marginLeft: 4, fontSize: "0.6rem", fontWeight: 800, opacity: 0.75 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="drawer_loading"><div className="page_loader_spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="icart_empty_state" style={{ padding: "40px 0" }}>
          <MdOutlineShoppingBag size={28} style={{ opacity: 0.25 }} />
          <p className="icart_empty_title">{orders.length === 0 ? "No orders yet" : `No ${filter.toLowerCase()} orders`}</p>
          <p className="icart_empty_sub">{orders.length === 0 ? "Orders from customers will appear here." : "Try a different filter."}</p>
        </div>
      ) : (
        <div>
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}