import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdHistory,
  MdInventory2,
  MdLocalShipping,
  MdCheck,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import api from "../../api/axios";

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

/* ── Add Inventory Form ─────────────────────────────────────── */
function AddInventoryForm({ cartId, onAdded }) {
  const [type, setType] = useState("INGREDIENT");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);

  const itemIdKey =
    type === "INGREDIENT"
      ? "ingredientId"
      : type === "PREP_ITEM"
        ? "prepItemId"
        : "menuItemId";

  const handleSubmit = async () => {
    if (!itemId.trim()) return toast.error("Enter an item ID");
    if (!quantity || isNaN(quantity))
      return toast.error("Enter a valid quantity");

    setSaving(true);
    try {
      await api.post("/icart/inventory", {
        cartId,
        type,
        [itemIdKey]: itemId.trim(),
        quantity: Number(quantity),
        cost: cost ? Number(cost) : undefined,
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
        <label className="modal-label">Item Type</label>
        <select
          className="modal-input"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="INGREDIENT">Ingredient</option>
          <option value="PREP_ITEM">Prep Item</option>
          <option value="MENU_ITEM">Menu Item</option>
        </select>
      </div>
      <div className="form-field">
        <label className="modal-label">
          {type === "INGREDIENT"
            ? "Ingredient"
            : type === "PREP_ITEM"
              ? "Prep Item"
              : "Menu Item"}{" "}
          ID *
        </label>
        <input
          className="modal-input"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          placeholder="Enter UUID"
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="form-field">
          <label className="modal-label">Quantity *</label>
          <input
            className="modal-input"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Cost</label>
          <input
            className="modal-input"
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>
      <button
        className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`}
        style={{ width: "100%", height: 40 }}
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
        className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`}
        style={{ width: "100%", height: 40 }}
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
function InventoryItemRow({ item, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);
  const [cost, setCost] = useState(item.cost || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const itemName =
    item.ingredient?.name ||
    item.prepItem?.name ||
    item.menuItem?.name ||
    item.ingredientId ||
    item.prepItemId ||
    item.menuItemId ||
    "Item";

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.patch(`/icart/inventory/${item.id}`, {
        quantity: Number(quantity),
        cost: cost ? Number(cost) : undefined,
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
      className={`icart_inventory_row ${isLow ? "icart_inventory_low" : ""}`}
    >
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
            {item.type?.replace("_", " ")}
          </span>
          {isLow && (
            <span
              style={{ color: "#ef4444", fontWeight: 700, fontSize: "0.65rem" }}
            >
              LOW STOCK
            </span>
          )}
        </div>
      </div>

      {editing ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            className="modal-input"
            type="number"
            style={{
              width: 70,
              height: 32,
              padding: "0 8px",
              fontSize: "0.8rem",
            }}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
          />
          <input
            className="modal-input"
            type="number"
            style={{
              width: 70,
              height: 32,
              padding: "0 8px",
              fontSize: "0.8rem",
            }}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Cost"
          />
          <button
            className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`}
            style={{ height: 32, padding: "0 12px", fontSize: "0.72rem" }}
            onClick={handleUpdate}
            disabled={saving}
          >
            <span className="btn_text">Save</span>
            {saving && (
              <span className="btn_loader" style={{ width: 12, height: 12 }} />
            )}
          </button>
          <button
            className="app_btn app_btn_cancel"
            style={{ height: 32, padding: "0 10px", fontSize: "0.72rem" }}
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div className="icart_operator_name" style={{ fontSize: "0.9rem" }}>
              {item.quantity}
            </div>
            {item.cost && (
              <div className="icart_operator_meta">
                ₦{Number(item.cost).toLocaleString()}
              </div>
            )}
          </div>
          <button
            className="icart_icon_action_btn"
            onClick={() => setEditing(true)}
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
  const [view, setView] = useState("stock"); // stock | supply | history | addItem | addSupply
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
        all.filter
          ? all.filter(
              (r) =>
                !r.cartId || r.cartId === cart.id || r.cart?.id === cart.id,
            )
          : all,
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

  const totalValue = inventory.reduce((sum, i) => sum + (i.cost || 0), 0);
  const lowStock = inventory.filter((i) => i.quantity < 5).length;

  return (
    <div className="icart_tab_content">
      {/* Summary row */}
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
              ⚠ {lowStock} low stock
            </div>
          )}
          {totalValue > 0 && (
            <div className="icart_summary_chip">
              ₦{totalValue.toLocaleString()} total
            </div>
          )}
        </div>
      )}

      {/* Sub-nav */}
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
          onClick={() =>
            setView(
              view === "stock" || view === "history" ? "addItem" : "addSupply",
            )
          }
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
          <div className="icart_tasks_list">
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
                    {entry.performedBy?.name && (
                      <> · {entry.performedBy.name}</>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    className="icart_operator_name"
                    style={{
                      fontSize: "0.88rem",
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
