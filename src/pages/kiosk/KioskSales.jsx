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
  MdExpandMore,
  MdExpandLess,
  MdImage,
  MdCalendarToday,
  MdAdd,
  MdClose,
} from "react-icons/md";
import api from "../../api/axios";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    })
    : "—";
const fmtChartDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    })
    : "";

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
  ONLINE: {
    bg: "rgba(203,108,220,0.1)",
    color: "var(--accent)",
    border: "rgba(203,108,220,0.25)",
  },
  OTHER: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.2)",
  },
};

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

const getVarietyLabel = (item) => {
  if (!item.variantId || !item.menuItem?.variants) return null;
  const match = item.menuItem.variants.find((v) => v.id === item.variantId);
  return match ? match.name : null;
};

const getExtrasLabel = (item) => {
  if (!item.extras || item.extras.length === 0 || !item.menuItem?.extras) return null;
  const matches = item.menuItem.extras.filter((e) => item.extras.includes(e.id));
  return matches.length > 0 ? matches.map((e) => e.name).join(", ") : null;
};

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
        <div className="kiosk_task_icon">
          <MdPointOfSale size={13} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 2,
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
          </div>
          <div className="kiosk_task_meta">
            <span>
              {sale.items?.length || 0} item
              {sale.items?.length !== 1 ? "s" : ""}
            </span>
            <span className="contract_row_dot">·</span>
            <span>{sale.operator?.fullName || "Operator"}</span>
            <span className="contract_row_dot">·</span>
            <span>VAT: ₦{fmt(sale.vatAmount || 0)}</span>
            <span className="contract_row_dot">·</span>
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
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    marginTop: 1,
                  }}
                >
                  <div>qty: {item.quantity}</div>
                  {getVarietyLabel(item) && (
                    <div style={{ color: "var(--accent)", fontWeight: 600 }}>
                      Variety: {getVarietyLabel(item)}
                    </div>
                  )}
                  {getExtrasLabel(item) && (
                    <div style={{ color: "var(--text-muted)" }}>
                      Extras: {getExtrasLabel(item)}
                    </div>
                  )}
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

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: null },
];

const toISODate = (d) => d.toISOString().split("T")[0];

