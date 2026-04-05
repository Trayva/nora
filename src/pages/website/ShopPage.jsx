import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MdSearch,
  MdClose,
  MdAdd,
  MdRemove,
  MdImage,
  MdLocationOn,
  MdExpandMore,
  MdExpandLess,
  MdArrowBack,
  MdCheckCircle,
  MdOutlineShoppingBag,
  MdChevronRight,
  MdOutlineLightMode,
  MdOutlineDarkMode,
  MdOutlineReceiptLong,
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";
import api from "../../api/axios";
import { useTheme } from "../../contexts/ThemeContext";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

/* ─────────────────────────────────────────────────────────────
   ITEM CUSTOMISER MODAL
   ───────────────────────────────────────────────────────────── */
function ItemModal({ item, concept, onClose, onConfirm }) {
  const hasVariants = item.variants?.length > 0;
  const hasExtras = item.extras?.length > 0;

  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants ? item.variants[0].id : null,
  );
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(item.sellingPrice || 0);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      setFetchingPrice(true);
      try {
        const params = { cartId: concept.cartId };
        if (selectedVariant) params.variantId = selectedVariant;
        if (selectedExtras.length) params["extras"] = selectedExtras;
        const r = await api.get(`/library/price/menu/${item.id}`, { params });
        const d = r.data.data;
        setPrice(
          Number(
            d?.sellingPrice ?? d?.price ?? d?.total ?? item.sellingPrice ?? 0,
          ),
        );
      } catch {
        setPrice(item.sellingPrice || 0);
      } finally {
        setFetchingPrice(false);
      }
    };
    fetchPrice();
  }, [selectedVariant, selectedExtras.join(",")]);

  const toggleExtra = (id) =>
    setSelectedExtras((p) =>
      p.includes(id) ? p.filter((e) => e !== id) : [...p, id],
    );
  const totalPrice = price * qty;

  const handleConfirm = () => {
    const variantObj =
      item.variants?.find((v) => v.id === selectedVariant) || null;
    const extrasObjs =
      item.extras?.filter((e) => selectedExtras.includes(e.id)) || [];
    onConfirm({
      item,
      cartId: concept.cartId,
      conceptName: concept.name,
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
        zIndex: 1100,
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
          animation: "shopSlideUp 0.25s ease",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        }}
      >
        <style>{`@keyframes shopSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0 4px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: "var(--border)",
            }}
          />
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 8px" }}>
          {/* Item header */}
          <div
            style={{
              display: "flex",
              gap: 14,
              marginBottom: 20,
              paddingTop: 4,
            }}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 12,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 12,
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MdImage size={24} style={{ color: "var(--text-muted)" }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "var(--text-heading)",
                  marginBottom: 4,
                }}
              >
                {item.name}
              </div>
              {item.description && (
                <div
                  style={{
                    fontSize: "0.76rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {item.description}
                </div>
              )}
              <div
                style={{
                  marginTop: 6,
                  fontSize: "1rem",
                  fontWeight: 900,
                  color: "var(--accent)",
                }}
              >
                {fetchingPrice ? (
                  <span
                    style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
                  >
                    Fetching price…
                  </span>
                ) : price > 0 ? (
                  `₦${fmt(price)}`
                ) : (
                  "Price TBD"
                )}
              </div>
            </div>
          </div>

          {/* Variants */}
          {hasVariants && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
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
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "11px 14px",
                        borderRadius: 11,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        background: active
                          ? "var(--bg-active)"
                          : "var(--bg-hover)",
                        border: `1px solid ${active ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                        transition: "all 0.12s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {active && (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "var(--accent)",
                              }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: active ? 700 : 500,
                            color: active
                              ? "var(--accent)"
                              : "var(--text-body)",
                          }}
                        >
                          {v.name}
                        </span>
                      </div>
                      {v.priceAddition > 0 && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                          }}
                        >
                          +₦{fmt(v.priceAddition)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras */}
          {hasExtras && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                Extras{" "}
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (optional)
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {item.extras.map((ex) => {
                  const active = selectedExtras.includes(ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => toggleExtra(ex.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "11px 14px",
                        borderRadius: 11,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        background: active
                          ? "var(--bg-active)"
                          : "var(--bg-hover)",
                        border: `1px solid ${active ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                        transition: "all 0.12s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
                            background: active
                              ? "var(--accent)"
                              : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {active && (
                            <MdCheckCircle
                              size={12}
                              style={{ color: "#fff" }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: active ? 700 : 500,
                            color: active
                              ? "var(--accent)"
                              : "var(--text-body)",
                          }}
                        >
                          {ex.name}
                        </span>
                      </div>
                      {ex.priceAddition > 0 && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                          }}
                        >
                          +₦{fmt(ex.priceAddition)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
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
                display: "flex",
                alignItems: "center",
                border: "1px solid var(--border)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                style={{
                  width: 38,
                  height: 42,
                  background: "var(--bg-hover)",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-body)",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                −
              </button>
              <span
                style={{
                  minWidth: 36,
                  textAlign: "center",
                  fontSize: "0.9rem",
                  fontWeight: 900,
                  color: "var(--text-heading)",
                  borderLeft: "1px solid var(--border)",
                  borderRight: "1px solid var(--border)",
                  lineHeight: "42px",
                }}
              >
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                style={{
                  width: 38,
                  height: 42,
                  background: "var(--bg-hover)",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-body)",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
            <button
              onClick={handleConfirm}
              className="app_btn app_btn_confirm"
              style={{
                flex: 1,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: "0.9rem",
                fontWeight: 800,
              }}
            >
              <LuShoppingCart size={17} />
              Add to Cart
              {!fetchingPrice && totalPrice > 0 && (
                <span style={{ opacity: 0.85 }}>· ₦{fmt(totalPrice)}</span>
              )}
              {fetchingPrice && (
                <span
                  style={{
                    width: 13,
                    height: 13,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "shopSpin 0.7s linear infinite",
                  }}
                />
              )}
              <style>{`@keyframes shopSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Menu item card ── */
function MenuItemCard({ item, concept, cartItems, onOpenModal }) {
  const totalQty = Object.values(cartItems)
    .filter((e) => e.item.id === item.id)
    .reduce((s, e) => s + e.qty, 0);
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${totalQty > 0 ? "rgba(203,108,220,0.35)" : "var(--border)"}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.15s",
      }}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: "100%",
            height: 110,
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            height: 110,
            background: "var(--bg-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MdImage
            size={28}
            style={{ color: "var(--text-muted)", opacity: 0.4 }}
          />
        </div>
      )}
      <div
        style={{
          padding: "10px 12px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 800,
            color: "var(--text-heading)",
            marginBottom: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </div>
        {item.description && (
          <div
            style={{
              fontSize: "0.66rem",
              color: "var(--text-muted)",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            {item.description}
          </div>
        )}
        {(item.variants?.length > 0 || item.extras?.length > 0) && (
          <div
            style={{
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            {item.variants?.length > 0 && (
              <span
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                {item.variants.length} variant
                {item.variants.length !== 1 ? "s" : ""}
              </span>
            )}
            {item.extras?.length > 0 && (
              <span
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                {item.extras.length} extra{item.extras.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: "auto",
          }}
        >
          <span
            style={{
              fontSize: item.sellingPrice > 0 ? "0.88rem" : "0.72rem",
              fontWeight: item.sellingPrice > 0 ? 900 : 400,
              color:
                item.sellingPrice > 0 ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {item.sellingPrice > 0
              ? `₦${fmt(item.sellingPrice)}`
              : "Tap to price"}
          </span>
          <button
            onClick={() => onOpenModal(item)}
            className="icart_icon_action_btn"
            style={{
              width: 30,
              height: 30,
              flexShrink: 0,
              background: totalQty > 0 ? "var(--accent)" : "var(--bg-active)",
              borderColor: "rgba(203,108,220,0.3)",
              color: totalQty > 0 ? "#fff" : "var(--accent)",
            }}
          >
            {totalQty > 0 ? (
              <span style={{ fontSize: "0.72rem", fontWeight: 900 }}>
                {totalQty}
              </span>
            ) : (
              <MdAdd size={15} />
            )}
          </button>
        </div>
      </div>
      {totalQty > 0 && (
        <div style={{ height: 2, background: "var(--accent)", opacity: 0.6 }} />
      )}
    </div>
  );
}

/* ── Concept section ── */
function ConceptSection({ concept, cartItems, onOpenModal }) {
  const [open, setOpen] = useState(true);
  const items = concept.menu || [];
  const activeCount = items.filter((m) =>
    Object.values(cartItems).some((e) => e.item.id === m.id),
  ).length;
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: open ? 12 : 0,
          cursor: "pointer",
          padding: "10px 0",
        }}
      >
        {concept?.vendor?.brandLogo ? (
          <img
            src={concept.vendor.brandLogo}
            alt=""
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              objectFit: "cover",
              flexShrink: 0,
              border: "1px solid var(--border)",
            }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--bg-active)",
              border: "1px solid rgba(203,108,220,0.2)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "1.2rem",
            }}
          >
            🍽️
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "0.92rem",
                fontWeight: 800,
                color: "var(--text-heading)",
              }}
            >
              {concept?.vendor?.businessName}
            </span>
            {activeCount > 0 && (
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  padding: "1px 7px",
                  borderRadius: 999,
                  background: "rgba(203,108,220,0.1)",
                  color: "var(--accent)",
                  border: "1px solid rgba(203,108,220,0.25)",
                }}
              >
                {activeCount} in cart
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {items.length} item{items.length !== 1 ? "s" : ""}
            {concept.distance != null ? ` · ${concept.distance} km` : ""}
            {concept.deliveryTime != null
              ? ` · ~${concept.deliveryTime} min`
              : ""}
          </div>
        </div>
        {open ? (
          <MdExpandLess
            size={18}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        ) : (
          <MdExpandMore
            size={18}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        )}
      </div>
      {open && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              concept={concept}
              cartItems={cartItems}
              onOpenModal={onOpenModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Checkout form (inside cart drawer) ── */
function CheckoutForm({ cartId, conceptName, items, onSuccess, onBack }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
  });
  const [placing, setPlacing] = useState(false);
  const total = items.reduce(
    (s, e) => s + (e.unitPrice || e.item.sellingPrice || 0) * e.qty,
    0,
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const place = async () => {
    if (form.customerName.trim().length < 2)
      return toast.error("Enter your name");
    if (form.deliveryAddress.trim().length < 5)
      return toast.error("Enter your delivery address");
    setPlacing(true);
    try {
      const res = await api.post("/icart/shop/order", {
        cartId,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        customerPhone: form.customerPhone.trim() || undefined,
        deliveryAddress: form.deliveryAddress.trim(),
        items: items.map((e) => ({
          menuItemId: e.item.id,
          quantity: e.qty,
          ...(e.variantId ? { variantId: e.variantId } : {}),
          ...(e.extraIds?.length ? { extras: e.extraIds } : {}),
        })),
      });
      const orderData = res.data.data;
      onSuccess(orderData);
      // Navigate to order tracking page
      navigate(`/shop/order?id=${orderData.orderNumber}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          fontSize: "0.78rem",
          fontWeight: 600,
          padding: "0 0 14px",
          fontFamily: "inherit",
        }}
      >
        <MdArrowBack size={14} /> Back to cart
      </button>
      <div
        style={{
          fontSize: "0.88rem",
          fontWeight: 800,
          color: "var(--text-heading)",
          marginBottom: 4,
        }}
      >
        Checkout — {conceptName}
      </div>
      <div
        style={{
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          marginBottom: 16,
        }}
      >
        Enter your details to place the order
      </div>

      {/* Summary */}
      <div
        style={{
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          borderRadius: 11,
          padding: "10px 14px",
          marginBottom: 16,
        }}
      >
        {items.map((entry, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.78rem",
              padding: "3px 0",
            }}
          >
            <span
              style={{
                color: "var(--text-body)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                paddingRight: 8,
              }}
            >
              {entry.item.name}
              {entry.variantLabel && (
                <span style={{ color: "var(--text-muted)" }}>
                  {" "}
                  · {entry.variantLabel}
                </span>
              )}
              {entry.extrasLabels?.length > 0 && (
                <span style={{ color: "var(--text-muted)" }}>
                  {" "}
                  + {entry.extrasLabels.join(", ")}
                </span>
              )}
              <span style={{ color: "var(--text-muted)" }}> × {entry.qty}</span>
            </span>
            <span
              style={{
                fontWeight: 700,
                color: "var(--text-heading)",
                flexShrink: 0,
              }}
            >
              {entry.unitPrice > 0
                ? `₦${fmt(entry.unitPrice * entry.qty)}`
                : "—"}
            </span>
          </div>
        ))}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            marginTop: 8,
            paddingTop: 8,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.78rem", color: "var(--text-body)" }}>
            Total
          </span>
          <span
            style={{
              fontSize: "0.92rem",
              fontWeight: 900,
              color: "var(--accent)",
            }}
          >
            ₦{fmt(total)}
          </span>
        </div>
      </div>

      {[
        {
          k: "customerName",
          l: "Your Name *",
          t: "text",
          p: "e.g. Amina Yusuf",
        },
        {
          k: "customerPhone",
          l: "Phone Number",
          t: "tel",
          p: "e.g. 0812 345 6789",
        },
        {
          k: "customerEmail",
          l: "Email (optional)",
          t: "email",
          p: "your@email.com",
        },
        {
          k: "deliveryAddress",
          l: "Delivery Address *",
          t: "text",
          p: "Street, Estate, City",
        },
      ].map(({ k, l, t, p }) => (
        <div key={k} className="form-field" style={{ marginBottom: 10 }}>
          <label className="modal-label">{l}</label>
          <input
            className="modal-input"
            type={t}
            placeholder={p}
            value={form[k]}
            onChange={(e) => set(k, e.target.value)}
          />
        </div>
      ))}

      <button
        onClick={place}
        disabled={placing}
        className={`app_btn app_btn_confirm${placing ? " btn_loading" : ""}`}
        style={{
          width: "100%",
          height: 44,
          position: "relative",
          marginTop: 4,
        }}
      >
        <span className="btn_text">
          <MdCheckCircle size={16} /> Place Order
        </span>
        {placing && (
          <span className="btn_loader" style={{ width: 14, height: 14 }} />
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CART DRAWER — strictly grouped by cartId
   Each cartId = one iCart = one separate checkout
   ───────────────────────────────────────────────────────────── */
function CartDrawer({ cartItems, setCartItems, open, onClose }) {
  const [checkoutCartId, setCheckoutCartId] = useState(null);
  const [orderedCarts, setOrderedCarts] = useState(new Set());

  // Build groups: { [cartId]: { cartId, conceptName, items: [] } }
  // Items with same cartId but different concepts still merge under one iCart group
  const groupMap = Object.entries(cartItems).reduce((acc, [key, entry]) => {
    const { cartId, conceptName } = entry;
    if (!acc[cartId])
      acc[cartId] = { cartId, conceptName, items: [], keys: [] };
    acc[cartId].items.push(entry);
    acc[cartId].keys.push(key);
    return acc;
  }, {});
  const groups = Object.values(groupMap);

  const totalItems = Object.values(cartItems).reduce((s, e) => s + e.qty, 0);

  const removeItem = (key) =>
    setCartItems((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  const clearCart = (cartId) =>
    setCartItems((prev) => {
      const n = { ...prev };
      Object.keys(n).forEach((k) => {
        if (n[k].cartId === cartId) delete n[k];
      });
      return n;
    });

  const checkoutGroup = groups.find((g) => g.cartId === checkoutCartId) || null;

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000 }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(460px, 100vw)",
          background: "var(--bg-card)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.18)",
          animation: "shopSlideRight 0.25s ease",
        }}
      >
        <style>{`@keyframes shopSlideRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <LuShoppingCart size={18} style={{ color: "var(--accent)" }} />
          <span
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              flex: 1,
            }}
          >
            {checkoutGroup
              ? `Checkout — ${checkoutGroup.conceptName}`
              : "Your Cart"}
          </span>
          {!checkoutGroup && totalItems > 0 && (
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(203,108,220,0.1)",
                color: "var(--accent)",
                border: "1px solid rgba(203,108,220,0.25)",
              }}
            >
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={() => {
              if (checkoutGroup) setCheckoutCartId(null);
              else onClose();
            }}
            className="icart_icon_action_btn"
            style={{ width: 28, height: 28 }}
          >
            {checkoutGroup ? <MdArrowBack size={14} /> : <MdClose size={14} />}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Empty state */}
          {totalItems === 0 && (
            <div className="icart_empty_state" style={{ padding: "60px 0" }}>
              <LuShoppingCart size={28} style={{ opacity: 0.25 }} />
              <p className="icart_empty_title">Your cart is empty</p>
              <p className="icart_empty_sub">
                Add items from the menu to get started.
              </p>
            </div>
          )}

          {/* Checkout form for selected iCart */}
          {checkoutGroup && (
            <CheckoutForm
              cartId={checkoutGroup.cartId}
              conceptName={checkoutGroup.conceptName}
              items={checkoutGroup.items}
              onSuccess={(orderData) => {
                setOrderedCarts(
                  (prev) => new Set([...prev, checkoutGroup.cartId]),
                );
                clearCart(checkoutGroup.cartId);
                setCheckoutCartId(null);
              }}
              onBack={() => setCheckoutCartId(null)}
            />
          )}

          {/* All iCart groups — shown when not in checkout */}
          {!checkoutGroup && totalItems > 0 && (
            <>
              {groups.length > 1 && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "rgba(203,108,220,0.06)",
                    border: "1px solid rgba(203,108,220,0.15)",
                    borderRadius: 9,
                    marginBottom: 16,
                    fontSize: "0.74rem",
                    color: "var(--accent)",
                    fontWeight: 600,
                  }}
                >
                  You have items from {groups.length} different iCarts — each
                  has its own checkout.
                </div>
              )}

              {groups.map((group, gi) => {
                const groupTotal = group.items.reduce(
                  (s, e) =>
                    s + (e.unitPrice || e.item.sellingPrice || 0) * e.qty,
                  0,
                );
                const isOrdered = orderedCarts.has(group.cartId);

                return (
                  <div key={group.cartId} style={{ marginBottom: 24 }}>
                    {/* iCart header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                        padding: "8px 10px",
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                      }}
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
                        <LuShoppingCart
                          size={14}
                          style={{ color: "var(--accent)" }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            color: "var(--text-heading)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {group.conceptName}
                        </div>
                        <div
                          style={{
                            fontSize: "0.62rem",
                            color: "var(--text-muted)",
                            fontFamily: "monospace",
                          }}
                        >
                          iCart #{group.cartId.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                      {isOrdered && (
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: 999,
                            background: "rgba(34,197,94,0.1)",
                            color: "#16a34a",
                            border: "1px solid rgba(34,197,94,0.25)",
                          }}
                        >
                          ✓ Ordered
                        </span>
                      )}
                    </div>

                    {/* Items in this iCart */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginBottom: 12,
                      }}
                    >
                      {group.items.map((entry, ei) => {
                        const entryKey = group.keys[ei];
                        return (
                          <div
                            key={entryKey}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px 10px",
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                              borderRadius: 10,
                            }}
                          >
                            {entry.item.image ? (
                              <img
                                src={entry.item.image}
                                alt=""
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 8,
                                  objectFit: "cover",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 8,
                                  background: "var(--bg-hover)",
                                  border: "1px solid var(--border)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <MdImage
                                  size={14}
                                  style={{ color: "var(--text-muted)" }}
                                />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  color: "var(--text-body)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {entry.item.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.66rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {entry.variantLabel &&
                                  `${entry.variantLabel} · `}
                                {entry.extrasLabels?.length > 0 &&
                                  `+${entry.extrasLabels.join(", ")} · `}
                                × {entry.qty}
                                {entry.unitPrice > 0 &&
                                  ` · ₦${fmt(entry.unitPrice * entry.qty)}`}
                              </div>
                            </div>
                            <button
                              onClick={() => removeItem(entryKey)}
                              className="icart_icon_action_btn"
                              style={{ width: 24, height: 24, flexShrink: 0 }}
                            >
                              <MdClose size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Subtotal + checkout button for THIS iCart */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "var(--bg-active)",
                        border: "1px solid rgba(203,108,220,0.18)",
                        borderRadius: 11,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "0.6rem",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 2,
                          }}
                        >
                          Subtotal
                        </div>
                        <div
                          style={{
                            fontSize: "1rem",
                            fontWeight: 900,
                            color:
                              groupTotal > 0
                                ? "var(--accent)"
                                : "var(--text-muted)",
                          }}
                        >
                          {groupTotal > 0 ? `₦${fmt(groupTotal)}` : "Price TBD"}
                        </div>
                      </div>
                      {!isOrdered && (
                        <button
                          onClick={() => setCheckoutCartId(group.cartId)}
                          className="app_btn app_btn_confirm"
                          style={{
                            height: 38,
                            padding: "0 18px",
                            fontSize: "0.8rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          Checkout <MdChevronRight size={15} />
                        </button>
                      )}
                    </div>

                    {gi < groups.length - 1 && (
                      <div
                        style={{
                          borderBottom: "1px dashed var(--border)",
                          marginTop: 20,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN SHOP PAGE
   ───────────────────────────────────────────────────────────── */
export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  const lat = parseFloat(searchParams.get("lat") || "9.0579");
  const lng = parseFloat(searchParams.get("lng") || "7.4951");

  useEffect(() => {
    setLoading(true);
    api
      .get("/icart/shop/nearby", { params: { lat, lng } })
      .then((r) => {
        const d = r.data.data;
        console.log(r)
        setConcepts(Array.isArray(d) ? d : d?.carts || []);
      })
      .catch(() => toast.error("Failed to load nearby carts"))
      .finally(() => setLoading(false));
  }, [lat, lng]);

  const handleAddToCart = (entry) => {
    const key = [
      entry.item.id,
      entry.variantId || "",
      ...(entry.extraIds || []).sort(),
    ].join("_");
    setCartItems((prev) => ({
      ...prev,
      [key]: prev[key]
        ? { ...prev[key], qty: prev[key].qty + entry.qty }
        : entry,
    }));
    toast.success(`${entry.item.name} added`, { autoClose: 1000 });
  };

  const filtered = search.trim()
    ? concepts.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.menu?.some((m) =>
          m.name.toLowerCase().includes(search.toLowerCase()),
        ),
    )
    : concepts;

  const totalItems = Object.values(cartItems).reduce((s, e) => s + e.qty, 0);
  const totalPrice = Object.values(cartItems).reduce(
    (s, e) => s + (e.unitPrice || e.item.sellingPrice || 0) * e.qty,
    0,
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      <style>{`
        @media (max-width: 600px) {
          .shop-header-inner { padding: 0 16px !important; }
          .shop-content { padding: 20px 16px 100px !important; }
          .shop-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; }
        }
      `}</style>
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
              Shop
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
          {/* Track order icon */}
          <button
            onClick={() => navigate("/shop/order")}
            className="icart_icon_action_btn"
            style={{ width: 34, height: 34 }}
            title="Track an order"
          >
            <MdOutlineReceiptLong size={17} />
          </button>
          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            style={{
              position: "relative",
              height: 36,
              padding: "0 14px",
              borderRadius: 10,
              background:
                totalItems > 0 ? "var(--bg-active)" : "var(--bg-hover)",
              border: `1px solid ${totalItems > 0 ? "rgba(203,108,220,0.35)" : "var(--border)"}`,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: "0.78rem",
              color: totalItems > 0 ? "var(--accent)" : "var(--text-muted)",
              transition: "all 0.15s",
            }}
          >
            <LuShoppingCart size={15} />
            <span>
              {totalItems > 0 ? `${totalItems} · ₦${fmt(totalPrice)}` : "Cart"}
            </span>
            {totalItems > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  border: "2px solid var(--bg-main, var(--bg-card))",
                  fontSize: "0.55rem",
                  fontWeight: 900,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <div
        className="shop-content"
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "28px 40px 100px",
          boxSizing: "border-box",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <MdSearch
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            className="modal-input"
            style={{ paddingLeft: 36, marginBottom: 0 }}
            placeholder="Search food or dishes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
              }}
            >
              <MdClose size={14} />
            </button>
          )}
        </div>

        {/* Concepts */}
        {loading ? (
          <div>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <div
                  style={{
                    height: 18,
                    width: 180,
                    borderRadius: 6,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    marginBottom: 12,
                  }}
                />
                <div
                  className="shop-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 10,
                  }}
                >
                  {[0, 1, 2, 3].map((j) => (
                    <div
                      key={j}
                      style={{
                        height: 190,
                        borderRadius: 12,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="icart_empty_state" style={{ padding: "60px 0" }}>
            <MdOutlineShoppingBag size={28} style={{ opacity: 0.25 }} />
            <p className="icart_empty_title">
              {search ? "No results found" : "No carts nearby"}
            </p>
            <p className="icart_empty_sub">
              {search
                ? "Try a different term."
                : "Try adjusting your location or check back later."}
            </p>
          </div>
        ) : (
          filtered.map((concept) => (
            <ConceptSection
              key={concept.id}
              concept={concept}
              cartItems={cartItems}
              onOpenModal={(item) => setModalItem({ item, concept })}
            />
          ))
        )}
      </div>

      {/* Floating cart bar (mobile friendly) */}
      {totalItems > 0 && !cartOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 150,
            pointerEvents: "none",
          }}
        >
          <button
            onClick={() => setCartOpen(true)}
            className="app_btn app_btn_confirm"
            style={{
              height: 48,
              padding: "0 24px",
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: "0.88rem",
              fontWeight: 800,
              boxShadow: "0 4px 24px rgba(203,108,220,0.35)",
              pointerEvents: "all",
              whiteSpace: "nowrap",
            }}
          >
            <LuShoppingCart size={18} />
            View Cart · {totalItems} item{totalItems !== 1 ? "s" : ""}
            {totalPrice > 0 && (
              <span style={{ opacity: 0.85 }}>· ₦{fmt(totalPrice)}</span>
            )}
          </button>
        </div>
      )}

      {/* Item modal */}
      {modalItem && (
        <ItemModal
          item={modalItem.item}
          concept={modalItem.concept}
          onClose={() => setModalItem(null)}
          onConfirm={handleAddToCart}
        />
      )}

      {/* Cart drawer */}
      <CartDrawer
        cartItems={cartItems}
        setCartItems={setCartItems}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </div>
  );
}
