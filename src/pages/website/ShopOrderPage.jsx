import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  MdCheckCircle,
  MdAccessTime,
  MdLocalShipping,
  MdOutlineShoppingBag,
  MdClose,
  MdRefresh,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdOpenInNew,
  MdOutlineLightMode,
  MdOutlineDarkMode,
  MdImage,
  MdOutlineReceiptLong,
} from "react-icons/md";
import { LuShoppingCart, LuChefHat, LuPackageCheck } from "react-icons/lu";
import api from "../../api/axios";
import { useTheme } from "../../contexts/ThemeContext";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
const fmtDt = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/* ── Order status pipeline ── */
const STEPS = [
  {
    key: "PENDING",
    label: "Order Received",
    icon: LuShoppingCart,
    desc: "Your order has been received and is waiting for the vendor.",
  },
  {
    key: "ACCEPTED",
    label: "Accepted",
    icon: MdCheckCircle,
    desc: "The vendor has accepted your order.",
  },
  {
    key: "PREPARING",
    label: "Preparing",
    icon: LuChefHat,
    desc: "Your food is being freshly prepared.",
  },
  {
    key: "COMPLETED",
    label: "Ready",
    icon: LuPackageCheck,
    desc: "Your order is ready for pickup / dispatch.",
  },
  {
    key: "DISPATCHED",
    label: "On the Way",
    icon: MdLocalShipping,
    desc: "Your order is on its way to you!",
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    icon: MdCheckCircle,
    desc: "Order delivered. Enjoy your meal!",
  },
];

const CANCEL_STYLE = {
  bg: "rgba(107,114,128,0.08)",
  color: "#6b7280",
  border: "rgba(107,114,128,0.2)",
};

const STATUS_COLOR = {
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  ACCEPTED: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
  },
  PREPARING: {
    bg: "rgba(168,85,247,0.1)",
    color: "#a855f7",
    border: "rgba(168,85,247,0.25)",
  },
  COMPLETED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  DISPATCHED: {
    bg: "rgba(203,108,220,0.1)",
    color: "var(--accent)",
    border: "rgba(203,108,220,0.25)",
  },
  DELIVERED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  CANCELLED: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.2)",
  },
};

const PMT_COLOR = {
  PAID: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  FAILED: {
    bg: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.25)",
  },
};