/* ── Item Customiser bottom-sheet ── */
function ItemCustomiser({ item, kioskId, onConfirm, onClose }) {
  const hasVariants = item.variants?.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants ? item.variants[0].id : null,
  );
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(item.sellingPrice || 0);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const fmtLocal = (n) =>
    Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  useEffect(() => {
    setFetchingPrice(true);
    api
      .get(`/library/price/menu/${item.id}`, {
        params: {
          kioskId,
          ...(selectedVariant ? { variantId: selectedVariant } : {}),
          ...(selectedExtras.length ? { "extras[]": selectedExtras } : {}),
        },
      })
      .then((r) => {
        const d = r.data.data;
        setPrice(
          Number(
            d?.sellingPrice ?? d?.price ?? d?.total ?? item.sellingPrice ?? 0,
          ),
        );
      })
      .catch(() => setPrice(item.sellingPrice || 0))
      .finally(() => setFetchingPrice(false));
  }, [selectedVariant, selectedExtras.join(",")]);

  const toggleExtra = (id) =>
    setSelectedExtras((p) =>
      p.includes(id) ? p.filter((e) => e !== id) : [...p, id],
    );
  const totalPrice = price * qty;
  const confirm = () => {
    const variantObj = item.variants?.find((v) => v.id === selectedVariant) || null;
    const extrasObjs = item.extras?.filter((e) => selectedExtras.includes(e.id)) || [];
    onConfirm({
      item,
      qty,
      variantId: selectedVariant,
      extraIds: selectedExtras,
      variantLabel: variantObj?.name || null,
      extrasLabels: extrasObjs.map((e) => e.name),
      unitPrice: price,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 520,
          background: "var(--bg-card)",
          borderRadius: "20px 20px 0 0",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
          animation: "saleSlideUp 0.25s ease",
        }}
      >
        <style>{`@keyframes saleSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border)" }} />
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 8px" }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 20, paddingTop: 4 }}>
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 72, height: 72, borderRadius: 12,
                  background: "var(--bg-hover)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <MdImage size={24} style={{ color: "var(--text-muted)" }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-heading)", marginBottom: 4 }}>
                {item.name}
              </div>
              {item.description && (
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {item.description}
                </div>
              )}
              <div style={{ marginTop: 6, fontSize: "1rem", fontWeight: 900, color: "var(--accent)" }}>
                {fetchingPrice ? (
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Calculating…</span>
                ) : price > 0 ? (
                  `₦${fmtLocal(price)}`
                ) : (
                  "Price TBD"
                )}
              </div>
            </div>
          </div>
          {hasVariants && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10,
                }}
              >
                Choose Variant <span style={{ color: "#ef4444" }}>*</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {item.variants.map((v) => {
                  const active = selectedVariant === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "11px 14px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                        background: active ? "var(--bg-active)" : "var(--bg-hover)",
                        border: `1px solid ${active ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                        transition: "all 0.12s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 18, height: 18, borderRadius: "50%",
                            border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}
                        >
                          {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />}
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: active ? 700 : 500, color: active ? "var(--accent)" : "var(--text-body)" }}>
                          {v.name}
                        </span>
                      </div>
                      {v.priceAddition > 0 && (
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                          +{fmtLocal(v.priceAddition)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            padding: "14px 20px 28px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-card)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex", alignItems: "center",
                border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
              }}
            >
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={{
                  width: 38, height: 42, background: "var(--bg-hover)", border: "none",
                  cursor: "pointer", color: "var(--text-body)", fontSize: "1.2rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >−</button>
              <span
                style={{
                  minWidth: 36, textAlign: "center", fontSize: "0.9rem", fontWeight: 900,
                  color: "var(--text-heading)", borderLeft: "1px solid var(--border)",
                  borderRight: "1px solid var(--border)", lineHeight: "42px",
                }}
              >{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                style={{
                  width: 38, height: 42, background: "var(--bg-hover)", border: "none",
                  cursor: "pointer", color: "var(--text-body)", fontSize: "1.2rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >+</button>
            </div>
            <button
              onClick={confirm}
              className="app_btn app_btn_confirm"
              style={{
                flex: 1, height: 44, display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8, fontSize: "0.9rem", fontWeight: 800,
              }}
            >
              <MdAdd size={17} /> Add to Order{" "}
              {!fetchingPrice && totalPrice > 0 && (
                <span style={{ opacity: 0.85 }}>₦{fmtLocal(totalPrice)}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Record Sale Form ── */
function RecordSaleForm({ kioskId, menuItems, vatRate = 0, onSaved }) {
  const fmtLocal = (n) =>
    Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
  const [cart, setCart] = useState({});
  const [customising, setCustomising] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [saving, setSaving] = useState(false);

  const addToCart = ({ item, qty, variantId, extraIds, variantLabel, extrasLabels, unitPrice }) => {
    const key = [item.id, variantId || "", ...(extraIds || []).sort()].join("_");
    setCart((prev) => ({
      ...prev,
      [key]: prev[key]
        ? { ...prev[key], qty: prev[key].qty + qty }
        : { item, qty, variantId, extraIds, variantLabel, extrasLabels, unitPrice },
    }));
    toast.success(`${item.name} added`, { autoClose: 800 });
  };
  const removeFromCart = (key) =>
    setCart((prev) => { const n = { ...prev }; delete n[key]; return n; });
  const adjustQty = (key, delta) =>
    setCart((prev) => {
      const e = prev[key];
      if (!e) return prev;
      const newQty = e.qty + delta;
      if (newQty <= 0) { const n = { ...prev }; delete n[key]; return n; }
      return { ...prev, [key]: { ...e, qty: newQty } };
    });

  const cartEntries = Object.entries(cart);
  const cartTotal = cartEntries.reduce((s, [, e]) => s + (e.unitPrice || 0) * e.qty, 0);

  const handleSubmit = async () => {
    if (!cartEntries.length) return toast.error("Add at least one item");
    setSaving(true);
    try {
      await api.post("/kiosk/sale", {
        kioskId,
        paymentMethod,
        items: cartEntries.map(([, e]) => ({
          menuItemId: e.item.id,
          quantity: e.qty,
          ...(e.variantId ? { variantId: e.variantId } : {}),
          ...(e.extraIds?.length ? { extras: e.extraIds } : {}),
        })),
      });
      toast.success("Sale recorded!");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record sale");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      {/* Header: title + payment method selector */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-heading)" }}>Record Sale</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
            Tap an item to customise and add
          </div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {["CASH", "POS", "TRANSFER", "OTHER"].map((m) => {
            const col = pmColors[m];
            const active = paymentMethod === m;
            return (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                style={{
                  height: 30,
                  padding: "0 10px",
                  border: `1px solid ${active ? col.border : "var(--border)"}`,
                  borderRadius: 7,
                  cursor: "pointer",
                  background: active ? col.bg : "var(--bg-hover)",
                  color: active ? col.color : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.66rem",
                  fontFamily: "inherit",
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu item grid */}
      <div style={{ padding: "12px 16px", maxHeight: 320, overflowY: "auto" }}>
        {!menuItems?.length ? (
          <div className="kiosk_empty_inline" style={{ padding: "24px 0" }}>
            <MdImage size={22} style={{ opacity: 0.3 }} />
            <span>No menu items available</span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 8,
            }}
          >
            {menuItems.map((item) => {
              const name = item.name || item.menuItem?.name || "Item";
              const img = item.image || item.menuItem?.image;
              const price = item.sellingPrice || item.menuItem?.sellingPrice || 0;
              const inCart = Object.values(cart)
                .filter((e) => e.item.id === item.id)
                .reduce((s, e) => s + e.qty, 0);
              return (
                <button
                  key={item.id}
                  onClick={() => setCustomising(item)}
                  style={{
                    background: inCart > 0 ? "var(--bg-active)" : "var(--bg-hover)",
                    border: `1px solid ${inCart > 0 ? "rgba(203,108,220,0.35)" : "var(--border)"}`,
                    borderRadius: 10,
                    padding: "10px 10px 8px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    position: "relative",
                  }}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={name}
                      style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 7, marginBottom: 7, display: "block" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%", height: 70, borderRadius: 7, background: "var(--bg-card)",
                        border: "1px solid var(--border)", display: "flex", alignItems: "center",
                        justifyContent: "center", marginBottom: 7,
                      }}
                    >
                      <MdImage size={20} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "0.76rem", fontWeight: 700, color: "var(--text-body)",
                      lineHeight: 1.3, marginBottom: 3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >{name}</div>
                  <div
                    style={{
                      fontSize: "0.72rem", fontWeight: 800,
                      color: inCart > 0 ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {price > 0 ? `₦${Number(price).toLocaleString("en-NG", { maximumFractionDigits: 0 })}` : "—"}
                  </div>
                  {inCart > 0 && (
                    <div
                      style={{
                        position: "absolute", top: 6, right: 6,
                        width: 18, height: 18, borderRadius: "50%",
                        background: "var(--accent)", color: "#fff",
                        fontSize: "0.62rem", fontWeight: 900,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >{inCart}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart summary + submit */}
      {cartEntries.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {cartEntries.map(([key, entry]) => (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", background: "var(--bg-hover)", borderRadius: 9,
                }}
              >
                {entry.item.image ? (
                  <img
                    src={entry.item.image}
                    alt=""
                    style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: 6, background: "var(--bg-card)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                  >
                    <MdImage size={12} style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.78rem", fontWeight: 700, color: "var(--text-body)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >{entry.item.name}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                  <button
                    onClick={() => adjustQty(key, -1)}
                    style={{
                      width: 22, height: 22, borderRadius: 5, background: "var(--bg-card)",
                      border: "1px solid var(--border)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--text-muted)", fontSize: "0.9rem",
                    }}
                  >−</button>
                  <span
                    style={{
                      fontSize: "0.78rem", fontWeight: 700, color: "var(--text-heading)",
                      minWidth: 16, textAlign: "center",
                    }}
                  >{entry.qty}</span>
                  <button
                    onClick={() => adjustQty(key, +1)}
                    style={{
                      width: 22, height: 22, borderRadius: 5, background: "var(--bg-card)",
                      border: "1px solid var(--border)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--text-muted)", fontSize: "0.9rem",
                    }}
                  >+</button>
                </div>
                <div
                  style={{
                    fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)",
                    flexShrink: 0, minWidth: 56, textAlign: "right",
                  }}
                >
                  {entry.unitPrice > 0 ? `₦${fmtLocal(entry.unitPrice * entry.qty)}` : "—"}
                </div>
                <button
                  onClick={() => removeFromCart(key)}
                  style={{
                    width: 20, height: 20, borderRadius: 4, background: "none", border: "none",
                    cursor: "pointer", color: "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <MdClose size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ marginBottom: 12 }}>
            {vatRate > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: 700 }}>₦{fmtLocal(cartTotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  <span>VAT ({vatRate}%):</span>
                  <span style={{ fontWeight: 700 }}>₦{fmtLocal(cartTotal * (vatRate / 100))}</span>
                </div>
                <div
                  style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: "0.82rem", borderTop: "1px solid var(--border)",
                    paddingTop: 4, marginTop: 2,
                  }}
                >
                  <span style={{ fontWeight: 800, color: "var(--text-heading)" }}>Total:</span>
                  <span style={{ fontWeight: 900, color: "var(--accent)" }}>₦{fmtLocal(cartTotal + cartTotal * (vatRate / 100))}</span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--accent)" }}>₦{fmtLocal(cartTotal)}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
            style={{
              width: "100%", height: 44, position: "relative",
              fontSize: "0.88rem", fontWeight: 800,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            <span className="btn_text">
              <MdPointOfSale size={16} /> Submit Sale
            </span>
            {saving && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      )}

      {/* Item customiser sheet */}
      {customising && (
        <ItemCustomiser
          item={customising}
          kioskId={kioskId}
          onConfirm={addToCart}
          onClose={() => setCustomising(null)}
        />
      )}
    </div>
  );
}

export default function KioskSales({ cart }) {
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [preset, setPreset] = useState("30d");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISODate(d);
  });
  const [to, setTo] = useState(() => toISODate(new Date()));
  const [showCustom, setShowCustom] = useState(false);

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
    // Always include kioskId so analytics is scoped to this cart
    const params = [`kioskId=${cart.id}`];
    if (from)
      params.push(`startDate=${encodeURIComponent(from + "T00:00:00.000Z")}`);
    if (to) params.push(`endDate=${encodeURIComponent(to + "T23:59:59.999Z")}`);
    return `?${params.join("&")}`;
  };

  const fetchData = () => {
    setLoading(true);
    const q = buildQuery();
    Promise.allSettled([
      api.get(`/kiosk/sale${q}`),
      api.get(`/kiosk/sale/analytics${q}`),
    ])
      .then(([salesRes, analyticsRes]) => {
        if (salesRes.status === "fulfilled") {
          const d = salesRes.value.data.data;
          // Server filters by kioskId — no client-side filter needed
          setSales(Array.isArray(d) ? d : d?.items || []);
        }
        if (analyticsRes.status === "fulfilled") {
          setAnalytics(analyticsRes.value.data.data);
        }
      })
      .catch(() => toast.error("Failed to load sales"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [cart.id, from, to]);

  const totals = analytics?.totals;
  const chartData = (analytics?.chartData || []).map((d) => ({
    ...d,
    sales: Math.round(d.sales),
    profit: Math.round(d.profit),
  }));

  const pmBreakdown = ["CASH", "POS", "TRANSFER", "ONLINE", "OTHER"]
    .map((m) => ({
      method: m,
      count: sales.filter((s) => s.paymentMethod === m).length,
      total: sales
        .filter((s) => s.paymentMethod === m)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0),
    }))
    .filter((m) => m.count > 0);

  const menuItems = cart.menuItems || [];
  const vatRate = cart.vatRate || 0;

  return (
    <div className="kiosk_tab_content">
      {/* Record Sale button */}
      <div style={{ marginBottom: 14 }}>
        <button
          className={`app_btn${showForm ? " app_btn_cancel" : " app_btn_confirm"}`}
          style={{
            height: 40, padding: "0 20px",
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: "0.85rem", fontWeight: 700,
          }}
          onClick={() => setShowForm((v) => !v)}
        >
          <MdAdd size={15} /> {showForm ? "Cancel" : "Record Sale"}
        </button>
      </div>

      {/* Record sale form */}
      {showForm && (
        <RecordSaleForm
          kioskId={cart.id}
          menuItems={menuItems}
          vatRate={vatRate}
          onSaved={() => {
            setShowForm(false);
            fetchData();
          }}
        />
      )}

      {/* Date range filter */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginBottom: showCustom ? 10 : 0,
          }}
        >
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              style={{
                height: 30,
                padding: "0 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                background:
                  preset === p.label ? "var(--bg-active)" : "var(--bg-hover)",
                color:
                  preset === p.label ? "var(--accent)" : "var(--text-muted)",
                borderColor:
                  preset === p.label
                    ? "rgba(203,108,220,0.4)"
                    : "var(--border)",
                fontWeight: 700,
                fontSize: "0.75rem",
                transition: "all 0.15s",
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
              padding: "0 12px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "inherit",
              background:
                preset === "custom" ? "var(--bg-active)" : "var(--bg-hover)",
              color:
                preset === "custom" ? "var(--accent)" : "var(--text-muted)",
              borderColor:
                preset === "custom" ? "rgba(203,108,220,0.4)" : "var(--border)",
              fontWeight: 700,
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <MdCalendarToday size={12} /> Custom
          </button>
          {/* Removed legacy spinner */}
        </div>
        {showCustom && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
      </div>

      {/* Summary cards */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton_shimmer skeleton_rect" style={{ height: 60, borderRadius: 12 }} />
          ))}
        </div>
      ) : totals && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {[
            { label: "Total Revenue", value: totals.totalSales, accent: true },
            {
              label: "Cost of Sales",
              value: totals.totalCostOfSales,
              accent: false,
            },
            {
              label: "Vendor Profit",
              value: totals.vendorProfit,
              accent: false,
            },
            { label: "Owner Profit", value: totals.ownerProfit, accent: false },
            {
              label: "VAT",
              value: totals.totalVat,
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
                  fontSize: "0.65rem",
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

      {/* Chart */}
      {loading ? (
        <div style={{ marginBottom: 20 }}>
          <div className="skeleton_shimmer skeleton_text" style={{ width: "100px", height: "16px", marginBottom: "12px" }} />
          <div className="skeleton_shimmer skeleton_rect" style={{ height: "180px", borderRadius: "12px" }} />
        </div>
      ) : chartData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
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
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
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
                width={42}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#salesGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#profitGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payment breakdown */}
      {pmBreakdown.length > 0 && (
        <div style={{ marginBottom: 20 }}>
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
            By Payment Method
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(pmBreakdown.length, 4)}, 1fr)`,
              gap: 6,
            }}
          >
            {pmBreakdown.map(({ method, count, total }) => {
              const c = pmColors[method] || pmColors.OTHER;
              return (
                <div
                  key={method}
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      color: c.color,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {method}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 900,
                      color: "var(--text-heading)",
                    }}
                  >
                    {count}
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text-muted)",
                      marginTop: 1,
                    }}
                  >
                    ₦{fmt(total)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sales list */}
      <div className="drawer_section_title" style={{ marginBottom: 10 }}>
        Transactions
        <span className="kiosk_section_count" style={{ marginLeft: 8 }}>
          {sales.length}
        </span>
      </div>
      {sales.length === 0 ? (
        <div className="kiosk_empty_inline" style={{ padding: "32px 0" }}>
          <MdPointOfSale size={24} style={{ opacity: 0.3 }} />
          <span>No sales recorded yet</span>
        </div>
      ) : (
        <div>
          {sales.map((sale) => (
            <SaleRow key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  );
}

