import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdExpandMore, MdExpandLess, MdImage, MdOutlineShoppingBag,
  MdPhone, MdLocationOn, MdRefresh, MdPrint,
} from "react-icons/md";
import api from "../../api/axios";
import useCurrencyDisplay from "../../hooks/useCurrencyDisplay";

/* ── helpers ──────────────────────────────────────────────── */
const fmt = (n) => Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 });
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "PREPARING", "COMPLETED", "DISPATCHED", "DELIVERED", "CANCELLED"];

const STATUS_STYLE = {
  PENDING: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  ACCEPTED: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  PREPARING: { bg: "rgba(168,85,247,0.1)", color: "#a855f7", border: "rgba(168,85,247,0.25)" },
  COMPLETED: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  DISPATCHED: { bg: "rgba(203,108,220,0.1)", color: "var(--accent)", border: "rgba(203,108,220,0.25)" },
  DELIVERED: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  CANCELLED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.25)" },
};
const PMT_STYLE = {
  PAID: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  PENDING: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  FAILED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.25)" },
};

function StatusChip({ status, colors = STATUS_STYLE }) {
  const s = colors[status] || colors.PENDING || { bg: "var(--bg-hover)", color: "var(--text-muted)", border: "var(--border)" };
  return (
    <span style={{ fontSize: "0.62rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
      {status}
    </span>
  );
}

/* ── Receipt printing ─────────────────────────────────────── */
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateOrderReceiptHTML(order, fmtCurrency) {
  const cur = order.currency || "NGN";
  const created = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateStr = created.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = created.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const orderTypeLabel = (order.orderType || "ORDER").replace(/_/g, " ");

  const itemRows = (order.items || [])
    .map((item) => {
      const name = escapeHtml(item.menuItem?.name || "Item");
      const qty = Number(item.quantity || 1);
      const unit = Number(item.priceAtTime || 0);
      const lineTotal = unit * qty;
      return `
        <tr>
          <td class="item-name">${qty}x ${name}</td>
          <td class="item-price">${escapeHtml(fmtCurrency(lineTotal, cur))}</td>
        </tr>`;
    })
    .join("");

  const subtotalRow = order.subtotal > 0
    ? `<div class="tot-row"><span>Subtotal</span><span>${escapeHtml(fmtCurrency(order.subtotal, cur))}</span></div>`
    : "";
  const vatRow = order.vatAmount > 0
    ? `<div class="tot-row"><span>VAT</span><span>${escapeHtml(fmtCurrency(order.vatAmount, cur))}</span></div>`
    : "";
  const deliveryRow = order.deliveryFee > 0
    ? `<div class="tot-row"><span>Delivery Fee</span><span>${escapeHtml(fmtCurrency(order.deliveryFee, cur))}</span></div>`
    : "";

  const customerBlock = (order.customerName || order.customerPhone || order.deliveryAddress)
    ? `
      <div class="divider"></div>
      <div class="meta-block">
        ${order.customerName ? `<div><strong>Customer:</strong> ${escapeHtml(order.customerName)}</div>` : ""}
        ${order.customerPhone ? `<div><strong>Phone:</strong> ${escapeHtml(order.customerPhone)}</div>` : ""}
        ${order.deliveryAddress ? `<div><strong>Address:</strong> ${escapeHtml(order.deliveryAddress)}</div>` : ""}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${escapeHtml(order.orderNumber)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      color: #111;
      margin: 0;
      padding: 12px;
      background: #fff;
      font-size: 12px;
      line-height: 1.4;
    }
    .receipt {
      width: 100%;
      max-width: 300px;
      margin: 0 auto;
    }
    .center { text-align: center; }
    .brand { font-size: 18px; font-weight: 900; letter-spacing: 0.08em; margin-bottom: 2px; }
    .sub { font-size: 11px; color: #555; }
    .queue-box {
      display: inline-block;
      margin: 8px auto 4px;
      padding: 4px 12px;
      border: 2px solid #111;
      font-size: 16px;
      font-weight: 900;
    }
    .divider { border-top: 1px dashed #333; margin: 8px 0; }
    .meta-block { font-size: 11px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    th { text-align: left; font-size: 11px; border-bottom: 1px solid #333; padding-bottom: 3px; }
    th.r { text-align: right; }
    td { padding: 4px 0; vertical-align: top; font-size: 12px; }
    .item-name { padding-right: 8px; }
    .item-price { text-align: right; white-space: nowrap; font-weight: 700; }
    .tot-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px; }
    .grand-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; margin-top: 6px; padding-top: 6px; border-top: 1px solid #111; }
    .footer { text-align: center; margin-top: 12px; font-size: 11px; color: #444; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="brand">NORA</div>
      <div class="sub">ORDER RECEIPT</div>
      ${order.queueNumber != null ? `<div class="queue-box">QUEUE #${escapeHtml(order.queueNumber)}</div>` : ""}
    </div>

    <div class="divider"></div>
    <div class="meta-block">
      <div class="meta-row"><span>Order #:</span><strong>${escapeHtml(order.orderNumber)}</strong></div>
      <div class="meta-row"><span>Date:</span><span>${escapeHtml(dateStr)} ${escapeHtml(timeStr)}</span></div>
      <div class="meta-row"><span>Type:</span><strong>${escapeHtml(orderTypeLabel)}</strong></div>
      <div class="meta-row"><span>Payment:</span><strong>${escapeHtml(order.paymentMethod || "CARD")} (${escapeHtml(order.paymentStatus || "PENDING")})</strong></div>
    </div>
    ${customerBlock}
    <div class="divider"></div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="r">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="divider"></div>
    ${subtotalRow}
    ${vatRow}
    ${deliveryRow}
    <div class="grand-row">
      <span>TOTAL</span>
      <span>${escapeHtml(fmtCurrency(order.totalAmount, cur))}</span>
    </div>

    <div class="footer">
      <div>Thank you for your order!</div>
    </div>
  </div>
</body>
</html>`;
}

function printOrderReceipt(order, fmtCurrency) {
  const html = generateOrderReceiptHTML(order, fmtCurrency);
  const win = window.open("", "_blank", "width=400,height=650");
  if (!win) {
    toast.error("Please allow pop-ups to print the receipt");
    return;
  }
  win.document.write(html);
  win.document.close();
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
  };
  win.onload = doPrint;
  setTimeout(doPrint, 500);
}

/* ── Next statuses a user can transition to ── */
const NEXT_STATUSES = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING"],
  PREPARING: ["COMPLETED", "DISPATCHED"],
  COMPLETED: ["DISPATCHED"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

/* ── Single order card ── */
function OrderCard({ order, onUpdated }) {
  const { format: fmtCurrency } = useCurrencyDisplay();
  const orderCur = order.currency || "NGN";
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(null);

  const s = STATUS_STYLE[order.status] || STATUS_STYLE.PENDING;
  const ps = PMT_STYLE[order.paymentStatus] || PMT_STYLE.PENDING;
  const nextStatuses = NEXT_STATUSES[order.status] || [];

  const updateStatus = async (status) => {
    setUpdating(status);
    try {
      await api.patch(`/kiosk/shop/order/${order.id}/status/operator`, { status });
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
            {order.paymentMethod && (
              <span style={{ fontSize: "0.62rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: order.paymentMethod === "CASH" ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.1)", color: order.paymentMethod === "CASH" ? "#16a34a" : "#3b82f6", border: `1px solid ${order.paymentMethod === "CASH" ? "rgba(34,197,94,0.25)" : "rgba(59,130,246,0.25)"}`, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
                {order.paymentMethod}
              </span>
            )}
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
            <span style={{ fontWeight: 700, color: "var(--text-heading)" }}>{fmtCurrency(order.totalAmount, orderCur)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            printOrderReceipt(order, fmtCurrency);
          }}
          title="Print Receipt"
          style={{
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-heading)",
            flexShrink: 0,
          }}
        >
          <MdPrint size={15} />
        </button>

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
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)" }}>{fmtCurrency(item.priceAtTime, orderCur)}</div>
                  <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>× {item.quantity}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</span>
            <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--accent)" }}>{fmtCurrency(order.totalAmount, orderCur)}</span>
          </div>

          {/* Status actions & Print Receipt */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {nextStatuses.map((ns) => {
              const ns_s = STATUS_STYLE[ns];
              const isLoading = updating === ns;
              const isDanger = ns === "CANCELLED";
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
            <button
              type="button"
              onClick={() => printOrderReceipt(order, fmtCurrency)}
              style={{
                height: 32, padding: "0 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                fontWeight: 700, fontSize: "0.72rem", border: "1px solid var(--border)",
                background: "var(--bg-card)", color: "var(--text-heading)",
                display: "inline-flex", alignItems: "center", gap: 5, marginLeft: "auto",
              }}
            >
              <MdPrint size={14} /> Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main KioskOrders tab ── */
export default function KioskOrders({ kioskId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [stats, setStats] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await api.get("/kiosk/shop/orders", { params: { kioskId } });
      const d = r.data.data;
      setOrders(d?.orders || []);
      setStats(d?.stats || {});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load orders");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [kioskId]);

  const handleUpdated = (updated) => {
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
  };

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const pending = stats.PENDING || 0;

  return (
    <div className="kiosk_tab_content">
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
      <div className="kiosk_sub_nav" style={{ marginBottom: 14 }}>
        {["ALL", ...ORDER_STATUSES].map((s) => {
          const count = s === "ALL" ? orders.length : orders.filter((o) => o.status === s).length;
          if (s !== "ALL" && count === 0) return null;
          const ss = STATUS_STYLE[s];
          const isActive = filter === s;
          return (
            <button key={s}
              className={`kiosk_sub_nav_btn ${isActive ? "kiosk_sub_nav_active" : ""}`}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="kiosk_task_card"
                style={{ padding: "14px", background: "var(--bg-card)" }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    className="skeleton_shimmer skeleton_rect"
                    style={{ width: 36, height: 36, borderRadius: 10 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      className="skeleton_shimmer skeleton_text"
                      style={{ width: "30%", height: 14, marginBottom: 7 }}
                    />
                    <div
                      className="skeleton_shimmer skeleton_text"
                      style={{ width: "50%", height: 10 }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="kiosk_empty_state" style={{ padding: "40px 0" }}>
          <MdOutlineShoppingBag size={28} style={{ opacity: 0.25 }} />
          <p className="kiosk_empty_title">{orders.length === 0 ? "No orders yet" : `No ${filter.toLowerCase()} orders`}</p>
          <p className="kiosk_empty_sub">{orders.length === 0 ? "Orders from customers will appear here." : "Try a different filter."}</p>
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