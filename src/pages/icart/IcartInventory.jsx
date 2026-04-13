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
  MdCheck,
  MdBuild,
} from "react-icons/md";
import api from "../../api/axios";
import {
  SupplierPicker,
  useIngredientPrice,
  useMachinerySupplierPrices,
  PriceTag,
} from "../../components/SupplierPicker";

const SEARCH_INGREDIENT_URL = (q) =>
  `/library/ingredient?returnPrep=true&search=${encodeURIComponent(q)}&limit=8`;

const SEARCH_MACHINERY_URL = (q) =>
  `/library/machinery?search=${encodeURIComponent(q)}&limit=8`;

function parseLibraryResults(data) {
  const ingredients = (data?.ingredient || []).map((i) => ({
    ...i,
    _type: "INGREDIENT",
  }));
  const preps = (data?.preps || []).map((i) => ({ ...i, _type: "PREP_ITEM" }));
  return [...ingredients, ...preps];
}

function parseMachineryResults(data) {
  // API returns { data: [...], total, page, ... } — paginated wrapper
  const items =
    data?.data ||
    data?.items ||
    data?.machineries ||
    (Array.isArray(data) ? data : []);
  return items.map((i) => ({ ...i, _type: "MACHINERY" }));
}

function getUnitOptions(baseUnit) {
  if (!baseUnit) return ["g", "kg", "ml", "L"];
  const u = baseUnit.toLowerCase();
  if (u === "g") return ["g", "kg"];
  if (u === "kg") return ["g", "kg"];
  if (u === "ml") return ["ml", "L"];
  if (u === "l") return ["ml", "L"];
  return ["unit"];
}

function getDefaultUnit(baseUnit) {
  if (!baseUnit) return "g";
  const u = baseUnit.toLowerCase();
  if (u === "g" || u === "kg") return "g";
  if (u === "ml" || u === "l") return "ml";
  return "unit";
}

