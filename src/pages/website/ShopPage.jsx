import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
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
  MdOpenInNew,
  MdOutlineShoppingBag,
  MdChevronRight,
  MdOutlineLightMode,
  MdOutlineDarkMode,
  MdOutlineReceiptLong,
  MdStorefront,
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";
import api from "../../api/axios";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

const formatKioskPrice = (amount, currency = "NGN") => {
  const n = Number(amount || 0);
  const curr = (currency || "NGN").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: curr === "NGN" ? 0 : 2,
    }).format(n);
  } catch {
    return `${curr} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
};

/* ─────────────────────────────────────────────────────────────
   ITEM CUSTOMISER MODAL
   ───────────────────────────────────────────────────────────── */
function ItemModal({ item, concept, onClose, onConfirm }) {
  const kioskCurrency = concept?.location?.state?.currency || concept?.currency || "NGN";
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
        const params = { kioskId: concept.id };
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
      kioskId: concept?.id || concept?.kioskId || "",
      conceptName: concept?.vendor?.businessName || concept?.name || concept?.conceptName || "Kiosk",
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
                  formatKioskPrice(price, kioskCurrency)
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
                          +{formatKioskPrice(v.priceAddition, kioskCurrency)}
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
                          +{formatKioskPrice(ex.priceAddition, kioskCurrency)}
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
                <span style={{ opacity: 0.85 }}>· {formatKioskPrice(totalPrice, kioskCurrency)}</span>
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
  const kioskCurrency = concept?.location?.state?.currency || concept?.currency || "NGN";
  const totalQty = Object.values(cartItems)
    .filter((e) => e.item.id === item.id)
    .reduce((s, e) => s + e.qty, 0);
  const isAvailable = item.available !== false;

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
        position: "relative",
        opacity: isAvailable ? 1 : 0.65,
      }}
    >
      {!isAvailable && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "rgba(239, 68, 68, 0.9)",
            color: "#fff",
            fontSize: "0.62rem",
            fontWeight: 800,
            padding: "3px 8px",
            borderRadius: 6,
            zIndex: 2,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          Unavailable
        </div>
      )}

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
              ? formatKioskPrice(item.sellingPrice, kioskCurrency)
              : "Tap to price"}
          </span>
          <button
            onClick={() => isAvailable && onOpenModal(item)}
            disabled={!isAvailable}
            className="kiosk_icon_action_btn"
            style={{
              width: 30,
              height: 30,
              flexShrink: 0,
              background: !isAvailable
                ? "var(--bg-hover)"
                : totalQty > 0
                  ? "var(--accent)"
                  : "var(--bg-active)",
              borderColor: !isAvailable ? "var(--border)" : "rgba(203,108,220,0.3)",
              color: !isAvailable
                ? "var(--text-muted)"
                : totalQty > 0
                  ? "#fff"
                  : "var(--accent)",
              cursor: isAvailable ? "pointer" : "not-allowed",
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

/* ── Map events listener helper ── */
function MapEventsListener({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("click", (e) => {
      if (e.latLng) {
        onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    });
    return () => {
      if (window.google) {
        window.google.maps.event.clearListeners(map, "click");
      }
    };
  }, [map, onMapClick]);
  return null;
}

/* ── Address autocomplete input component ── */
function AddressAutocompleteInput({ value, onChange, onPlaceSelected, style }) {
  const inputRef = useRef(null);
  const placesLibrary = useMapsLibrary("places");
  const [autocomplete, setAutocomplete] = useState(null);

  useEffect(() => {
    if (!placesLibrary || !inputRef.current) return;

    const gAutocomplete = new placesLibrary.Autocomplete(inputRef.current);
    setAutocomplete(gAutocomplete);

    return () => {
      if (placesLibrary.event) {
        placesLibrary.event.clearInstanceListeners(gAutocomplete);
      }
    };
  }, [placesLibrary]);

  useEffect(() => {
    if (!autocomplete) return;

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      onPlaceSelected(place);
    });

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [autocomplete, onPlaceSelected]);

  return (
    <input
      ref={inputRef}
      className="modal-input"
      type="text"
      placeholder="Search delivery address..."
      value={value}
      onChange={onChange}
      style={style}
    />
  );
}

/* ── Checkout form (inside cart drawer) ── */
function CheckoutForm({ kioskId, conceptName, items, concepts, vatRate = 0, onSuccess, onBack }) {
  const kiosk = concepts?.find((c) => c.id === kioskId);
  const kioskCurrency = kiosk?.location?.state?.currency || kiosk?.currency || "NGN";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlLat = parseFloat(searchParams.get("lat"));
  const urlLng = parseFloat(searchParams.get("lng"));

  const [orderType, setOrderType] = useState("DELIVERY");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    // customerName: user?.fullName || "",
    // customerEmail: user?.email || "",
    // customerPhone: user?.phone || "",
    // deliveryAddress: user?.address || "",
    deliveryLat: isNaN(urlLat) ? null : urlLat,
    deliveryLng: isNaN(urlLng) ? null : urlLng,
  });
  const [placing, setPlacing] = useState(false);
  const [gateway, setGateway] = useState("paystack");
  const [orderResult, setOrderResult] = useState(null);
  const [paying, setPaying] = useState(false);
  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState(0);

  const total = items.reduce(
    (s, e) => s + (e.unitPrice || e.item.sellingPrice || 0) * e.qty,
    0,
  );

  useEffect(() => {
    if (orderType !== "DELIVERY" || !form.deliveryLat || !form.deliveryLng || !kioskId) {
      setDynamicDeliveryFee(0);
      return;
    }
    let isMounted = true;
    const getFee = async () => {
      try {
        const res = await api.post("/kiosk/shop/delivery-cost", {
          kioskId,
          lat: form.deliveryLat,
          lng: form.deliveryLng
        });
        if (isMounted) setDynamicDeliveryFee(res.data.data.cost);
      } catch (e) {
        if (isMounted) setDynamicDeliveryFee(concepts?.find((c) => c.id === kioskId)?.deliveryFee || 0);
      }
    };
    getFee();
    return () => { isMounted = false; };
  }, [orderType, form.deliveryLat, form.deliveryLng, kioskId, concepts]);

  const deliveryFee = orderType === "DELIVERY" ? dynamicDeliveryFee : 0;
  const vatAmount = total * (vatRate / 100);
  const grandTotal = total + vatAmount + deliveryFee;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const place = async () => {
    if (form.customerName.trim().length < 2)
      return toast.error("Enter your name");
    if (orderType === "DELIVERY" && form.deliveryAddress.trim().length < 5)
      return toast.error("Enter your delivery address");
    setPlacing(true);
    try {
      const res = await api.post("/kiosk/shop/order", {
        kioskId,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        customerPhone: form.customerPhone.trim() || undefined,
        deliveryAddress: orderType === "PICKUP" ? undefined : form.deliveryAddress.trim(),
        deliveryLat: orderType === "PICKUP" ? null : form.deliveryLat,
        deliveryLng: orderType === "PICKUP" ? null : form.deliveryLng,
        orderType,
        gateway,
        items: items.map((e) => ({
          menuItemId: e.item.id,
          quantity: e.qty,
          ...(e.variantId ? { variantId: e.variantId } : {}),
          ...(e.extraIds?.length ? { extras: e.extraIds } : {}),
        })),
      });
      const orderData = res.data.data;
      onSuccess(orderData);
      setOrderResult(orderData);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const handlePay = async () => {
    if (!orderResult || paying) return;
    setPaying(true);
    const orderNumber = orderResult.orderNumber || orderResult.data?.orderNumber || orderResult.id || "";
    const originalLink =
      orderResult.paymentLink ||
      orderResult.paymentUrl ||
      orderResult.data?.paymentLink ||
      orderResult.data?.paymentUrl ||
      null;
    try {
      const res = await api.get("/kiosk/shop/checkout", {
        params: { id: orderNumber, gateway }
      });
      const freshLink = res.data?.data?.paymentLink || res.data?.paymentLink || originalLink;
      if (freshLink) {
        window.open(freshLink, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Could not retrieve payment link");
      }
    } catch (err) {
      console.error(err);
      if (originalLink) {
        window.open(originalLink, "_blank", "noopener,noreferrer");
      } else {
        toast.error(err.response?.data?.message || "Failed to retrieve payment link");
      }
    } finally {
      setPaying(false);
    }
  };

  if (orderResult) {
    const orderNumber =
      orderResult.orderNumber || orderResult.data?.orderNumber || orderResult.id || "";
    const paymentLink =
      orderResult.paymentLink ||
      orderResult.paymentUrl ||
      orderResult.data?.paymentLink ||
      orderResult.data?.paymentUrl ||
      null;

    return (
      <div style={{ textAlign: "center", padding: "24px 12px" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(34,197,94,0.12)",
            border: "2px solid rgba(34,197,94,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <MdCheckCircle size={32} style={{ color: "#16a34a" }} />
        </div>
        <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 6px" }}>
          Order Placed! 🎉
        </h3>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Order</span>
          <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--text-heading)", fontFamily: "monospace" }}>
            {orderNumber}
          </span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 20px" }}>
          Your order has been received successfully.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {paymentLink && (
            <button
              onClick={handlePay}
              disabled={paying}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 40,
                borderRadius: 8,
                background: "linear-gradient(135deg,#f97316,#ef4444)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.85rem",
                border: "none",
                cursor: paying ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(249,115,22,0.2)",
              }}
            >
              {paying ? "Preparing payment..." : "Pay Now"} <MdOpenInNew size={14} />
            </button>
          )}
          <button
            onClick={() => {
              onBack(); // Closes the drawer
              navigate(`/shop/order?id=${orderNumber}`);
            }}
            style={{
              height: 40,
              borderRadius: 8,
              background: "var(--bg-active)",
              color: "var(--text-heading)",
              border: "1px solid var(--border)",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            Track Order
          </button>
          <button
            onClick={() => {
              onBack(); // Closes the drawer
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "0.76rem",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

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

      {/* Order Type Selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setOrderType("DELIVERY")}
          style={{
            flex: 1,
            height: 34,
            borderRadius: 8,
            border: "1px solid",
            borderColor: orderType === "DELIVERY" ? "var(--accent)" : "var(--border)",
            background: orderType === "DELIVERY" ? "var(--bg-active)" : "transparent",
            color: orderType === "DELIVERY" ? "var(--accent)" : "var(--text-muted)",
            fontSize: "0.74rem",
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Delivery
        </button>
        <button
          type="button"
          onClick={() => setOrderType("PICKUP")}
          style={{
            flex: 1,
            height: 34,
            borderRadius: 8,
            border: "1px solid",
            borderColor: orderType === "PICKUP" ? "var(--accent)" : "var(--border)",
            background: orderType === "PICKUP" ? "var(--bg-active)" : "transparent",
            color: orderType === "PICKUP" ? "var(--accent)" : "var(--text-muted)",
            fontSize: "0.74rem",
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Pickup
        </button>
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
                ? formatKioskPrice(entry.unitPrice * entry.qty, kioskCurrency)
                : "—"}
            </span>
          </div>
        ))}
        {vatRate > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.78rem",
              padding: "3px 0",
              color: "var(--text-body)"
            }}
          >
            <span>VAT ({vatRate}%)</span>
            <span style={{ fontWeight: 700, color: "var(--text-heading)" }}>
              {formatKioskPrice(vatAmount, kioskCurrency)}
            </span>
          </div>
        )}
        {orderType === "DELIVERY" && deliveryFee > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.78rem",
              padding: "3px 0",
              color: "var(--text-body)"
            }}
          >
            <span>Delivery Fee</span>
            <span style={{ fontWeight: 700, color: "var(--text-heading)" }}>
              {formatKioskPrice(deliveryFee, kioskCurrency)}
            </span>
          </div>
        )}
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
            {formatKioskPrice(grandTotal, kioskCurrency)}
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

      {orderType === "DELIVERY" && (
        <APIProvider apiKey={import.meta.env.VITE_APP_MAP_API_KEY} libraries={["places"]}>
          <div className="form-field" style={{ marginBottom: 10 }}>
            <label className="modal-label">Delivery Address *</label>
            <AddressAutocompleteInput
              value={form.deliveryAddress}
              onChange={(e) => set("deliveryAddress", e.target.value)}
              onPlaceSelected={(place) => {
                if (place.geometry && place.geometry.location) {
                  const lat = place.geometry.location.lat();
                  const lng = place.geometry.location.lng();
                  const address = place.formatted_address || place.name || "";
                  setForm((p) => ({
                    ...p,
                    deliveryAddress: address,
                    deliveryLat: lat,
                    deliveryLng: lng,
                  }));
                }
              }}
            />
          </div>

          <div style={{ height: 160, borderRadius: 10, overflow: "hidden", marginBottom: 14, border: "1px solid var(--border)" }}>
            <Map
              defaultZoom={15}
              center={
                form.deliveryLat && form.deliveryLng
                  ? { lat: form.deliveryLat, lng: form.deliveryLng }
                  : { lat: 6.5244, lng: 3.3792 } // Lagos default
              }
              disableDefaultUI={true}
              gestureHandling="greedy"
            >
              <MapEventsListener
                onMapClick={(coords) => {
                  setForm((p) => ({
                    ...p,
                    deliveryLat: coords.lat,
                    deliveryLng: coords.lng
                  }));
                }}
              />
              {form.deliveryLat && form.deliveryLng && (
                <Marker position={{ lat: form.deliveryLat, lng: form.deliveryLng }} />
              )}
            </Map>
          </div>
        </APIProvider>
      )}

      <div className="form-field" style={{ marginTop: 14, marginBottom: 16 }}>
        <label className="modal-label">Payment Gateway</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => setGateway("paystack")}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: gateway === "paystack" ? "2px solid var(--accent)" : "1px solid var(--border)",
              background: gateway === "paystack" ? "var(--bg-active)" : "var(--bg-card)",
              color: "var(--text-heading)",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            Paystack
          </button>
          <button
            type="button"
            onClick={() => setGateway("stripe")}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: gateway === "stripe" ? "2px solid var(--accent)" : "1px solid var(--border)",
              background: gateway === "stripe" ? "var(--bg-active)" : "var(--bg-card)",
              color: "var(--text-heading)",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
          >
            Stripe
          </button>
        </div>
      </div>

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
   CART DRAWER — strictly grouped by kioskId
   Each kioskId = one Kiosk = one separate checkout
   ───────────────────────────────────────────────────────────── */
function CartDrawer({ cartItems, setCartItems, open, onClose, concepts }) {
  const [checkoutCartId, setCheckoutCartId] = useState(null);
  const [orderedCarts, setOrderedCarts] = useState(new Set());

  // Build groups: { [kioskId]: { kioskId, conceptName, items: [] } }
  // Items with same kioskId but different concepts still merge under one Kiosk group
  const groupMap = Object.entries(cartItems).reduce((acc, [key, entry]) => {
    const { kioskId, conceptName } = entry;
    if (!acc[kioskId]) {
      const kiosk = concepts?.find((c) => c.id === kioskId);
      acc[kioskId] = {
        kioskId,
        conceptName,
        vatRate: kiosk?.vatRate || 0,
        deliveryFee: kiosk?.deliveryFee || 0,
        items: [],
        keys: [],
      };
    }
    acc[kioskId].items.push(entry);
    acc[kioskId].keys.push(key);
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
  const clearCart = (kioskId) =>
    setCartItems((prev) => {
      const n = { ...prev };
      Object.keys(n).forEach((k) => {
        if (n[k].kioskId === kioskId) delete n[k];
      });
      return n;
    });

  const checkoutGroup = groups.find((g) => g.kioskId === checkoutCartId) || null;
  const [activeCheckoutGroup, setActiveCheckoutGroup] = useState(null);

  useEffect(() => {
    if (checkoutCartId === null) {
      setActiveCheckoutGroup(null);
    } else if (checkoutGroup) {
      setActiveCheckoutGroup(checkoutGroup);
    }
  }, [checkoutCartId, checkoutGroup]);

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
            {activeCheckoutGroup
              ? `Checkout — ${activeCheckoutGroup.conceptName}`
              : "Your Cart"}
          </span>
          {!activeCheckoutGroup && totalItems > 0 && (
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
              if (activeCheckoutGroup) {
                setCheckoutCartId(null);
                setActiveCheckoutGroup(null);
              } else {
                onClose();
              }
            }}
            className="kiosk_icon_action_btn"
            style={{ width: 28, height: 28 }}
          >
            {activeCheckoutGroup ? <MdArrowBack size={14} /> : <MdClose size={14} />}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Empty state */}
          {totalItems === 0 && !activeCheckoutGroup && (
            <div className="kiosk_empty_state" style={{ padding: "60px 0" }}>
              <LuShoppingCart size={28} style={{ opacity: 0.25 }} />
              <p className="kiosk_empty_title">Your cart is empty</p>
              <p className="kiosk_empty_sub">
                Add items from the menu to get started.
              </p>
            </div>
          )}

          {/* Checkout form for selected Kiosk */}
          {activeCheckoutGroup && (
            <CheckoutForm
              kioskId={activeCheckoutGroup.kioskId}
              conceptName={activeCheckoutGroup.conceptName}
              items={activeCheckoutGroup.items}
              concepts={concepts}
              vatRate={concepts?.find((c) => c.id === activeCheckoutGroup.kioskId)?.vatRate || 0}
              onSuccess={(orderData) => {
                setOrderedCarts(
                  (prev) => new Set([...prev, activeCheckoutGroup.kioskId]),
                );
                clearCart(activeCheckoutGroup.kioskId);
              }}
              onBack={() => {
                setCheckoutCartId(null);
                setActiveCheckoutGroup(null);
              }}
            />
          )}

          {/* All Kiosk groups — shown when not in checkout */}
          {!activeCheckoutGroup && totalItems > 0 && (
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
                  You have items from {groups.length} different Kiosks — each
                  has its own checkout.
                </div>
              )}

              {groups.map((group, gi) => {
                const groupKiosk = concepts?.find((c) => c.id === group.kioskId);
                const kioskCurrency = groupKiosk?.location?.state?.currency || groupKiosk?.currency || "NGN";
                const groupTotal = group.items.reduce(
                  (s, e) =>
                    s + (e.unitPrice || e.item.sellingPrice || 0) * e.qty,
                  0,
                );
                const isOrdered = orderedCarts.has(group.kioskId);

                return (
                  <div key={group.kioskId} style={{ marginBottom: 24 }}>
                    {/* Kiosk header */}
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
                          Kiosk #{group?.kioskId?.slice?.(0, 8)?.toUpperCase() || "UNKNOWN"}
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

                    {/* Items in this Kiosk */}
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
                                  ` · ${formatKioskPrice(entry.unitPrice * entry.qty, kioskCurrency)}`}
                              </div>
                            </div>
                            <button
                              onClick={() => removeItem(entryKey)}
                              className="kiosk_icon_action_btn"
                              style={{ width: 24, height: 24, flexShrink: 0 }}
                            >
                              <MdClose size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Subtotal + checkout button for THIS Kiosk */}
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
                          {groupTotal > 0 ? formatKioskPrice(groupTotal, kioskCurrency) : "Price TBD"}
                        </div>
                      </div>
                      {!isOrdered && (
                        <button
                          onClick={() => setCheckoutCartId(group.kioskId)}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

  // Dedicated Kiosk Device Mode (locked outlet)
  const deviceKioskId =
    localStorage.getItem("nora_device_kiosk_id") ||
    searchParams.get("kioskId") ||
    searchParams.get("deviceKioskId") ||
    "";

  // Location / State Picker states
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const locationRef = useRef(null);

  const [selectedStateId, setSelectedStateId] = useState(
    () => searchParams.get("stateId") || localStorage.getItem("nora-shop-state") || ""
  );

  const lat = parseFloat(searchParams.get("lat") || "9.0579");
  const lng = parseFloat(searchParams.get("lng") || "7.4951");

  useEffect(() => {
    setStatesLoading(true);
    api
      .get("/config/state")
      .then((res) => {
        const list = res.data?.data || [];
        setStates(list);
      })
      .catch((err) => console.error("Failed to load states", err))
      .finally(() => setStatesLoading(false));
  }, []);

  // Close location dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
    }
    if (locationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [locationOpen]);

  useEffect(() => {
    setLoading(true);
    if (deviceKioskId) {
      // Dedicated outlet mode: fetch only from /kiosk/:id
      api
        .get(`/kiosk/shop/kiosk/${deviceKioskId}`)
        .then((r) => {
          const kiosk = r.data?.data;
          if (kiosk) {
            setConcepts([kiosk]);
          } else {
            toast.error("Assigned outlet kiosk not found");
            setConcepts([]);
          }
        })
        .catch((err) => {
          console.error("Failed to load kiosk device menu", err);
          toast.error("Failed to load outlet menu. Check kiosk ID.");
          setConcepts([]);
        })
        .finally(() => setLoading(false));
    } else {
      // Standard customer discovery mode: nearby carts with optional state filter
      const params = { lat, lng };
      if (selectedStateId) {
        params.stateId = selectedStateId;
      }
      api
        .get("/kiosk/shop/nearby", { params })
        .then((r) => {
          const d = r.data.data.kiosks;
          setConcepts(Array.isArray(d) ? d : d?.carts || []);
        })
        .catch(() => toast.error("Failed to load nearby carts"))
        .finally(() => setLoading(false));
    }
  }, [lat, lng, selectedStateId, deviceKioskId]);

  const handleSelectState = (stateId) => {
    setSelectedStateId(stateId);
    setLocationOpen(false);
    setStateSearch("");
    if (stateId) {
      localStorage.setItem("nora-shop-state", stateId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("stateId", stateId);
        return next;
      });
      const st = states.find((s) => s.id === stateId);
      if (st) toast.info(`Filtered to ${st.name}`);
    } else {
      localStorage.removeItem("nora-shop-state");
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("stateId");
        return next;
      });
      toast.info("Showing all nearby locations");
    }
  };

  const selectedState = states.find((s) => s.id === selectedStateId) || null;
  const filteredStates = stateSearch.trim()
    ? states.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(stateSearch.toLowerCase()) ||
          (s.code || "").toLowerCase().includes(stateSearch.toLowerCase()) ||
          (s.country || "").toLowerCase().includes(stateSearch.toLowerCase())
      )
    : states;

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
        (c.vendor?.businessName || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.serialNumber || "").toLowerCase().includes(search.toLowerCase()) ||
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
  const firstCartKioskId = Object.values(cartItems)[0]?.kioskId;
  const activeCartKiosk = concepts.find((c) => c.id === firstCartKioskId) || concepts[0];
  const activeCartCurrency = activeCartKiosk?.location?.state?.currency || activeCartKiosk?.currency || "NGN";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      <style>{`
        @media (max-width: 600px) {
          .shop-header-inner { padding: 0 12px !important; gap: 8px !important; }
          .shop-header-actions { gap: 6px !important; }
          .shop-header-btn { width: 32px !important; height: 32px !important; }
          .shop-header-cart-btn {
            height: 32px !important;
            padding: 0 10px !important;
            font-size: 0.72rem !important;
            gap: 5px !important;
          }
          .shop-content { padding: 18px 12px 100px !important; }
          .shop-grid { grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)) !important; }
        }
        @media (max-width: 400px) {
          .shop-header-inner { padding: 0 8px !important; gap: 6px !important; }
          .shop-header-actions { gap: 4px !important; }
          .shop-header-label { display: none !important; }
          .shop-cart-label { display: none !important; }
        }
        @keyframes shopFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
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
            className="shop-header-label"
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
              {deviceKioskId ? "POS Terminal" : "Shop"}
            </span>
          </div>

          {/* Active Dedicated Kiosk Badge in Header (if locked) */}
          {deviceKioskId && concepts[0] && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                background: "rgba(203,108,220,0.12)",
                border: "1px solid rgba(203,108,220,0.3)",
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "var(--accent)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 220,
              }}
              title={`Dedicated outlet: ${concepts[0]?.vendor?.businessName || "Kiosk"} (#${concepts[0]?.serialNumber || deviceKioskId.slice(0, 8)})`}
            >
              <MdStorefront size={13} style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {concepts[0]?.vendor?.businessName || `Kiosk #${concepts[0]?.serialNumber || deviceKioskId.slice(0, 8)}`}
              </span>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Header Action Icons (Responsive) */}
          <div
            className="shop-header-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {/* Location picker (hidden on locked outlet devices) */}
            {!deviceKioskId && (
              <div style={{ position: "relative" }} ref={locationRef}>
                <button
                  onClick={() => setLocationOpen((v) => !v)}
                  className="kiosk_icon_action_btn shop-header-btn"
                  style={{
                    width: 34,
                    height: 34,
                    position: "relative",
                    background: selectedState ? "rgba(203,108,220,0.12)" : undefined,
                    color: selectedState ? "var(--accent)" : undefined,
                    borderColor: selectedState ? "rgba(203,108,220,0.4)" : undefined,
                  }}
                  title={selectedState ? `Location: ${selectedState.name}` : "Filter by state / location"}
                  aria-label="Location picker"
                >
                  <MdLocationOn size={17} />
                  {selectedState && (
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        border: "1px solid var(--bg-card)",
                      }}
                    />
                  )}
                </button>

                {/* Location Popover Dropdown */}
                {locationOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: 280,
                      maxWidth: "min(320px, calc(100vw - 24px))",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
                      padding: 12,
                      zIndex: 1000,
                      boxSizing: "border-box",
                      animation: "shopFadeIn 0.15s ease-out",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                        paddingBottom: 8,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            color: "var(--text-heading)",
                          }}
                        >
                          Select Location
                        </div>
                        <div
                          style={{
                            fontSize: "0.66rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Filter menus available in your state
                        </div>
                      </div>
                      <button
                        onClick={() => setLocationOpen(false)}
                        className="kiosk_icon_action_btn"
                        style={{ width: 24, height: 24 }}
                      >
                        <MdClose size={12} />
                      </button>
                    </div>

                    {states.length > 5 && (
                      <div style={{ position: "relative", marginBottom: 8 }}>
                        <MdSearch
                          size={13}
                          style={{
                            position: "absolute",
                            left: 9,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--text-muted)",
                            pointerEvents: "none",
                          }}
                        />
                        <input
                          type="text"
                          className="modal-input"
                          style={{
                            height: 32,
                            paddingLeft: 28,
                            paddingRight: 10,
                            fontSize: "0.75rem",
                            marginBottom: 0,
                          }}
                          placeholder="Search state…"
                          value={stateSearch}
                          onChange={(e) => setStateSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}

                    <div
                      style={{
                        maxHeight: 220,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      {/* All Locations Option */}
                      <button
                        onClick={() => handleSelectState("")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: !selectedStateId
                            ? "var(--bg-active)"
                            : "transparent",
                          color: !selectedStateId
                            ? "var(--accent)"
                            : "var(--text-body)",
                          cursor: "pointer",
                          fontSize: "0.78rem",
                          fontWeight: !selectedStateId ? 800 : 500,
                          textAlign: "left",
                          transition: "all 0.12s",
                        }}
                      >
                        <span>All Locations (Nearby)</span>
                        {!selectedStateId && <MdCheckCircle size={14} />}
                      </button>

                      {statesLoading ? (
                        <div
                          style={{
                            padding: "16px 0",
                            textAlign: "center",
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Loading locations…
                        </div>
                      ) : filteredStates.length === 0 ? (
                        <div
                          style={{
                            padding: "14px 0",
                            textAlign: "center",
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          No state matching "{stateSearch}"
                        </div>
                      ) : (
                        filteredStates.map((s) => {
                          const isSelected = s.id === selectedStateId;
                          return (
                            <button
                              key={s.id}
                              onClick={() => handleSelectState(s.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "none",
                                background: isSelected
                                  ? "var(--bg-active)"
                                  : "transparent",
                                color: isSelected
                                  ? "var(--accent)"
                                  : "var(--text-body)",
                                cursor: "pointer",
                                fontSize: "0.78rem",
                                fontWeight: isSelected ? 800 : 500,
                                textAlign: "left",
                                transition: "all 0.12s",
                              }}
                            >
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span>{s.name}</span>
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {s.code || s.country || ""} · {s.currency || "NGN"}
                                </span>
                              </div>
                              {isSelected && <MdCheckCircle size={14} />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="kiosk_icon_action_btn shop-header-btn"
              style={{ width: 34, height: 34 }}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              aria-label="Toggle theme"
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
              className="kiosk_icon_action_btn shop-header-btn"
              style={{ width: 34, height: 34 }}
              title="Track an order"
              aria-label="Track an order"
            >
              <MdOutlineReceiptLong size={17} />
            </button>

            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="shop-header-cart-btn"
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
                flexShrink: 0,
              }}
            >
              <LuShoppingCart size={15} />
              <span className="shop-cart-label">
                {totalItems > 0 ? `${totalItems} · ${formatKioskPrice(totalPrice, activeCartCurrency)}` : "Cart"}
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
        {/* Dedicated device outlet banner */}
        {deviceKioskId && concepts[0] && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(203,108,220,0.08)",
              border: "1px solid rgba(203,108,220,0.22)",
              fontSize: "0.76rem",
              color: "var(--text-body)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MdStorefront size={16} style={{ color: "var(--accent)" }} />
              <span>
                Ordering Terminal for <strong>{concepts[0]?.vendor?.businessName || "Outlet"}</strong> (Kiosk #{concepts[0]?.serialNumber || deviceKioskId.slice(0, 8)})
              </span>
            </div>
            {concepts[0]?.location?.address && (
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <MdLocationOn size={12} />
                {concepts[0].location.address}
                {concepts[0].location.city ? `, ${concepts[0].location.city}` : ""}
              </span>
            )}
          </div>
        )}

        {/* Active state filter indicator badge (only in general shop mode) */}
        {!deviceKioskId && selectedState && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 14,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(203,108,220,0.1)",
              border: "1px solid rgba(203,108,220,0.25)",
              fontSize: "0.74rem",
              color: "var(--accent)",
              fontWeight: 700,
            }}
          >
            <MdLocationOn size={13} />
            <span>
              Showing options in <strong>{selectedState.name}</strong>
            </span>
            <button
              onClick={() => handleSelectState("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                padding: "2px",
                marginLeft: 2,
              }}
              title="Clear location filter"
            >
              <MdClose size={12} />
            </button>
          </div>
        )}

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
                  className="skeleton_shimmer skeleton_text"
                  style={{ height: 18, width: 180, marginBottom: 12 }}
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
          <div className="kiosk_empty_state" style={{ padding: "60px 0" }}>
            <MdOutlineShoppingBag size={28} style={{ opacity: 0.25 }} />
            <p className="kiosk_empty_title">
              {search
                ? "No results found"
                : deviceKioskId
                ? "Outlet menu currently unavailable"
                : selectedState
                ? `No active kiosks in ${selectedState.name}`
                : "No carts nearby"}
            </p>
            <p className="kiosk_empty_sub">
              {search
                ? "Try a different search term."
                : deviceKioskId
                ? "Items for this outlet will appear once updated by the vendor."
                : selectedState
                ? "Try selecting another state or switch back to All Locations."
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
              <span style={{ opacity: 0.85 }}>· {formatKioskPrice(totalPrice, activeCartCurrency)}</span>
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
        concepts={concepts}
      />
    </div>
  );
}
