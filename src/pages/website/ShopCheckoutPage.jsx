import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MdArrowBack,
  MdCheckCircle,
  MdOpenInNew,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdPerson,
  MdImage,
} from "react-icons/md";
import api from "../../api/axios";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

/* ── Input field ── */
function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}) {
  return (
    <div className="form-field" style={{ marginBottom: 14 }}>
      <label className="modal-label">
        {label}
        {required && " *"}
      </label>
      <input
        className="modal-input"
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </div>
  );
}

/* ── Order success screen ── */
function OrderSuccess({ order, onClose }) {
  const paymentLink =
    order?.paymentLink ||
    order?.paymentUrl ||
    order?.data?.paymentLink ||
    order?.data?.paymentUrl ||
    null;
  const orderNumber =
    order?.orderNumber || order?.data?.orderNumber || order?.id || "";

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      {/* Success animation */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(34,197,94,0.12)",
          border: "2px solid rgba(34,197,94,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          animation: "successPop 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <style>{`@keyframes successPop{from{transform:scale(0)}to{transform:scale(1)}}`}</style>
        <MdCheckCircle size={40} style={{ color: "#16a34a" }} />
      </div>

      <h2
        style={{
          fontSize: "1.4rem",
          fontWeight: 900,
          color: "var(--text-heading)",
          margin: "0 0 8px",
        }}
      >
        Order Placed! 🎉
      </h2>
      {orderNumber && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 14px",
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Order
          </span>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              fontFamily: "monospace",
            }}
          >
            {orderNumber}
          </span>
        </div>
      )}
      <p
        style={{
          fontSize: "0.88rem",
          color: "var(--text-muted)",
          lineHeight: 1.6,
          margin: "0 0 28px",
        }}
      >
        Your order has been received.{" "}
        {paymentLink
          ? "Complete your payment below to confirm it."
          : "The vendor will process it shortly."}
      </p>

      {paymentLink ? (
        <a
          href={paymentLink}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 50,
            padding: "0 32px",
            borderRadius: 999,
            background: "linear-gradient(135deg,#f97316,#ef4444)",
            textDecoration: "none",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: "1rem",
            color: "#fff",
            boxShadow: "0 8px 28px rgba(249,115,22,0.35)",
            marginBottom: 16,
          }}
        >
          Pay Now <MdOpenInNew size={18} />
        </a>
      ) : null}

      <div>
        <button
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: "0.82rem",
            fontWeight: 600,
            fontFamily: "inherit",
            padding: 0,
          }}
        >
          <MdArrowBack size={14} /> Back to shop
        </button>
      </div>
    </div>
  );
}

/* ── Main checkout page ── */
export default function ShopCheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const group = state?.group; // { kioskId, conceptName, items: [{item, qty, concept, kioskId}] }
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
  });
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  // Guard — if navigated here directly without state
  if (!group) {
    navigate("/shop", { replace: true });
    return null;
  }

  const subtotal = group.items.reduce(
    (s, e) => s + (e.item.sellingPrice || 0) * e.qty,
    0,
  );

  const set = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const place = async () => {
    if (!form.customerName.trim() || form.customerName.trim().length < 2)
      return toast.error("Enter your name (min 2 characters)");
    if (!form.deliveryAddress.trim() || form.deliveryAddress.trim().length < 5)
      return toast.error("Enter your delivery address (min 5 characters)");

    setPlacing(true);
    try {
      const payload = {
        kioskId: group.kioskId,
        deliveryAddress: form.deliveryAddress.trim(),
        items: group.items.map((e) => ({
          menuItemId: e.item.id,
          quantity: e.qty,
        })),
      };
      if (form.customerName.trim())
        payload.customerName = form.customerName.trim();
      if (form.customerPhone.trim())
        payload.customerPhone = form.customerPhone.trim();
      if (form.customerEmail.trim())
        payload.customerEmail = form.customerEmail.trim();

      const r = await api.post("/kiosk/shop/order", payload);
      setOrderResult(r.data.data || r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (orderResult) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-body)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-card)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#f97316",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Kiosk Shop
          </div>
        </div>
        <OrderSuccess order={orderResult} onClose={() => navigate("/shop")} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-body)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-card)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            padding: 4,
            borderRadius: 8,
          }}
        >
          <MdArrowBack size={20} />
        </button>
        <div>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--text-heading)",
            }}
          >
            Checkout
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {group.conceptName}
          </div>
        </div>
      </div>

      <div
        style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 60px" }}
      >
        {/* Order summary card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Order Summary
          </div>
          {group.items.map((entry) => (
            <div
              key={entry.item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {entry.item.image ? (
                <img
                  src={entry.item.image}
                  alt=""
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 9,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 9,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdImage size={16} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                  }}
                >
                  {entry.item.name}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Quantity: {entry.qty}
                </div>
              </div>
              {entry.item.sellingPrice > 0 && (
                <div
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    color: "var(--text-heading)",
                    flexShrink: 0,
                  }}
                >
                  ₦{fmt(entry.item.sellingPrice * entry.qty)}
                </div>
              )}
            </div>
          ))}
          {subtotal > 0 && (
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
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
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  color: "#f97316",
                }}
              >
                ₦{fmt(subtotal)}
              </span>
            </div>
          )}
        </div>

        {/* Delivery details */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 16,
            }}
          >
            Your Details
          </div>

          <Field
            label="Full Name"
            name="customerName"
            placeholder="e.g. Amina Yusuf"
            value={form.customerName}
            onChange={set}
            required
          />
          <Field
            label="Phone Number"
            name="customerPhone"
            type="tel"
            placeholder="e.g. 0812 345 6789"
            value={form.customerPhone}
            onChange={set}
          />
          <Field
            label="Email (optional)"
            name="customerEmail"
            type="email"
            placeholder="your@email.com"
            value={form.customerEmail}
            onChange={set}
          />

          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="modal-label">Delivery Address *</label>
            <div style={{ position: "relative" }}>
              <MdLocationOn
                size={15}
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#f97316",
                  pointerEvents: "none",
                }}
              />
              <input
                className="modal-input"
                style={{ paddingLeft: 30 }}
                placeholder="Street address, estate, city"
                value={form.deliveryAddress}
                onChange={(e) => set("deliveryAddress", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Place order */}
        <button
          onClick={place}
          disabled={placing}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 14,
            background: placing
              ? "var(--bg-hover)"
              : "linear-gradient(135deg,#f97316,#ef4444)",
            border: "none",
            cursor: placing ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            fontWeight: 900,
            fontSize: "1rem",
            color: placing ? "var(--text-muted)" : "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: placing ? "none" : "0 8px 28px rgba(249,115,22,0.3)",
            transition: "all 0.2s",
          }}
        >
          {placing ? (
            <>
              <span
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid var(--border)",
                  borderTopColor: "var(--text-muted)",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />{" "}
              Placing order…
            </>
          ) : (
            <>
              <MdCheckCircle size={20} /> Place Order
              {subtotal > 0 ? ` · ₦${fmt(subtotal)}` : ""}
            </>
          )}
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </button>

        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            textAlign: "center",
            marginTop: 12,
            lineHeight: 1.5,
          }}
        >
          After placing your order, you'll be redirected to complete payment.
        </p>
      </div>
    </div>
  );
}