function toBaseQuantity(value, unit) {
  const n = Number(value);
  if (unit === "kg") return n * 1000;
  if (unit === "L") return n * 1000;
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

/* ── Generic Item Search Select ─────────────────────────────── */
function ItemSearchSelect({
  value,
  onChange,
  searchUrl,
  parseResults,
  placeholder,
}) {
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

  // Reset query display when value changes externally (e.g. tab switch clears rows)
  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  const doSearch = (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(searchUrl(q));
        setResults(parseResults(res.data.data));
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
          placeholder={placeholder || "Search…"}
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
                  {item.manufacturer && (
                    <div
                      style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                    >
                      {item.manufacturer}
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

/* Convenience wrappers */
function IngredientSearchSelect({ value, onChange }) {
  return (
    <ItemSearchSelect
      value={value}
      onChange={onChange}
      searchUrl={SEARCH_INGREDIENT_URL}
      parseResults={parseLibraryResults}
      placeholder="Search ingredient or prep item…"
    />
  );
}

function MachinerySearchSelect({ value, onChange }) {
  return (
    <ItemSearchSelect
      value={value}
      onChange={onChange}
      searchUrl={SEARCH_MACHINERY_URL}
      parseResults={parseMachineryResults}
      placeholder="Search machinery or tool…"
    />
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
      <div className="form-field">
        <label className="modal-label">Search & Select Item *</label>
        <IngredientSearchSelect value={selectedItem} onChange={handleSelect} />
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

// Default row factories
const makeIngredientRow = () => ({
  item: null,
  query: "",
  quantity: "",
  unit: "g",
});
const makeMachineryRow = () => ({ item: null, quantity: "", unit: "unit" });

/* ── Inline price helpers for SupplyRequestForm ── */
function IngredientPriceInline({
  ingredientId,
  supplierId,
  stateId,
  qty,
  unit,
}) {
  const { price, loading } = useIngredientPrice(
    ingredientId,
    supplierId,
    stateId,
  );
  return <PriceTag price={price} loading={loading} qty={qty} unit={unit} />;
}

function MachineryPriceInline({ machineryId, supplierId, stateId, qty }) {
  const { prices, loading } = useMachinerySupplierPrices(supplierId, stateId);
  const price = prices.get(machineryId) ?? null;
  return <PriceTag price={price} loading={loading} qty={qty} unit="unit" />;
}

function SupplyRequestForm({ cartId, cart, onSubmitted }) {
  // "ingredients" | "machinery"
  const [supplyTab, setSupplyTab] = useState("ingredients");

  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierId, setSupplierId] = useState("");

  // Separate row lists per tab
  const [ingRows, setIngRows] = useState([makeIngredientRow()]);
  const [machRows, setMachRows] = useState([makeMachineryRow()]);

  const [saving, setSaving] = useState(false);

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

  /* ── Ingredient row helpers ── */
  const updateIngRow = (i, key, val) =>
    setIngRows((prev) => {
      const u = [...prev];
      u[i] = { ...u[i], [key]: val };
      return u;
    });

  const addIngRow = () => setIngRows((prev) => [...prev, makeIngredientRow()]);
  const removeIngRow = (i) =>
    setIngRows((prev) => prev.filter((_, idx) => idx !== i));

  /* ── Machinery row helpers ── */
  const updateMachRow = (i, key, val) =>
    setMachRows((prev) => {
      const u = [...prev];
      u[i] = { ...u[i], [key]: val };
      return u;
    });

  const addMachRow = () => setMachRows((prev) => [...prev, makeMachineryRow()]);
  const removeMachRow = (i) =>
    setMachRows((prev) => prev.filter((_, idx) => idx !== i));

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!supplierId) return toast.error("Select a supplier");

    const isIng = supplyTab === "ingredients";

    if (isIng) {
      const valid = ingRows.filter(
        (r) => r.item && r.quantity && Number(r.quantity) > 0,
      );
      if (!valid.length)
        return toast.error("Add at least one ingredient with a quantity");
      setSaving(true);
      try {
        await api.post("/icart/supply", {
          cartId,
          supplierId,
          items: valid.map((row) => ({
            ingredientId: row.item.id,
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
    } else {
      const valid = machRows.filter(
        (r) => r.item && r.quantity && Number(r.quantity) > 0,
      );
      if (!valid.length)
        return toast.error("Add at least one machinery with a quantity");
      setSaving(true);
      try {
        await api.post("/icart/supply", {
          cartId,
          supplierId,
          machineryItems: valid.map((row) => ({
            machineryId: row.item.id,
            quantity: Number(row.quantity),
          })),
        });
        toast.success(
          `Machinery request${valid.length > 1 ? "s" : ""} created`,
        );
        onSubmitted();
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to create machinery request",
        );
      } finally {
        setSaving(false);
      }
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  /* ── Active rows / counts for summary ── */
  const activeIngCount = ingRows.filter((r) => r.item && r.quantity).length;
  const activeMachCount = machRows.filter((r) => r.item && r.quantity).length;
  const activeCount =
    supplyTab === "ingredients" ? activeIngCount : activeMachCount;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Supply type tab switcher ── */}
      <div
        style={{
          display: "flex",
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 4,
          gap: 4,
        }}
      >
        {[
          {
            key: "ingredients",
            label: "Ingredients",
            icon: <MdInventory2 size={14} />,
          },
          { key: "machinery", label: "Machinery", icon: <MdBuild size={14} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSupplyTab(t.key)}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: "0.82rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s",
              background:
                supplyTab === t.key ? "var(--bg-card)" : "transparent",
              color:
                supplyTab === t.key ? "var(--accent)" : "var(--text-muted)",
              boxShadow:
                supplyTab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t.icon}
            {t.label}
            {/* Show badge if rows have data */}
            {((t.key === "ingredients" && activeIngCount > 0) ||
              (t.key === "machinery" && activeMachCount > 0)) && (
              <span
                style={{
                  minWidth: 16,
                  height: 16,
                  borderRadius: 999,
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: "0.58rem",
                  fontWeight: 900,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {t.key === "ingredients" ? activeIngCount : activeMachCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Supplier selector ── */}
      <div className="form-field">
        <label className="modal-label">Supplier *</label>
        <SupplierPicker
          suppliers={suppliers}
          suppliersLoading={suppliersLoading}
          value={supplierId}
          onChange={setSupplierId}
        />
      </div>

      {/* ── INGREDIENTS TAB ── */}
      {supplyTab === "ingredients" && (
        <div>
          <label
            className="modal-label"
            style={{ marginBottom: 10, display: "block" }}
          >
            Ingredients *
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ingRows.map((row, i) => (
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
                {/* Row header */}
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
                  {ingRows.length > 1 && (
                    <button
                      className="icart_icon_action_btn icart_icon_danger"
                      onClick={() => removeIngRow(i)}
                      style={{ width: 24, height: 24 }}
                    >
                      <MdClose size={13} />
                    </button>
                  )}
                </div>

                {/* Search */}
                <IngredientSearchSelect
                  value={row.item}
                  onChange={(item) => {
                    const defaultUnit = item
                      ? item.unit?.toLowerCase() === "ml" ||
                        item.unit?.toLowerCase() === "l"
                        ? "ml"
                        : item.unit?.toLowerCase() === "unit"
                          ? "unit"
                          : "g"
                      : "g";
                    setIngRows((prev) => {
                      const u = [...prev];
                      u[i] = { ...u[i], item, quantity: "", unit: defaultUnit };
                      return u;
                    });
                  }}
                />

                {/* Qty + unit */}
                {row.item && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="modal-input"
                      type="number"
                      style={{ flex: 1 }}
                      placeholder="Quantity"
                      value={row.quantity}
                      onChange={(e) =>
                        updateIngRow(i, "quantity", e.target.value)
                      }
                    />
                    {(() => {
                      const uOpts = getUnitOptions(row.item?.unit);
                      return uOpts.length > 1 ? (
                        <select
                          className="modal-input"
                          style={{ width: 76, flexShrink: 0 }}
                          value={row.unit}
                          onChange={(e) =>
                            updateIngRow(i, "unit", e.target.value)
                          }
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
                {row.item &&
                  row.quantity &&
                  (row.unit === "kg" || row.unit === "L") && (
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--accent)",
                        fontWeight: 600,
                      }}
                    >
                      →{" "}
                      {toBaseQuantity(row.quantity, row.unit).toLocaleString()}{" "}
                      {row.unit === "kg" ? "g" : "ml"} will be requested
                    </div>
                  )}

                {/* Selected ingredient preview + price */}
                {row.item && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {row.item.image ? (
                      <img
                        src={row.item.image}
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
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.item.name}
                    </span>
                    {row.item.unit && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        ({row.item.unit})
                      </span>
                    )}
                    {supplierId && (
                      <IngredientPriceInline
                        ingredientId={row.item.id}
                        supplierId={supplierId}
                        stateId={cart?.location?.stateId}
                        qty={
                          row.quantity
                            ? toBaseQuantity(row.quantity, row.unit)
                            : null
                        }
                        unit={row.item.unit || row.unit}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add ingredient — bottom */}
          <button
            onClick={addIngRow}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              height: 38,
              marginTop: 10,
              background: "var(--bg-hover)",
              border: "1.5px dashed var(--border)",
              borderRadius: 10,
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              fontFamily: "inherit",
              justifyContent: "center",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <MdAdd size={15} /> Add ingredient
          </button>
        </div>
      )}

      {/* ── MACHINERY TAB ── */}
      {supplyTab === "machinery" && (
        <div>
          <label
            className="modal-label"
            style={{ marginBottom: 10, display: "block" }}
          >
            Machinery / Tools *
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {machRows.map((row, i) => (
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
                {/* Row header */}
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
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <MdBuild size={12} /> Machinery {i + 1}
                  </span>
                  {machRows.length > 1 && (
                    <button
                      className="icart_icon_action_btn icart_icon_danger"
                      onClick={() => removeMachRow(i)}
                      style={{ width: 24, height: 24 }}
                    >
                      <MdClose size={13} />
                    </button>
                  )}
                </div>

                {/* Search */}
                <MachinerySearchSelect
                  value={row.item}
                  onChange={(item) => {
                    setMachRows((prev) => {
                      const u = [...prev];
                      u[i] = { ...u[i], item, quantity: "" };
                      return u;
                    });
                  }}
                />

                {/* Quantity — machinery uses unit count */}
                {row.item && (
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <input
                      className="modal-input"
                      type="number"
                      min="1"
                      style={{ flex: 1 }}
                      placeholder="Quantity (units)"
                      value={row.quantity}
                      onChange={(e) =>
                        updateMachRow(i, "quantity", e.target.value)
                      }
                    />
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
                      unit
                    </div>
                  </div>
                )}

                {/* Selected machinery preview */}
                {row.item && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {row.item.image ? (
                      <img
                        src={row.item.image}
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
                          background: "rgba(203,108,220,0.08)",
                          border: "1px solid rgba(203,108,220,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <MdBuild size={13} style={{ color: "var(--accent)" }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "var(--text-body)",
                        }}
                      >
                        {row.item.name}
                      </span>
                      {row.item.manufacturer && (
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {row.item.manufacturer}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 999,
                        background: "rgba(203,108,220,0.1)",
                        color: "var(--accent)",
                        border: "1px solid rgba(203,108,220,0.2)",
                        flexShrink: 0,
                      }}
                    >
                      Machinery
                    </span>
                    {supplierId && (
                      <MachineryPriceInline
                        machineryId={row.item.id}
                        supplierId={supplierId}
                        stateId={cart?.location?.stateId}
                        qty={row.quantity}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add machinery — bottom */}
          <button
            onClick={addMachRow}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              height: 38,
              marginTop: 10,
              background: "var(--bg-hover)",
              border: "1.5px dashed var(--border)",
              borderRadius: 10,
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              fontFamily: "inherit",
              justifyContent: "center",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <MdAdd size={15} /> Add machinery
          </button>
        </div>
      )}

      {/* Summary */}
      {activeCount > 0 && (
        <div
          style={{
            background: "var(--bg-active)",
            border: "1px solid rgba(203,108,220,0.2)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {supplyTab === "ingredients" ? (
            <MdInventory2
              size={13}
              style={{ color: "var(--accent)", flexShrink: 0 }}
            />
          ) : (
            <MdBuild
              size={13}
              style={{ color: "var(--accent)", flexShrink: 0 }}
            />
          )}
          <span>
            {activeCount}{" "}
            {supplyTab === "ingredients" ? "ingredient" : "machinery"}
            {activeCount > 1
              ? supplyTab === "ingredients"
                ? "s"
                : ""
              : ""}{" "}
            ready to request
          </span>
        </div>
      )}

      <button
        className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
        style={{ width: "100%", height: 42, position: "relative" }}
        onClick={handleSubmit}
        disabled={saving || !supplierId}
      >
        <span className="btn_text">
          Submit {supplyTab === "ingredients" ? "Ingredient" : "Machinery"}{" "}
          Request
          {activeCount > 1 ? "s" : ""}
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

  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [totalCost, setTotalCost] = useState("");

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
function SupplyRequestRow({ req, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [receiving, setReceiving] = useState(false);

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  // Normalise ingredient items and machinery items into one unified list
  const ingItems = (req.items || []).map((it) => ({
    id: it.id,
    entity: it.ingredient,
    isMach: false,
    quantity: it.quantity,
    suppliedQuantity: it.suppliedQuantity,
    priceAtTime: it.priceAtTime,
    unit: it.ingredient?.unit || "",
  }));
  const machItems = (req.supplyRequestMachineryItems || []).map((it) => ({
    id: it.id,
    entity: it.machinery,
    isMach: true,
    quantity: it.quantity,
    suppliedQuantity: it.suppliedQuantity,
    priceAtTime: it.priceAtTime,
    unit: "unit",
  }));
  const allItems = [...ingItems, ...machItems];

  const supplierName =
    req.supplier?.businessName || req.supplier?.user?.name || "Supplier";
  const firstNames = allItems
    .slice(0, 2)
    .map((it) => it.entity?.name)
    .filter(Boolean)
    .join(", ");
  const title = firstNames || `#${req.id.slice(0, 8).toUpperCase()}`;
  const extraCount = allItems.length > 2 ? allItems.length - 2 : 0;
  const isMachOnly = machItems.length > 0 && ingItems.length === 0;

  const handleReceive = async (e) => {
    e.stopPropagation();
    setReceiving(true);
    try {
      await api.post(`/icart/supply/${req.id}/receive`);
      toast.success("Supply marked as received");
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as received");
    } finally {
      setReceiving(false);
    }
  };

  return (
    <div className="icart_task_card">
      <div
        className="icart_task_card_top"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="icart_task_card_left">
          <div className="icart_task_icon">
            {isMachOnly ? <MdBuild size={14} /> : <MdLocalShipping size={14} />}
          </div>
          <div>
            <div className="icart_task_name">
              {title}
              {extraCount > 0 ? ` +${extraCount} more` : ""}
            </div>
            <div className="icart_task_meta">
              <span>{supplierName}</span>
              <span className="contract_row_dot">·</span>
              <span>
                {allItems.length} item{allItems.length !== 1 ? "s" : ""}
              </span>
              {machItems.length > 0 && (
                <>
                  <span className="contract_row_dot">·</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <MdBuild size={10} /> {machItems.length} mach.
                  </span>
                </>
              )}
              {req.totalAmount > 0 && (
                <>
                  <span className="contract_row_dot">·</span>
                  <span>₦{fmt(req.totalAmount)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusPill status={req.status} />
          {req.status === "SHIPPED" && (
            <button
              className={`app_btn app_btn_confirm${receiving ? " btn_loading" : ""}`}
              style={{
                height: 28,
                padding: "0 10px",
                fontSize: "0.72rem",
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
              }}
              onClick={handleReceive}
              disabled={receiving}
            >
              <span className="btn_text">
                <MdCheck size={13} /> Received
              </span>
              {receiving && (
                <span
                  className="btn_loader"
                  style={{ width: 11, height: 11 }}
                />
              )}
            </button>
          )}
          {expanded ? (
            <MdExpandLess size={16} style={{ color: "var(--text-muted)" }} />
          ) : (
            <MdExpandMore size={16} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </div>

      {expanded && (
        <div className="icart_task_expanded">
          {allItems.map((it) => (
            <div
              key={it.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "7px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {it.entity?.image ? (
                <img
                  src={it.entity.image}
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
                    background: it.isMach
                      ? "rgba(203,108,220,0.08)"
                      : "var(--bg-hover)",
                    border: `1px solid ${it.isMach ? "rgba(203,108,220,0.2)" : "var(--border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {it.isMach ? (
                    <MdBuild size={13} style={{ color: "var(--accent)" }} />
                  ) : (
                    <MdInventory2
                      size={13}
                      style={{ color: "var(--text-muted)" }}
                    />
                  )}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                    }}
                  >
                    {it.entity?.name || "Unknown"}
                  </div>
                  {it.isMach && (
                    <span
                      style={{
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: "rgba(203,108,220,0.1)",
                        color: "var(--accent)",
                        border: "1px solid rgba(203,108,220,0.2)",
                      }}
                    >
                      Machinery
                    </span>
                  )}
                </div>
                <div
                  style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}
                >
                  Requested: {it.quantity?.toLocaleString()}
                  {it.isMach ? "" : ` ${it.unit}`}
                  {it.suppliedQuantity != null &&
                    ` · Supplied: ${it.suppliedQuantity.toLocaleString()}${it.isMach ? "" : ` ${it.unit}`}`}
                </div>
              </div>
              {it.priceAtTime > 0 && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--text-heading)",
                    flexShrink: 0,
                  }}
                >
                  ₦{fmt(it.priceAtTime)}/{it.isMach ? "unit" : it.unit}
                </div>
              )}
            </div>
          ))}

          <div className="icart_task_data" style={{ marginTop: 8 }}>
            {req.invoice && (
              <div className="icart_task_data_row">
                <span className="icart_meta_key">Invoice</span>
                <span
                  className="icart_meta_val"
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      padding: "1px 7px",
                      borderRadius: 999,
                      background:
                        req.invoice.status === "PAID"
                          ? "rgba(34,197,94,0.1)"
                          : "rgba(234,179,8,0.1)",
                      color:
                        req.invoice.status === "PAID" ? "#16a34a" : "#ca8a04",
                      border: `1px solid ${req.invoice.status === "PAID" ? "rgba(34,197,94,0.25)" : "rgba(234,179,8,0.25)"}`,
                    }}
                  >
                    {req.invoice.status}
                  </span>
                  ₦{fmt(req.invoice.total)}
                </span>
              </div>
            )}
            {req.requester?.fullName && (
              <div className="icart_task_data_row">
                <span className="icart_meta_key">Requester</span>
                <span className="icart_meta_val">{req.requester.fullName}</span>
              </div>
            )}
            {req.createdAt && (
              <div className="icart_task_data_row">
                <span className="icart_meta_key">Date</span>
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
      const d = res.data.data;
      const all = d?.requests || d?.items || (Array.isArray(d) ? d : []);
      setSupplyRequests(all);
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
              <SupplyRequestRow
                key={req.id}
                req={req}
                onRefresh={fetchSupply}
              />
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
