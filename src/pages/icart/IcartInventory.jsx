import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdHistory,
  MdInventory2,
  MdLocalShipping,
  MdSearch,
  MdClose,
  MdExpandMore,
  MdExpandLess,
  MdImage,
  MdRemoveCircleOutline,
} from "react-icons/md";
import api from "../../api/axios";

/* ─────────────────────────────────────────────────────────────
   IMPORTANT: Replace these with the correct search endpoints.
   Expected response shape: { data: { items: [...] } } or { data: [...] }
   Each item should have: { id, name, image?, unit? }
   ───────────────────────────────────────────────────────────── */
const SEARCH_INGREDIENT_URL = (q) =>
  `/library/ingredient?returnPrep=true&search=${encodeURIComponent(q)}&limit=8`;

// Parse library response: { data: { ingredient: [...], preps: [...] } }
// Returns both merged, each tagged with _type for payload dispatch
function parseLibraryResults(data) {
  const ingredients = (data?.ingredient || []).map((i) => ({
    ...i,
    _type: "INGREDIENT",
  }));
  const preps = (data?.preps || []).map((i) => ({ ...i, _type: "PREP_ITEM" }));
  return [...ingredients, ...preps];
}

// Derive allowed units from an item's base unit
function getUnitOptions(baseUnit) {
  if (!baseUnit) return ["g", "kg", "ml", "L"];
  const u = baseUnit.toLowerCase();
  if (u === "g") return ["g", "kg"];
  if (u === "kg") return ["g", "kg"];
  if (u === "ml") return ["ml", "L"];
  if (u === "l") return ["ml", "L"];
  return ["unit"]; // pcs, unit, or anything else
}

// Default entry unit from item's base unit
function getDefaultUnit(baseUnit) {
  if (!baseUnit) return "g";
  const u = baseUnit.toLowerCase();
  if (u === "g" || u === "kg") return "g";
  if (u === "ml" || u === "l") return "ml";
  return "unit";
}

/* ── Unit conversion helpers ─────────────────────────────────── */
function toBaseQuantity(value, unit) {
  const n = Number(value);
  if (unit === "kg") return n * 1000; // kg → g
  if (unit === "L") return n * 1000; // L  → ml
  return n;
}

function toUnitCost(totalCost, displayQty, displayUnit) {
  const baseQty = toBaseQuantity(displayQty, displayUnit);
  if (!baseQty) return 0;
  return Number(totalCost) / baseQty;
}

const supplyStatusColors = {
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
  SHIPPED: {
    bg: "rgba(168,85,247,0.1)",
    color: "#a855f7",
    border: "rgba(168,85,247,0.25)",
  },
  DELIVERED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  CANCELLED: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
};

function StatusPill({ status }) {
  const s = supplyStatusColors[status] || supplyStatusColors.PENDING;
  return (
    <span
      className="icart_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status}
    </span>
  );
}

