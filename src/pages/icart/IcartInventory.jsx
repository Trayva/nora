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
function parseLibraryResults(data, type) {
  if (type === "PREP_ITEM") return data?.preps || [];
  return data?.ingredient || [];
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

const UNIT_OPTIONS = {
  INGREDIENT: ["g", "kg", "ml", "L"],
  PREP_ITEM: ["g", "kg", "ml", "L"],
};

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
function ItemSearchSelect({ type, value, onChange }) {
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
        setResults(parseLibraryResults(res.data.data, type));
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
          placeholder={`Search ${type === "PREP_ITEM" ? "prep item" : "ingredient"}…`}
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
  itemType,
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
          {itemType !== "MENU_ITEM" && (
            <select
              className="modal-input"
              style={{ width: 76, flexShrink: 0 }}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {UNIT_OPTIONS[itemType]?.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
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
  const [type, setType] = useState("INGREDIENT");
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [totalCost, setTotalCost] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUnit(type === "MENU_ITEM" ? "pcs" : "g");
    setSelectedItem(null);
    setQuantity("");
    setTotalCost("");
  }, [type]);

  const itemIdKey = type === "PREP_ITEM" ? "prepItemId" : "ingredientId";
  const baseQty = quantity ? toBaseQuantity(quantity, unit) : null;
  const unitCost =
    totalCost && quantity ? toUnitCost(totalCost, quantity, unit) : null;

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
      {/* Type tabs */}
      <div className="form-field">
        <label className="modal-label">Item Type</label>
        <div style={{ display: "flex", gap: 6 }}>
          {["INGREDIENT", "PREP_ITEM"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flex: 1,
                height: 36,
                border: "1px solid var(--border)",
                borderRadius: 8,
                cursor: "pointer",
                background: type === t ? "var(--bg-active)" : "var(--bg-hover)",
                color: type === t ? "var(--accent)" : "var(--text-muted)",
                borderColor:
                  type === t ? "rgba(203,108,220,0.35)" : "var(--border)",
                fontWeight: 600,
                fontSize: "0.75rem",
                transition: "all 0.15s",
              }}
            >
              {t === "INGREDIENT" ? "Ingredient" : "Prep Item"}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="form-field">
        <label className="modal-label">Search & Select Item *</label>
        <ItemSearchSelect
          type={type}
          value={selectedItem}
          onChange={setSelectedItem}
        />
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
            <div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--text-body)",
                }}
              >
                {selectedItem.name}
              </div>
              {selectedItem.unit && (
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {selectedItem.unit}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <QtyUnitCostFields
        itemType={type}
        quantity={quantity}
        setQuantity={setQuantity}
        unit={unit}
        setUnit={setUnit}
        totalCost={totalCost}
        setTotalCost={setTotalCost}
      />

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
function SupplyRequestForm({ cartId, onSubmitted }) {
  const [supplierId, setSupplierId] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!supplierId.trim() || !ingredientId.trim() || !quantity)
      return toast.error("All fields required");
    setSaving(true);
    try {
      await api.post("/icart/supply", {
        cartId,
        supplierId: supplierId.trim(),
        ingredientId: ingredientId.trim(),
        quantity: Number(quantity),
      });
      toast.success("Supply request created");
      onSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="icart_template_builder">
      <div className="form-field">
        <label className="modal-label">Supplier ID *</label>
        <input
          className="modal-input"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          placeholder="Supplier UUID"
        />
      </div>
      <div className="form-field">
        <label className="modal-label">Ingredient ID *</label>
        <input
          className="modal-input"
          value={ingredientId}
          onChange={(e) => setIngredientId(e.target.value)}
          placeholder="Ingredient UUID"
        />
      </div>
      <div className="form-field">
        <label className="modal-label">Quantity *</label>
        <input
          className="modal-input"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      <button
        className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
        style={{ width: "100%", height: 40, position: "relative" }}
        onClick={handleSubmit}
        disabled={saving}
      >
        <span className="btn_text">Create Supply Request</span>
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
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [totalCost, setTotalCost] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("Restock");
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

  const handleUpdate = async () => {
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0)
      return toast.error("Enter a valid quantity");
    setSaving(true);
    try {
      const notesStr = notes.trim()
        ? `[${reason}] ${notes.trim()}`
        : reason !== "Restock"
          ? reason
          : undefined;

      await api.patch(`/icart/inventory/${item.id}`, {
        quantity: baseQty ?? Number(quantity),
        cost: unitCost ?? (totalCost ? Number(totalCost) : undefined),
        notes: notesStr,
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
            onClick={() => setEditing((v) => !v)}
          >
            <MdEdit size={13} />
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

      {/* Edit form */}
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

          {/* Qty + unit */}
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
                  {UNIT_OPTIONS[itemType]?.map((u) => (
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

          {/* Reason + Notes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 2,
            }}
          >
            <div className="form-field">
              <label className="modal-label">Reason</label>
              <select
                className="modal-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASON_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="modal-label">Notes (optional)</label>
              <input
                className="modal-input"
                placeholder="e.g. Spoiled batch"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
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
        all.filter ? all.filter((r) => !r.cartId || r.cartId === cart.id) : all,
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
