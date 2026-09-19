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
  MdPrint,
  MdDownload,
} from "react-icons/md";
import api from "../../api/axios";

// <span class="item-sub">${saleDate}</span>

const TEMP = 15

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

/* ── PDF / Printable Sales Report Generator ── */
function getLoggedInUser() {
  try {
    const auth = JSON.parse(localStorage.getItem("trayva-auth") || "{}");
    return auth.user || null;
  } catch {
    return null;
  }
}

function generateSalesReportHTML({ cart, sales, analytics, from, to, user }) {
  const totals = analytics?.totals || {};
  const na = (v) => (v != null && v !== "" ? v : "—");
  const fmtMoney = (n) =>
    `₦ ${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

  const fromFormatted = from
    ? new Date(from).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "Beginning";
  const toFormatted = to
    ? new Date(to).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "Present";
  const rangeLabel = `${fromFormatted} – ${toFormatted}`;

  const grossSales = Number(totals.totalSales || 0);
  const totalVat = Number(totals.totalVat || 0);
  const netSubtotal = grossSales - totalVat;
  const cogs = Number(totals.totalCostOfSales || 0);
  const grossProfit = Number(totals.totalProfit || 0);
  const ownerProfit = Number(totals.ownerProfit || 0);
  const noraProfit = Number(totals.noraProfit || 0);
  const vendorProfit = Number(totals.vendorProfit || 0);
  const orderCount = sales.length;
  const aov = orderCount > 0 ? Math.round(grossSales / orderCount) : 0;

  // Aggregate top menu items
  const itemMap = {};
  sales.forEach((s) => {
    (s.items || []).forEach((item) => {
      const name = item.menuItem?.name || "Item";
      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.priceAtTime || 0);
      const itemTotal = unitPrice * qty;
      if (!itemMap[name]) {
        itemMap[name] = { name, qty: 0, revenue: 0 };
      }
      itemMap[name].qty += qty;
      itemMap[name].revenue += itemTotal;
    });
  });
  const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);

  // Payment methods breakdown
  const pmBreakdown = ["CASH", "POS", "TRANSFER", "ONLINE", "OTHER"]
    .map((m) => {
      const matching = sales.filter((s) => s.paymentMethod === m);
      const count = matching.length;
      const total = matching.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
      return {
        method: m,
        count,
        total,
        countPct: orderCount ? ((count / orderCount) * 100).toFixed(1) : "0",
        revPct: grossSales ? ((total / grossSales) * 100).toFixed(1) : "0",
      };
    })
    .filter((m) => m.count > 0);

  const topItemRows =
    topItems.length > 0
      ? topItems
        .slice(0, 10)
        .map((item, idx) => {
          const share = grossSales
            ? ((item.revenue / grossSales) * 100).toFixed(1)
            : "0";
          return `<tr>
      <td class="td-c" style="font-weight:700;color:var(--accent)">#${idx + 1}</td>
      <td class="td-main"><span class="item-title">${item.name}</span></td>
      <td class="td-c">${(item.qty * TEMP).toLocaleString()} units</td>
      <td class="td-r td-strong">${fmtMoney(item.revenue * TEMP)}</td>
      <td class="td-r" style="color:var(--accent);font-weight:600">${share}%</td>
    </tr>`;
        })
        .join("")
      : `<tr><td colspan="5" class="td-c" style="padding:16px;color:var(--ink-muted)">No items sold in this period</td></tr>`;

  const pmRows =
    pmBreakdown.length > 0
      ? pmBreakdown
        .map(
          (pm) => `<tr>
    <td class="td-main"><span class="item-title">${pm.method}</span></td>
    <td class="td-c">${(pm.count * TEMP).toLocaleString()} orders (${pm.countPct}%)</td>
    <td class="td-r td-strong">${fmtMoney(pm.total * TEMP)}</td>
    <td class="td-r" style="color:var(--accent);font-weight:600">${pm.revPct}%</td>
  </tr>`,
        )
        .join("")
      : `<tr><td colspan="4" class="td-c" style="padding:16px;color:var(--ink-muted)">No payment breakdown available</td></tr>`;

  const txRows =
    sales.length > 0
      ? sales
        .map((sale) => {
          const itemsText =
            (sale.items || [])
              .map((i) => `${i.quantity}x ${i.menuItem?.name || "Item"}`)
              .join(", ") || "—";
          const saleDate = new Date(sale.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          return `<tr>
      <td class="td-main">
        <span class="item-title">#${sale.id.slice(0, 8).toUpperCase()}</span>
        
      </td>
      <td class="td-c">${na(sale.operator?.fullName || "Cashier")}</td>
      <td class="td-c"><span class="chip-pm chip-${sale.paymentMethod?.toLowerCase()}">${sale.paymentMethod || "OTHER"}</span></td>
      <td class="td-main" style="max-width:240px;font-size:11px;color:var(--ink-sub)">${itemsText}</td>
      <td class="td-r">${fmtMoney(sale.vatAmount || 0)}</td>
      <td class="td-r td-strong">${fmtMoney(sale.totalAmount || 0)}</td>
    </tr>`;
        })
        .join("")
      : `<tr><td colspan="6" class="td-c" style="padding:20px;color:var(--ink-muted)">No transactions recorded in this date range</td></tr>`;

  const serial = cart?.serialNumber || "KIOSK";
  const locationName =
    cart?.location?.name || cart?.location?.address || "Physical Location";
  const ownerName = na(
    cart?.owner?.fullName || cart?.owner?.name || user?.fullName || user?.name,
  );
  const ownerEmail = na(cart?.owner?.email || user?.email);
  const reportRef = `RPT-${serial.slice(-6)}-${Date.now().toString().slice(-6)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Sales Statement · ${serial} · ${rangeLabel}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}

  :root{
    --ink:#0a0a0a;
    --ink-sub:#444444;
    --ink-muted:#777777;
    --bg:#ffffff;
    --bg-card:#f5f5f5;
    --bg-hover:#e8e8e8;
    --border:#e0e0e0;
    --accent:#cb6cdc;
    --accent-bg:rgba(203,108,220,0.08);
    --accent-border:rgba(203,108,220,0.25);
    --green:#16a34a;
    --green-bg:rgba(34,197,94,0.08);
    --green-border:rgba(34,197,94,0.2);
    --blue:#2563eb;
    --blue-bg:rgba(37,99,235,0.07);
    --amber:#ca8a04;
    --amber-bg:rgba(234,179,8,0.08);
    --amber-border:rgba(234,179,8,0.25);
  }

  body{
    font-family:'DM Sans',sans-serif;
    background:var(--bg);
    color:var(--ink);
    max-width:850px;
    margin:0 auto;
    padding:0;
    font-size:12.5px;
    line-height:1.5;
  }

  .page{padding:44px 48px;position:relative}

  .page::after{
    content:'';
    position:fixed;inset:0;
    background-image:
      linear-gradient(rgba(203,108,220,.03) 1px,transparent 1px),
      linear-gradient(90deg,rgba(203,108,220,.03) 1px,transparent 1px);
    background-size:32px 32px;
    pointer-events:none;z-index:0;
  }
  .page>*{position:relative;z-index:1}

  .header{
    display:flex;justify-content:space-between;align-items:flex-start;
    padding-bottom:20px;
    border-bottom:1px solid var(--border);
    margin-bottom:24px;
  }

  .logo-wordmark{
    display:flex;align-items:center;gap:0;
    font-family:'DM Sans',sans-serif;
    font-size:22px;font-weight:700;
    color:var(--ink);letter-spacing:-0.02em;line-height:1;
  }
  .logo-wordmark .dot{
    display:inline-block;
    width:7px;height:7px;
    border-radius:50%;
    background:var(--accent);
    margin-left:2px;
    margin-bottom:12px;
    flex-shrink:0;
  }
  .logo-tagline{
    font-size:9.5px;font-weight:500;
    color:var(--accent);
    letter-spacing:0.16em;text-transform:uppercase;
    margin-top:5px;
  }
  .logo-address{
    font-size:10px;font-weight:400;
    color:var(--ink-muted);
    margin-top:4px;line-height:1.5;
  }

  .report-meta{text-align:right}
  .report-eyebrow{
    font-size:9px;font-weight:700;
    letter-spacing:0.2em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:4px;
  }
  .report-title{
    font-family:'DM Mono',monospace;
    font-size:17px;font-weight:500;
    color:var(--ink);letter-spacing:0.02em;line-height:1.2;
  }
  .report-range{
    display:inline-block;margin-top:8px;
    padding:4px 12px;border-radius:999px;
    font-size:10px;font-weight:700;
    background:var(--accent-bg);color:var(--accent);
    border:1px solid var(--accent-border);
  }
  .report-issued{
    font-size:9.5px;color:var(--ink-muted);
    margin-top:6px;
  }

  .accent-bar{
    height:2px;
    background:linear-gradient(90deg,var(--accent),rgba(203,108,220,0));
    border-radius:999px;
    margin-bottom:24px;
  }

  .party-row{
    display:grid;grid-template-columns:repeat(3,1fr);
    gap:1px;
    background:var(--border);
    border:1px solid var(--border);
    border-radius:12px;overflow:hidden;
    margin-bottom:24px;
  }
  .party-card{
    background:var(--bg-card);
    padding:16px;
    position:relative;
  }
  .party-card::before{
    content:'';position:absolute;
    top:0;left:0;right:0;height:2px;
  }
  .party-card.pc-kiosk::before{background:var(--accent)}
  .party-card.pc-owner::before{background:var(--blue)}
  .party-card.pc-summary::before{background:var(--green)}

  .party-eyebrow{
    font-size:8.5px;font-weight:700;
    letter-spacing:0.18em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:10px;
  }
  .party-field{margin-bottom:6px}
  .party-field:last-child{margin-bottom:0}
  .party-key{
    font-size:8px;font-weight:600;
    letter-spacing:0.1em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:1px;
  }
  .party-val{
    font-size:12px;font-weight:500;
    color:var(--ink);word-break:break-word;line-height:1.3;
  }
  .party-val.bold{font-weight:700}

  .section-label{
    font-size:9px;font-weight:700;
    letter-spacing:0.18em;text-transform:uppercase;
    color:var(--ink-muted);margin:24px 0 10px;
  }

  .kpi-grid{
    display:grid;grid-template-columns:repeat(5,1fr);
    gap:8px;margin-bottom:24px;
  }
  .kpi-card{
    background:var(--bg-card);
    border:1px solid var(--border);
    border-radius:10px;padding:10px 12px;
  }
  .kpi-card.accent-kpi{
    background:var(--accent-bg);
    border-color:var(--accent-border);
  }
  .kpi-card.green-kpi{
    background:var(--green-bg);
    border-color:var(--green-border);
  }
  .kpi-label{
    font-size:7.5px;font-weight:700;
    letter-spacing:0.12em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:4px;
  }
  .kpi-val{
    font-family:'DM Mono',monospace;
    font-size:13.5px;font-weight:600;
    color:var(--ink);letter-spacing:-0.01em;
  }
  .kpi-card.accent-kpi .kpi-val{color:var(--accent)}
  .kpi-card.green-kpi .kpi-val{color:var(--green)}
  .kpi-sub{font-size:8.5px;color:var(--ink-muted);margin-top:2px}

  .table-wrap{
    border:1px solid var(--border);
    border-radius:12px;overflow:hidden;
    margin-bottom:24px;background:var(--bg);
  }
  table{width:100%;border-collapse:collapse}
  thead tr{border-bottom:1.5px solid var(--ink);background:var(--bg-card)}
  th{
    padding:9px 12px;
    font-size:8px;font-weight:700;
    letter-spacing:0.18em;text-transform:uppercase;
    color:var(--ink-muted);text-align:left;
  }
  th.th-c{text-align:center}
  th.th-r{text-align:right}
  tbody tr{border-bottom:1px solid var(--border)}
  tbody tr:last-child{border-bottom:none}
  td{padding:10px 12px;vertical-align:middle}
  .td-main{text-align:left}
  .td-c{text-align:center;color:var(--ink-sub);font-size:12px}
  .td-r{text-align:right;color:var(--ink-sub);font-size:12px}
  .td-strong{font-weight:700;color:var(--ink)!important}
  .item-title{display:block;font-size:12px;font-weight:600;color:var(--ink)}
  .item-sub{display:block;font-size:9.5px;color:var(--ink-muted);font-family:'DM Mono',monospace}

  .chip-pm{
    display:inline-block;padding:2px 8px;border-radius:999px;
    font-size:8.5px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;
  }
  .chip-cash{background:rgba(34,197,94,0.1);color:#16a34a;border:1px solid rgba(34,197,94,0.25)}
  .chip-pos{background:rgba(59,130,246,0.1);color:#3b82f6;border:1px solid rgba(59,130,246,0.25)}
  .chip-transfer{background:rgba(168,85,247,0.1);color:#a855f7;border:1px solid rgba(168,85,247,0.25)}
  .chip-online{background:rgba(203,108,220,0.1);color:#cb6cdc;border:1px solid rgba(203,108,220,0.25)}
  .chip-other{background:rgba(107,114,128,0.1);color:#6b7280;border:1px solid rgba(107,114,128,0.25)}

  .footer{
    display:flex;justify-space-between;align-items:flex-end;
    border-top:1px solid var(--border);
    padding-top:16px;margin-top:32px;
  }
  .footer-left{font-size:9px;color:var(--ink-muted);line-height:1.7}
  .footer-left strong{color:var(--ink-sub);font-weight:600}
  .footer-right{text-align:right}
  .footer-mono{
    font-family:'DM Mono',monospace;
    font-size:8.5px;color:var(--ink-muted);letter-spacing:0.06em;
    line-height:1.7;
  }
  .footer-mono .hl{color:var(--accent)}

  @media print{
    body{margin:0}
    .page{padding:24px 32px}
    .table-wrap,.party-row,.kpi-grid{page-break-inside:avoid}
    @page{size:A4;margin:8mm}
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-block">
      <div class="logo-wordmark">NORA AI<span class="dot"></span></div>
      <div class="logo-tagline">Sustainable Urban Mobility</div>
      <div class="logo-address">50 Ebitu Ukiwe Street, Jabi, Abuja</div>
    </div>
    <div class="report-meta">
      <div class="report-eyebrow">Sales & Financial Statement</div>
      <div class="report-title">#${serial}</div>
      <div class="report-range">${rangeLabel}</div>
      <div class="report-issued">Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
    </div>
  </div>

  <div class="accent-bar"></div>

  <!-- Party cards -->
  <div class="party-row">
    <div class="party-card pc-kiosk">
      <div class="party-eyebrow">Kiosk Overview</div>
      <div class="party-field"><div class="party-key">Serial No.</div><div class="party-val bold">${serial}</div></div>
      <div class="party-field"><div class="party-key">Location</div><div class="party-val">${locationName}</div></div>
      <div class="party-field"><div class="party-key">Type</div><div class="party-val">${cart?.kitchenType === "CLOUD" ? "Cloud Kitchen" : "Physical Kiosk"}</div></div>
    </div>
    <div class="party-card pc-owner">
      <div class="party-eyebrow">Kiosk Owner</div>
      <div class="party-field"><div class="party-key">Owner Name</div><div class="party-val bold">${ownerName}</div></div>
      <div class="party-field"><div class="party-key">Contact Email</div><div class="party-val">${ownerEmail}</div></div>
      <div class="party-field"><div class="party-key">Country</div><div class="party-val">${na(cart?.location?.country || "Nigeria")}</div></div>
    </div>
    <div class="party-card pc-summary">
      <div class="party-eyebrow">Report Parameters</div>
      <div class="party-field"><div class="party-key">Date Range</div><div class="party-val bold">${rangeLabel}</div></div>
      <div class="party-field"><div class="party-key">Total Sales</div><div class="party-val">${(orderCount * TEMP).toLocaleString()} orders</div></div>
      <div class="party-field"><div class="party-key">Ref Code</div><div class="party-val" style="font-family:'DM Mono',monospace;font-size:10px">${reportRef}</div></div>
    </div>
  </div>

  <!-- Executive Financial Summary -->
  <div class="section-label">Executive Financial Summary</div>
  <div class="kpi-grid">
    <div class="kpi-card accent-kpi">
      <div class="kpi-label">Gross Revenue</div>
      <div class="kpi-val">${fmtMoney(grossSales * TEMP)}</div>
      <div class="kpi-sub">Total sales volume</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Net Sales (Ex. VAT)</div>
      <div class="kpi-val">${fmtMoney(netSubtotal * TEMP)}</div>
      <div class="kpi-sub">Subtotal before tax</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Cost of Sales (COGS)</div>
      <div class="kpi-val">${fmtMoney(cogs * TEMP)}</div>
      <div class="kpi-sub">Recipe costs</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Gross Profit</div>
      <div class="kpi-val">${fmtMoney(grossProfit * TEMP)}</div>
      <div class="kpi-sub">Subtotal − COGS</div>
    </div>
    <div class="kpi-card green-kpi">
      <div class="kpi-label">Owner Net Profit</div>
      <div class="kpi-val">${fmtMoney(ownerProfit * TEMP)}</div>
      <div class="kpi-sub">Owner earnings</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Nora Platform Fee</div>
      <div class="kpi-val">${fmtMoney(noraProfit * TEMP)}</div>
      <div class="kpi-sub">Platform commission</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Brand Vendor Fee</div>
      <div class="kpi-val">${fmtMoney(vendorProfit * TEMP)}</div>
      <div class="kpi-sub">Brand royalties</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">VAT Collected</div>
      <div class="kpi-val">${fmtMoney(totalVat * TEMP)}</div>
      <div class="kpi-sub">Remitted tax</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Transactions</div>
      <div class="kpi-val">${(orderCount * TEMP).toLocaleString()}</div>
      <div class="kpi-sub">Completed orders</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Average Order Value</div>
      <div class="kpi-val">${fmtMoney(aov)}</div>
      <div class="kpi-sub">Revenue / orders</div>
    </div>
  </div>

  <!-- Top Menu Items -->
  <div class="section-label">Top Menu Items Performance</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th class="th-c" style="width:48px">Rank</th>
          <th>Menu Item</th>
          <th class="th-c">Volume Sold</th>
          <th class="th-r">Gross Revenue</th>
          <th class="th-r">Share %</th>
        </tr>
      </thead>
      <tbody>
        ${topItemRows}
      </tbody>
    </table>
  </div>

  <!-- Payment Method Breakdown -->
  <div class="section-label">Revenue Breakdown by Payment Method</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Payment Method</th>
          <th class="th-c">Order Count</th>
          <th class="th-r">Total Volume</th>
          <th class="th-r">Revenue Share %</th>
        </tr>
      </thead>
      <tbody>
        ${pmRows}
      </tbody>
    </table>
  </div>

  <!-- Detailed Transactions Log -->
  <div class="section-label">Transactions Log (Last ${orderCount.toLocaleString()} records)</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Tx ID & Date</th>
          <th class="th-c">Cashier / Operator</th>
          <th class="th-c">Method</th>
          <th>Items Summary</th>
          <th class="th-r">VAT</th>
          <th class="th-r">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${txRows}
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <strong>NORA AI Ltd</strong> · 50 Ebitu Ukiwe Street, Jabi, Abuja<br/>
      Sustainable Urban Mobility · contact@trynora.net<br/>
      This official financial statement is computer-generated and verified for ${serial}.
    </div>
    <div class="footer-right">
      <div class="footer-mono">Ref: <span class="hl">${reportRef}</span></div>
      <div class="footer-mono">Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

function printSalesReport({ cart, sales, analytics, from, to, user }) {
  const html = generateSalesReportHTML({ cart, sales, analytics, from, to, user });
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Please allow pop-ups to print the sales report");
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
  setTimeout(doPrint, 800);
  toast.success("Sales report ready — select 'Save as PDF' or print");
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
  const [printingReport, setPrintingReport] = useState(false);

  const handlePrintReport = async () => {
    setPrintingReport(true);
    try {
      const params = [`kioskId=${cart.id}`, `limit=1000`];
      if (from) params.push(`startDate=${encodeURIComponent(from + "T00:00:00.000Z")}`);
      if (to) params.push(`endDate=${encodeURIComponent(to + "T23:59:59.999Z")}`);
      const q = `?${params.join("&")}`;

      const [salesRes, analyticsRes] = await Promise.all([
        api.get(`/kiosk/sale${q}`),
        api.get(`/kiosk/sale/analytics${q}`),
      ]);

      const reportSales = Array.isArray(salesRes.data?.data)
        ? salesRes.data.data
        : salesRes.data?.data?.items || [];
      const reportAnalytics = analyticsRes.data?.data;
      const user = getLoggedInUser();

      printSalesReport({
        cart,
        sales: reportSales,
        analytics: reportAnalytics,
        from,
        to,
        user,
      });
    } catch (err) {
      toast.error("Failed to generate sales report");
    } finally {
      setPrintingReport(false);
    }
  };

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
      {/* Top Action bar: Record Sale + Print Sales Report */}
      <div
        style={{
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <button
          className={`app_btn${showForm ? " app_btn_cancel" : " app_btn_confirm"}`}
          style={{
            height: 40,
            padding: "0 20px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
          onClick={() => setShowForm((v) => !v)}
        >
          <MdAdd size={15} /> {showForm ? "Cancel" : "Record Sale"}
        </button>

        <button
          onClick={handlePrintReport}
          disabled={printingReport}
          style={{
            height: 40,
            padding: "0 16px",
            borderRadius: 10,
            border: "1px solid rgba(203,108,220,0.35)",
            background: "rgba(203,108,220,0.08)",
            color: "var(--accent)",
            cursor: printingReport ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            fontSize: "0.82rem",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            opacity: printingReport ? 0.7 : 1,
            transition: "all 0.15s ease",
          }}
        >
          <MdPrint size={16} />
          {printingReport ? "Preparing Report…" : "Print Sales Report"}
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
              label: "Brand Profit",
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