/* ── Item Search Select ──────────────────────────────────────── */
function ItemSearchSelect({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const doSearch = (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(SEARCH_INGREDIENT_URL(q));
        setResults(parseLibraryResults(res.data.data));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleSelect = (item) => {
    onChange(item);
    setQuery(item.name);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setResults([]);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div className="icart_search_wrap" style={{ height: 42 }}>
        {value?.image ? (
          <img
            src={value.image}
            alt=""
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <MdSearch
            size={16}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        )}
        <input
          className="modal-input"
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            flex: 1,
            outline: "none",
          }}
          placeholder="Search ingredient or prep item…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            doSearch(e.target.value);
          }}
          onFocus={() => setOpen(true)}
        />
        {(query || value) && (
          <button
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              padding: 0,
            }}
          >
            <MdClose size={14} />
          </button>
        )}
      </div>

      {open && query.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            zIndex: 50,
            maxHeight: 200,
            overflowY: "auto",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          {searching ? (
            <div
              style={{
                padding: "12px 14px",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: "12px 14px",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              No results found
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 7,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 7,
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MdImage size={14} style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                    }}
                  >
                    {item.name}
                  </div>
                  {item.unit && (
                    <div
                      style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                    >
                      {item.unit}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Quantity + Unit + Cost input group ──────────────────────── */
function QtyUnitCostFields({
  unitOpts = ["g", "kg", "ml", "L"],
  quantity,
  setQuantity,
  unit,
  setUnit,
  totalCost,
  setTotalCost,
}) {
  const baseQty = quantity ? toBaseQuantity(quantity, unit) : null;
  const unitCost =
    totalCost && quantity ? toUnitCost(totalCost, quantity, unit) : null;
  const showConv = (unit === "kg" || unit === "L") && quantity;

  return (
    <>
      <div className="form-field">
        <label className="modal-label">Quantity *</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="modal-input"
            type="number"
            style={{ flex: 1 }}
            placeholder="e.g. 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          {unitOpts.length > 1 ? (
            <select
              className="modal-input"
              style={{ width: 76, flexShrink: 0 }}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {unitOpts.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          ) : (
            <div
              className="modal-input"
              style={{
                width: 76,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontSize: "0.82rem",
              }}
            >
              {unitOpts[0] || "unit"}
            </div>
          )}
        </div>
        {showConv && (
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--accent)",
              marginTop: 5,
              fontWeight: 600,
            }}
          >
            → {baseQty?.toLocaleString()} {unit === "kg" ? "g" : "ml"} will be
            sent to server
          </div>
        )}
      </div>

      <div className="form-field">
        <label className="modal-label">Total Cost (NGN) — optional</label>
        <input
          className="modal-input"
          type="number"
          placeholder={`e.g. 4000 for ${quantity || "10"} ${unit}`}
          value={totalCost}
          onChange={(e) => setTotalCost(e.target.value)}
        />
        {unitCost != null && unitCost > 0 && (
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--accent)",
              marginTop: 5,
              fontWeight: 600,
            }}
          >
            → ₦{unitCost.toFixed(4)} per{" "}
            {unit === "kg" ? "g" : unit === "L" ? "ml" : unit}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Add Inventory Form ─────────────────────────────────────── */
function AddInventoryForm({ cartId, onAdded }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [totalCost, setTotalCost] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSelect = (item) => {
    setSelectedItem(item);
    setQuantity("");
    setTotalCost("");
    setUnit(getDefaultUnit(item?.unit));
  };

  const type = selectedItem?._type || "INGREDIENT";
  const itemIdKey = type === "PREP_ITEM" ? "prepItemId" : "ingredientId";
  const unitOpts = getUnitOptions(selectedItem?.unit);
  const baseQty = quantity ? toBaseQuantity(quantity, unit) : null;
  const unitCost =
    totalCost && quantity ? toUnitCost(totalCost, quantity, unit) : null;
  const showConv = (unit === "kg" || unit === "L") && quantity;

  const handleSubmit = async () => {
    if (!selectedItem) return toast.error("Search and select an item");
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0)
      return toast.error("Enter a valid quantity");

    setSaving(true);
    try {
      await api.post("/icart/inventory", {
        cartId,
        type,
        [itemIdKey]: selectedItem.id,
        quantity: baseQty ?? Number(quantity),
        cost: unitCost ?? (totalCost ? Number(totalCost) : undefined),
      });
      toast.success("Item added to inventory");
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="icart_template_builder">
      {/* Search — no type tab */}
      <div className="form-field">
        <label className="modal-label">Search & Select Item *</label>
        <ItemSearchSelect value={selectedItem} onChange={handleSelect} />
        {selectedItem && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 8,
              padding: "8px 12px",
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 9,
            }}
          >
            {selectedItem.image ? (
              <img
                src={selectedItem.image}
                alt=""
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MdImage size={15} style={{ color: "var(--text-muted)" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--text-body)",
                }}
              >
                {selectedItem.name}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                {selectedItem.unit && (
                  <span
                    style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                  >
                    {selectedItem.unit}
                  </span>
                )}
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    padding: "1px 7px",
                    borderRadius: 999,
                    background:
                      type === "PREP_ITEM"
                        ? "rgba(59,130,246,0.1)"
                        : "rgba(34,197,94,0.1)",
                    color: type === "PREP_ITEM" ? "#3b82f6" : "#16a34a",
                  }}
                >
                  {type === "PREP_ITEM" ? "Prep Item" : "Ingredient"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Qty + smart unit */}
      <div className="form-field">
        <label className="modal-label">Quantity *</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="modal-input"
            type="number"
            style={{ flex: 1 }}
            placeholder="e.g. 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          {unitOpts.length > 1 ? (
            <select
              className="modal-input"
              style={{ width: 76, flexShrink: 0 }}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {unitOpts.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          ) : (
            <div
              className="modal-input"
              style={{
                width: 76,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontSize: "0.82rem",
              }}
            >
              {unitOpts[0] || "unit"}
            </div>
          )}
        </div>
        {showConv && (
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--accent)",
              marginTop: 5,
              fontWeight: 600,
            }}
          >
            → {baseQty?.toLocaleString()} {unit === "kg" ? "g" : "ml"} will be
            sent to server
          </div>
        )}
      </div>

      {/* Total cost */}
      <div className="form-field">
        <label className="modal-label">Total Cost (NGN) — optional</label>
        <input
          className="modal-input"
          type="number"
          placeholder={`e.g. 4000 for ${quantity || "10"} ${unit}`}
          value={totalCost}
          onChange={(e) => setTotalCost(e.target.value)}
        />
        {unitCost != null && unitCost > 0 && (
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--accent)",
              marginTop: 5,
              fontWeight: 600,
            }}
          >
            → ₦{unitCost.toFixed(4)} per{" "}
            {unit === "kg" ? "g" : unit === "L" ? "ml" : unit}
          </div>
        )}
      </div>

      <button
        className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
        style={{ width: "100%", height: 40, position: "relative" }}
        onClick={handleSubmit}
        disabled={saving}
      >
        <span className="btn_text">Add to Inventory</span>
        {saving && (
          <span className="btn_loader" style={{ width: 14, height: 14 }} />
        )}
      </button>
    </div>
  );
}