function Chip({ label, s }) {
  return (
    <span
      style={{
        fontSize: "0.62rem",
        fontWeight: 800,
        padding: "2px 9px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

/* ── Progress stepper ── */
function Stepper({ status }) {
  if (status === "CANCELLED") {
    return (
      <div
        style={{
          padding: "14px 16px",
          background: CANCEL_STYLE.bg,
          border: `1px solid ${CANCEL_STYLE.border}`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <MdClose
          size={18}
          style={{ color: CANCEL_STYLE.color, flexShrink: 0 }}
        />
        <div>
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: CANCEL_STYLE.color,
            }}
          >
            Order Cancelled
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            This order has been cancelled.
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const current = i === currentIdx;
        const future = i > currentIdx;
        const Icon = step.icon;
        const sc = STATUS_COLOR[step.key] || STATUS_COLOR.PENDING;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.key} style={{ display: "flex", gap: 14 }}>
            {/* Left: circle + line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: done
                    ? "rgba(34,197,94,0.12)"
                    : current
                      ? sc.bg
                      : "var(--bg-hover)",
                  border: `2px solid ${done ? "rgba(34,197,94,0.4)" : current ? sc.border : "var(--border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.3s",
                }}
              >
                <Icon
                  size={15}
                  style={{
                    color: done
                      ? "#16a34a"
                      : current
                        ? sc.color
                        : "var(--text-muted)",
                  }}
                />
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 16,
                    background: done ? "rgba(34,197,94,0.3)" : "var(--border)",
                    margin: "3px 0",
                  }}
                />
              )}
            </div>

            {/* Right: text */}
            <div
              style={{
                paddingBottom: isLast ? 0 : 18,
                paddingTop: 6,
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: current ? 800 : done ? 600 : 500,
                  color: done
                    ? "#16a34a"
                    : current
                      ? sc.color
                      : "var(--text-muted)",
                }}
              >
                {step.label}
                {current && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: 999,
                      background: sc.bg,
                      color: sc.color,
                      border: `1px solid ${sc.border}`,
                    }}
                  >
                    NOW
                  </span>
                )}
                {done && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: "0.68rem",
                      color: "#16a34a",
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              {current && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: 2,
                    lineHeight: 1.4,
                  }}
                >
                  {step.desc}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main page ── */
export default function ShopOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggle } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const intervalRef = useRef(null);

  // The ?id= param holds the orderNumber e.g. ORD-1773879000261-76
  const orderNumber = searchParams.get("id") || "";

  const fetchOrder = async (id, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const r = await api.get("/icart/shop/order", { params: { id } });
      setOrder(r.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Order not found");
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch whenever the URL param changes
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!orderNumber) {
      setOrder(null);
      setLoading(false);
      return;
    }
    setInputVal(orderNumber);
    fetchOrder(orderNumber);
    intervalRef.current = setInterval(() => {
      fetchOrder(orderNumber, true);
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [orderNumber]);

  const handleLookup = () => {
    const val = inputVal.trim();
    if (!val) return;
    // Update URL param — triggers useEffect above
    setSearchParams({ id: val });
  };

  const sc = order ? STATUS_COLOR[order.status] || STATUS_COLOR.PENDING : null;
  const psc = order
    ? PMT_COLOR[order.paymentStatus] || PMT_COLOR.PENDING
    : null;
  const payLink = order?.paymentLink || order?.paymentUrl;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      <style>{`
        @media (max-width: 600px) {
          .shop-order-inner { padding: 20px 16px 80px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          height: 58,
        }}
      >
        <div
          className="shop-header-inner"
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            height: "100%",
            padding: "0 40px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxSizing: "border-box",
          }}
        >
          {/* Logo — links to landing */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <img
              src={theme === "dark" ? nora_logo_white : nora_logo_dark}
              alt="Nora"
              style={{ height: 26, width: "auto", objectFit: "contain" }}
            />
          </Link>
          {/* Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <div
              style={{ width: 1, height: 20, background: "var(--border)" }}
            />
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              Track Order
            </span>
          </div>
          <div style={{ flex: 1 }} />
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="icart_icon_action_btn"
            style={{ width: 34, height: 34 }}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <MdOutlineLightMode size={17} />
            ) : (
              <MdOutlineDarkMode size={17} />
            )}
          </button>
          {/* Track order icon — highlighted since we're already on this page */}
          <div
            style={{
              width: 34,
              height: 34,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-active)",
              border: "1px solid rgba(203,108,220,0.3)",
              borderRadius: 8,
              color: "var(--accent)",
              flexShrink: 0,
            }}
          >
            <MdOutlineReceiptLong size={17} />
            <span
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--accent)",
                border: "1.5px solid var(--bg-card)",
              }}
            />
          </div>
          {/* Shop button */}
          <Link
            to="/shop"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 36,
              padding: "0 14px",
              borderRadius: 10,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <LuShoppingCart size={14} /> Shop
          </Link>
        </div>
      </header>

      {/* ── Content ── */}
      <div
        className="shop-order-inner"
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "28px 40px 80px",
          boxSizing: "border-box",
        }}
      >
        <style>{`@keyframes shopSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

        {/* ── Lookup input — always visible ── */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "20px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              marginBottom: 4,
            }}
          >
            Track Order
          </div>
          <div
            style={{
              fontSize: "0.74rem",
              color: "var(--text-muted)",
              marginBottom: 14,
            }}
          >
            Enter your order number to check its status.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="modal-input"
              style={{
                flex: 1,
                marginBottom: 0,
                fontFamily: "monospace",
                fontSize: "0.85rem",
              }}
              placeholder="e.g. ORD-1773879000261-76"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            />
            <button
              onClick={handleLookup}
              disabled={loading || !inputVal.trim()}
              className={`app_btn app_btn_confirm${loading ? " btn_loading" : ""}`}
              style={{
                height: 42,
                padding: "0 20px",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <span className="btn_text">Track</span>
              {loading && (
                <span
                  className="btn_loader"
                  style={{ width: 13, height: 13 }}
                />
              )}
            </button>
          </div>
          {error && (
            <div
              style={{
                marginTop: 10,
                padding: "9px 14px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 9,
                fontSize: "0.78rem",
                color: "#ef4444",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[100, 260, 160].map((h, i) => (
              <div
                key={i}
                style={{
                  height: h,
                  borderRadius: 16,
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                }}
              />
            ))}
          </div>
        )}

        {!loading && order && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* ── Order header card ── */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div style={{ height: 3, background: sc.color, opacity: 0.7 }} />
              <div style={{ padding: "16px 18px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 4,
                      }}
                    >
                      Order Number
                    </div>
                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        color: "var(--text-heading)",
                        fontFamily: "monospace",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {order.orderNumber}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Chip label={order.status} s={sc} />
                    {order.paymentStatus !== "PENDING" && (
                      <Chip label={order.paymentStatus} s={psc} />
                    )}
                    {order.paymentStatus === "PENDING" && (
                      <Chip label="PAYMENT PENDING" s={PMT_COLOR.PENDING} />
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    {
                      label: "Total",
                      value: `₦${fmt(order.totalAmount)}`,
                      accent: true,
                    },
                    { label: "Queue #", value: `#${order.queueNumber}` },
                    { label: "Placed", value: fmtDt(order.createdAt) },
                  ].map((m) => (
                    <div
                      key={m.label}
                      style={{
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: 9,
                        padding: "7px 12px",
                        minWidth: 0,
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
                        {m.label}
                      </div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          color: m.accent
                            ? "var(--accent)"
                            : "var(--text-heading)",
                        }}
                      >
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pay Now — if payment still pending */}
                {payLink && order.paymentStatus === "PENDING" && (
                  <a
                    href={payLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      height: 44,
                      marginTop: 14,
                      borderRadius: 11,
                      background: "var(--accent)",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      textDecoration: "none",
                    }}
                  >
                    Complete Payment <MdOpenInNew size={16} />
                  </a>
                )}

                {/* Refresh button */}
                <button
                  onClick={() => fetchOrder(orderNumber, true)}
                  disabled={refreshing}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 10,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    padding: 0,
                    fontFamily: "inherit",
                  }}
                >
                  <MdRefresh
                    size={14}
                    style={{
                      animation: refreshing
                        ? "shopSpin 0.8s linear infinite"
                        : "none",
                    }}
                  />
                  {refreshing ? "Refreshing…" : "Refresh status"}
                  <style>{`@keyframes shopSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                </button>
              </div>
            </div>

            {/* ── Progress tracker ── */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 16,
                }}
              >
                Order Progress
              </div>
              <Stepper status={order.status} />
            </div>

            {/* ── iCart location ── */}
            {order.cart?.location && (
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: "14px 18px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 12,
                  }}
                >
                  iCart Location
                </div>
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "var(--bg-active)",
                      border: "1px solid rgba(203,108,220,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MdLocationOn
                      size={14}
                      style={{ color: "var(--accent)" }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "var(--text-heading)",
                        marginBottom: 2,
                      }}
                    >
                      {order.cart.location.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.4,
                      }}
                    >
                      {order.cart.location.address}
                      {order.cart.location.city
                        ? `, ${order.cart.location.city}`
                        : ""}
                    </div>
                    {order.cart.serialNumber && (
                      <div
                        style={{
                          fontSize: "0.66rem",
                          color: "var(--text-muted)",
                          fontFamily: "monospace",
                          marginTop: 3,
                        }}
                      >
                        Cart {order.cart.serialNumber}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Delivery details ── */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 14,
                }}
              >
                Delivery Details
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "var(--bg-active)",
                      border: "1px solid rgba(203,108,220,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MdLocationOn
                      size={14}
                      style={{ color: "var(--accent)" }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--text-muted)",
                        marginBottom: 2,
                      }}
                    >
                      Delivery Address
                    </div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "var(--text-body)",
                        lineHeight: 1.4,
                      }}
                    >
                      {order.deliveryAddress}
                    </div>
                  </div>
                </div>

                {order.customerName && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: "0.78rem" }}>👤</span>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          marginBottom: 1,
                        }}
                      >
                        Customer
                      </div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "var(--text-body)",
                        }}
                      >
                        {order.customerName}
                      </div>
                    </div>
                  </div>
                )}

                {order.customerPhone && (
                  <a
                    href={`tel:${order.customerPhone}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MdPhone
                        size={13}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          marginBottom: 1,
                        }}
                      >
                        Phone
                      </div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "var(--accent)",
                        }}
                      >
                        {order.customerPhone}
                      </div>
                    </div>
                  </a>
                )}

                {order.customerEmail && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MdEmail
                        size={13}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          marginBottom: 1,
                        }}
                      >
                        Email
                      </div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "var(--text-body)",
                        }}
                      >
                        {order.customerEmail}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Order items ── */}
            {order.items?.length > 0 && (
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Items Ordered
                  </span>
                </div>
                {order.items.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 18px",
                      borderBottom:
                        i < order.items.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    {item.menuItem?.image ? (
                      <img
                        src={item.menuItem.image}
                        alt=""
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: "var(--bg-hover)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <MdImage
                          size={16}
                          style={{ color: "var(--text-muted)" }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "var(--text-body)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.menuItem?.name ||
                          item.menuItemId?.slice(0, 8).toUpperCase()}
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        × {item.quantity}
                        {item.variantId && " · Variant"}
                        {item.extras?.length > 0 &&
                          ` · ${item.extras.length} extra${item.extras.length !== 1 ? "s" : ""}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          color: "var(--text-heading)",
                        }}
                      >
                        ₦{fmt(item.priceAtTime * item.quantity)}
                      </div>
                      <div
                        style={{
                          fontSize: "0.66rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        ₦{fmt(item.priceAtTime)} each
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    padding: "12px 18px",
                    background: "var(--bg-hover)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 900,
                      color: "var(--accent)",
                    }}
                  >
                    ₦{fmt(order.totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {payLink && order.paymentStatus === "PENDING" && (
                <a
                  href={payLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    height: 46,
                    borderRadius: 11,
                    background: "var(--accent)",
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  Pay Now <MdOpenInNew size={16} />
                </a>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <Link
                  to="/shop"
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    height: 42,
                    borderRadius: 11,
                    background: "var(--bg-active)",
                    border: "1px solid rgba(203,108,220,0.2)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--accent)",
                    textDecoration: "none",
                  }}
                >
                  <LuShoppingCart size={15} /> Order Again
                </Link>
                <button
                  onClick={() => {
                    setOrder(null);
                    setError(null);
                    setInputVal("");
                    setSearchParams({});
                  }}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 11,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Check Another Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