/* ── Supply Request Form ────────────────────────────────────── */
function SupplyRequestForm({ cartId, cart, onSubmitted }) {
  // Supplier state
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierId, setSupplierId] = useState("");

  // Ingredient list — each row: { ingredient: obj|null, query: string, quantity: string, unit: string }
  const [items, setItems] = useState([
    { ingredient: null, query: "", quantity: "", unit: "g" },
  ]);

  const [saving, setSaving] = useState(false);

  // Fetch suppliers filtered by cart's state
  useEffect(() => {
    const stateId = cart?.location?.stateId || cart?.stateId || "";
    const url = stateId ? `/supplier?stateId=${stateId}` : "/supplier";
    api
      .get(url)
      .then((res) => {
        const data = res.data.data;
        setSuppliers(
          Array.isArray(data) ? data : data?.items || data?.suppliers || [],
        );
      })
      .catch(() => toast.error("Failed to load suppliers"))
      .finally(() => setSuppliersLoading(false));
  }, [cart]);

  // Per-row helpers
  const updateItem = (i, key, val) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [key]: val };
      return updated;
    });
  };

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      { ingredient: null, query: "", quantity: "", unit: "g" },
    ]);

  const removeRow = (i) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  // Submit — API expects { cartId, supplierId, items: [{ ingredientId, quantity }] }
  const handleSubmit = async () => {
    if (!supplierId) return toast.error("Select a supplier");
    const valid = items.filter(
      (r) => r.ingredient && r.quantity && Number(r.quantity) > 0,
    );
    if (!valid.length)
      return toast.error("Add at least one ingredient with a quantity");

    setSaving(true);
    try {
      await api.post("/icart/supply", {
        cartId,
        supplierId,
        items: valid.map((row) => ({
          ingredientId: row.ingredient.id,
          quantity: toBaseQuantity(row.quantity, row.unit),
        })),
      });
      toast.success(`Supply request${valid.length > 1 ? "s" : ""} created`);
      onSubmitted();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create supply request",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Supplier selector */}
      <div className="form-field">
        <label className="modal-label">Supplier *</label>
        {suppliersLoading ? (
          <div
            className="modal-input"
            style={{
              color: "var(--text-muted)",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            Loading suppliers…
          </div>
        ) : suppliers.length === 0 ? (
          <div
            className="modal-input"
            style={{
              color: "var(--text-muted)",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            No suppliers available
          </div>
        ) : (
          <select
            className="modal-input"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">Select a supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName ||
                  s.user?.fullName ||
                  s.user?.name ||
                  s.id.slice(0, 8).toUpperCase()}
                {s.state?.name ? ` — ${s.state.name}` : ""}
              </option>
            ))}
          </select>
        )}
        {selectedSupplier && (
          <div
            style={{
              marginTop: 6,
              fontSize: "0.72rem",
              color: "var(--text-muted)",
            }}
          >
            {selectedSupplier.user?.email && (
              <span>{selectedSupplier.user.email}</span>
            )}
            {selectedSupplier.phone && (
              <span style={{ marginLeft: 8 }}>· {selectedSupplier.phone}</span>
            )}
          </div>
        )}
      </div>

      {/* Ingredient rows */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <label className="modal-label" style={{ margin: 0 }}>
            Ingredients *
          </label>
          <button
            onClick={addRow}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            <MdAdd size={15} /> Add ingredient
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((row, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Header row with remove button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Ingredient {i + 1}
                </span>
                {items.length > 1 && (
                  <button
                    className="icart_icon_action_btn icart_icon_danger"
                    onClick={() => removeRow(i)}
                    style={{ width: 24, height: 24 }}
                  >
                    <MdClose size={13} />
                  </button>
                )}
              </div>

              {/* Search */}
              <ItemSearchSelect
                value={row.ingredient}
                onChange={(item) => {
                  const defaultUnit = item
                    ? item.unit?.toLowerCase() === "ml" ||
                      item.unit?.toLowerCase() === "l"
                      ? "ml"
                      : item.unit?.toLowerCase() === "unit"
                        ? "unit"
                        : "g"
                    : "g";
                  setItems((prev) => {
                    const u = [...prev];
                    u[i] = {
                      ...u[i],
                      ingredient: item,
                      quantity: "",
                      unit: defaultUnit,
                    };
                    return u;
                  });
                }}
              />

              {/* Qty + unit */}
              {row.ingredient && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="modal-input"
                    type="number"
                    style={{ flex: 1 }}
                    placeholder="Quantity"
                    value={row.quantity}
                    onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  />
                  {(() => {
                    const uOpts = getUnitOptions(row.ingredient?.unit);
                    return uOpts.length > 1 ? (
                      <select
                        className="modal-input"
                        style={{ width: 76, flexShrink: 0 }}
                        value={row.unit}
                        onChange={(e) => updateItem(i, "unit", e.target.value)}
                      >
                        {uOpts.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        className="modal-input"
                        style={{
                          width: 76,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-muted)",
                          fontSize: "0.82rem",
                        }}
                      >
                        {uOpts[0] || "unit"}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Conversion preview */}
              {row.ingredient &&
                row.quantity &&
                (row.unit === "kg" || row.unit === "L") && (
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--accent)",
                      fontWeight: 600,
                    }}
                  >
                    → {toBaseQuantity(row.quantity, row.unit).toLocaleString()}{" "}
                    {row.unit === "kg" ? "g" : "ml"} will be requested
                  </div>
                )}

              {/* Selected ingredient preview */}
              {row.ingredient && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {row.ingredient.image ? (
                    <img
                      src={row.ingredient.image}
                      alt=""
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MdImage
                        size={13}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--text-body)",
                    }}
                  >
                    {row.ingredient.name}
                  </span>
                  {row.ingredient.unit && (
                    <span
                      style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                    >
                      ({row.ingredient.unit})
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {items.filter((r) => r.ingredient && r.quantity).length > 0 && (
        <div
          style={{
            background: "var(--bg-active)",
            border: "1px solid rgba(203,108,220,0.2)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          {items.filter((r) => r.ingredient && r.quantity).length} ingredient
          {items.filter((r) => r.ingredient && r.quantity).length > 1
            ? "s"
            : ""}{" "}
          ready to request
        </div>
      )}

      <button
        className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
        style={{ width: "100%", height: 42, position: "relative" }}
        onClick={handleSubmit}
        disabled={saving || !supplierId}
      >
        <span className="btn_text">
          Submit Supply Request
          {items.filter((r) => r.ingredient && r.quantity).length > 1
            ? "s"
            : ""}
        </span>
        {saving && (
          <span className="btn_loader" style={{ width: 14, height: 14 }} />
        )}
      </button>
    </div>
  );
}

/* ── Inventory Item Row ─────────────────────────────────────── */
const REASON_OPTIONS = [
  "Restock",
  "Waste",
  "Damage",
  "Correction",
  "Sale",
  "Other",
];

function InventoryItemRow({ item, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [recordingUsage, setRecordingUsage] = useState(false);

  // Edit (update qty/cost) state
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [totalCost, setTotalCost] = useState("");

  // Record usage state
  const [usageQty, setUsageQty] = useState("");
  const [usageUnit, setUsageUnit] = useState("g");
  const [usageNotes, setUsageNotes] = useState("");
  const [usageReason, setUsageReason] = useState("Waste");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const itemType = item.type || "INGREDIENT";
  const itemName =
    item.ingredient?.name ||
    item.prepItem?.name ||
    item.menuItem?.name ||
    item.ingredientId ||
    item.prepItemId ||
    item.menuItemId ||
    "Item";
  const itemImage =
    item.ingredient?.image ||
    item.prepItem?.image ||
    item.menuItem?.image ||
    null;

  const baseQty = quantity ? toBaseQuantity(quantity, unit) : null;
  const unitCost =
    totalCost && quantity ? toUnitCost(totalCost, quantity, unit) : null;
  const showConv = (unit === "kg" || unit === "L") && quantity;

  const usageBaseQty = usageQty ? toBaseQuantity(usageQty, usageUnit) : null;
  const usageShowConv = (usageUnit === "kg" || usageUnit === "L") && usageQty;

  const handleUpdate = async () => {
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0)
      return toast.error("Enter a valid quantity");
    setSaving(true);
    try {
      await api.patch(`/icart/inventory/${item.id}`, {
        quantity: baseQty ?? Number(quantity),
        cost: unitCost ?? (totalCost ? Number(totalCost) : undefined),
      });
      toast.success("Updated");
      setEditing(false);
      onRefresh();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleRecordUsage = async () => {
    if (!usageQty || isNaN(usageQty) || Number(usageQty) <= 0)
      return toast.error("Enter a valid quantity");
    const notesStr = usageNotes.trim()
      ? `[${usageReason}] ${usageNotes.trim()}`
      : usageReason;
    setSaving(true);
    try {
      await api.post("/icart/inventory/record-usage", {
        itemId: item.id,
        quantity: usageBaseQty ?? Number(usageQty),
        notes: notesStr,
      });
      toast.success("Usage recorded");
      setRecordingUsage(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record usage");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remove this item from inventory?")) return;
    setDeleting(true);
    try {
      await api.delete(`/icart/inventory/${item.id}`);
      toast.success("Item removed");
      onRefresh();
    } catch {
      toast.error("Failed to remove");
    } finally {
      setDeleting(false);
    }
  };

  const isLow = item.quantity < 5;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${isLow ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
        }}
      >
        {itemImage ? (
          <img
            src={itemImage}
            alt={itemName}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 9,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MdInventory2 size={17} style={{ color: "var(--text-muted)" }} />
          </div>
        )}

        <div className="icart_inventory_info">
          <div className="icart_task_name">{itemName}</div>
          <div className="icart_task_meta">
            <span
              className="icart_badge"
              style={{
                background: "var(--bg-hover)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                fontSize: "0.62rem",
              }}
            >
              {itemType.replace("_", " ")}
            </span>
            {isLow && (
              <span
                style={{
                  color: "#ef4444",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                }}
              >
                ⚠ LOW STOCK
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "var(--text-heading)",
              }}
            >
              {item.quantity?.toLocaleString()}
            </div>
            {item.cost != null && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                ₦{Number(item.cost).toFixed(4)}/unit
              </div>
            )}
          </div>
          <button
            className="icart_icon_action_btn"
            title="Edit quantity / cost"
            onClick={() => {
              setEditing((v) => !v);
              setRecordingUsage(false);
            }}
          >
            <MdEdit size={13} />
          </button>
          <button
            className="icart_icon_action_btn"
            title="Record usage"
            style={{ color: editing ? "var(--text-muted)" : undefined }}
            onClick={() => {
              setRecordingUsage((v) => !v);
              setEditing(false);
            }}
          >
            <MdRemoveCircleOutline size={14} />
          </button>
          <button
            className="icart_icon_action_btn icart_icon_danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            <MdDelete size={13} />
          </button>
        </div>
      </div>

      {/* Edit form — update qty / cost */}
      {editing && (
        <div
          style={{
            padding: "0 14px 14px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              paddingTop: 12,
              paddingBottom: 8,
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Update Stock
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
              <label className="modal-label">New Quantity *</label>
              <input
                className="modal-input"
                type="number"
                placeholder="e.g. 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            {itemType !== "MENU_ITEM" && (
              <div
                className="form-field"
                style={{ width: 76, marginBottom: 0 }}
              >
                <label className="modal-label">Unit</label>
                <select
                  className="modal-input"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  {getUnitOptions(
                    item.ingredient?.unit || item.prepItem?.unit,
                  ).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {showConv && (
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--accent)",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              → {baseQty?.toLocaleString()} {unit === "kg" ? "g" : "ml"} sent to
              server
            </div>
          )}

          <div className="form-field">
            <label className="modal-label">Total Cost (NGN) — optional</label>
            <input
              className="modal-input"
              type="number"
              placeholder={`e.g. 4000 for ${quantity || "10"} ${unit}`}
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
            />
            {unitCost != null && unitCost > 0 && (
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--accent)",
                  marginTop: 5,
                  fontWeight: 600,
                }}
              >
                → ₦{unitCost.toFixed(4)} per{" "}
                {unit === "kg" ? "g" : unit === "L" ? "ml" : unit}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              className="app_btn app_btn_cancel"
              style={{ flex: 1, height: 38 }}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{ flex: 2, height: 38, position: "relative" }}
              onClick={handleUpdate}
              disabled={saving}
            >
              <span className="btn_text">Save Changes</span>
              {saving && (
                <span
                  className="btn_loader"
                  style={{ width: 13, height: 13 }}
                />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Record usage panel */}
      {recordingUsage && (
        <div
          style={{
            padding: "0 14px 14px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              paddingTop: 12,
              paddingBottom: 8,
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Record Usage
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
              <label className="modal-label">Quantity Used *</label>
              <input
                className="modal-input"
                type="number"
                placeholder="e.g. 500"
                value={usageQty}
                onChange={(e) => setUsageQty(e.target.value)}
              />
            </div>
            {itemType !== "MENU_ITEM" && (
              <div
                className="form-field"
                style={{ width: 76, marginBottom: 0 }}
              >
                <label className="modal-label">Unit</label>
                <select
                  className="modal-input"
                  value={usageUnit}
                  onChange={(e) => setUsageUnit(e.target.value)}
                >
                  {getUnitOptions(
                    item.ingredient?.unit || item.prepItem?.unit,
                  ).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {usageShowConv && (
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--accent)",
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              → {usageBaseQty?.toLocaleString()}{" "}
              {usageUnit === "kg" ? "g" : "ml"} will be recorded
            </div>
          )}

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div className="form-field">
              <label className="modal-label">Reason *</label>
              <select
                className="modal-input"
                value={usageReason}
                onChange={(e) => setUsageReason(e.target.value)}
              >
                {REASON_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="modal-label">Notes</label>
              <input
                className="modal-input"
                placeholder="e.g. Spoiled batch"
                value={usageNotes}
                onChange={(e) => setUsageNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              className="app_btn app_btn_cancel"
              style={{ flex: 1, height: 38 }}
              onClick={() => setRecordingUsage(false)}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{ flex: 2, height: 38, position: "relative" }}
              onClick={handleRecordUsage}
              disabled={saving}
            >
              <span className="btn_text">Record Usage</span>
              {saving && (
                <span
                  className="btn_loader"
                  style={{ width: 13, height: 13 }}
                />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Supply Request Row ─────────────────────────────────────── */
function SupplyRequestRow({ req }) {
  const [expanded, setExpanded] = useState(false);
  const ingredientName =
    req.ingredient?.name || req.ingredientId || "Ingredient";
  const supplierName =
    req.supplier?.user?.name ||
    req.supplier?.businessName ||
    req.supplierId ||
    "Supplier";

  return (
    <div className="icart_task_card">
      <div
        className="icart_task_card_top"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="icart_task_card_left">
          <div className="icart_task_icon">
            <MdLocalShipping size={14} />
          </div>
          <div>
            <div className="icart_task_name">{ingredientName}</div>
            <div className="icart_task_meta">
              <span>from {supplierName}</span>
              <span className="contract_row_dot">·</span>
              <span>Qty: {req.quantity}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusPill status={req.status} />
          {expanded ? (
            <MdExpandLess size={16} style={{ color: "var(--text-muted)" }} />
          ) : (
            <MdExpandMore size={16} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </div>
      {expanded && (
        <div className="icart_task_expanded">
          <div className="icart_task_data">
            {req.suppliedQuantity != null && (
              <div className="icart_task_data_row">
                <span className="icart_meta_key">Supplied Qty</span>
                <span className="icart_meta_val">{req.suppliedQuantity}</span>
              </div>
            )}
            {req.createdAt && (
              <div className="icart_task_data_row">
                <span className="icart_meta_key">Requested</span>
                <span className="icart_meta_val">
                  {new Date(req.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main IcartInventory ───────────────────────────────────── */
export default function IcartInventory({ cart }) {
  const [view, setView] = useState("stock");
  const [inventory, setInventory] = useState([]);
  const [supplyRequests, setSupplyRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/inventory/icart/${cart.id}`);
      setInventory(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupply = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/supply?cartId=${cart.id}`);
      const all = res.data.data?.items || res.data.data || [];
      setSupplyRequests(
        // all.filter ? all.filter((r) => !r.cartId || r.cartId === cart.id) : all,
        all,
      );
    } catch {
      toast.error("Failed to load supply requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/inventory/history?cartId=${cart.id}`);
      setHistory(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "stock") fetchInventory();
    else if (view === "supply") fetchSupply();
    else if (view === "history") fetchHistory();
  }, [view]);

  const totalValue = inventory.reduce(
    (sum, i) => sum + (i.cost || 0) * (i.quantity || 0),
    0,
  );
  const lowStock = inventory.filter((i) => i.quantity < 5).length;

  return (
    <div className="icart_tab_content">
      {view === "stock" && inventory.length > 0 && (
        <div className="icart_summary_row" style={{ marginBottom: 14 }}>
          <div className="icart_summary_chip">
            <MdInventory2 size={12} />
            {inventory.length} items
          </div>
          {lowStock > 0 && (
            <div
              className="icart_summary_chip"
              style={{
                color: "#ef4444",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              ⚠ {lowStock} low
            </div>
          )}
          {totalValue > 0 && (
            <div className="icart_summary_chip">
              ₦{totalValue.toLocaleString()}
            </div>
          )}
        </div>
      )}

      <div className="icart_sub_nav">
        {[
          { key: "stock", label: "Stock", icon: <MdInventory2 size={13} /> },
          {
            key: "supply",
            label: "Supply",
            icon: <MdLocalShipping size={13} />,
          },
          { key: "history", label: "History", icon: <MdHistory size={13} /> },
        ].map((sv) => (
          <button
            key={sv.key}
            className={`icart_sub_nav_btn ${view === sv.key ? "icart_sub_nav_active" : ""}`}
            onClick={() => setView(sv.key)}
          >
            {sv.icon} {sv.label}
          </button>
        ))}
        <button
          className={`icart_sub_nav_btn ${view === "addItem" || view === "addSupply" ? "icart_sub_nav_active" : ""}`}
          onClick={() => setView(view === "supply" ? "addSupply" : "addItem")}
          style={{ marginLeft: "auto" }}
        >
          <MdAdd size={13} /> Add
        </button>
      </div>

      {loading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      ) : view === "addItem" ? (
        <AddInventoryForm
          cartId={cart.id}
          onAdded={() => {
            setView("stock");
            fetchInventory();
          }}
        />
      ) : view === "addSupply" ? (
        <SupplyRequestForm
          cartId={cart.id}
          cart={cart}
          onSubmitted={() => {
            setView("supply");
            fetchSupply();
          }}
        />
      ) : view === "stock" ? (
        inventory.length === 0 ? (
          <div className="icart_empty_inline" style={{ padding: "32px 0" }}>
            <MdInventory2 size={24} style={{ opacity: 0.3 }} />
            <span>No inventory items</span>
          </div>
        ) : (
          <div>
            {inventory.map((item) => (
              <InventoryItemRow
                key={item.id}
                item={item}
                onRefresh={fetchInventory}
              />
            ))}
          </div>
        )
      ) : view === "supply" ? (
        supplyRequests.length === 0 ? (
          <div className="icart_empty_inline" style={{ padding: "32px 0" }}>
            <MdLocalShipping size={24} style={{ opacity: 0.3 }} />
            <span>No supply requests</span>
          </div>
        ) : (
          <div className="icart_tasks_list">
            {supplyRequests.map((req) => (
              <SupplyRequestRow key={req.id} req={req} />
            ))}
          </div>
        )
      ) : view === "history" ? (
        history.length === 0 ? (
          <div className="icart_empty_inline" style={{ padding: "32px 0" }}>
            <MdHistory size={24} style={{ opacity: 0.3 }} />
            <span>No history yet</span>
          </div>
        ) : (
          <div className="icart_tasks_list">
            {history.map((entry, i) => (
              <div key={entry.id || i} className="icart_history_row">
                <div className="icart_task_icon">
                  {entry.delta > 0 ? (
                    <MdAdd size={13} style={{ color: "#22c55e" }} />
                  ) : (
                    <MdDelete size={13} style={{ color: "#ef4444" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="icart_task_name">
                    {entry.ingredient?.name || entry.item?.name || "Item"}
                  </div>
                  <div className="icart_task_meta">
                    {entry.action || (entry.delta > 0 ? "Added" : "Removed")}
                    {entry.notes && <> · {entry.notes}</>}
                    {entry.performedBy?.name && (
                      <> · {entry.performedBy.name}</>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      color: entry.delta > 0 ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta ?? entry.quantity}
                  </div>
                  {entry.createdAt && (
                    <div className="icart_operator_meta">
                      {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
