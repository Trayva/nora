import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import KioskOrders from "../../kiosk/KioskOrders";
import {
  MdArrowBack,
  MdOutlineShoppingBag,
  MdTask,
  MdInventory2,
  MdLocalShipping,
  MdMenuBook,
  MdSchool,
  MdPointOfSale,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdExpandMore,
  MdExpandLess,
  MdCheck,
  MdClose,
  MdAdd,
  MdImage,
  MdPlayCircle,
  MdRestaurantMenu,
  MdCircle,
  MdSearch,
  MdHistory,
  MdRemoveCircleOutline,
  MdArrowForward,
} from "react-icons/md";
import { LuStore } from "react-icons/lu";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function StatusChip({ status }) {
  const colors = {
    PENDING: {
      bg: "rgba(234,179,8,0.1)",
      color: "#ca8a04",
      border: "rgba(234,179,8,0.25)",
    },
    IN_PROGRESS: {
      bg: "rgba(59,130,246,0.1)",
      color: "#3b82f6",
      border: "rgba(59,130,246,0.25)",
    },
    COMPLETED: {
      bg: "rgba(34,197,94,0.1)",
      color: "#16a34a",
      border: "rgba(34,197,94,0.25)",
    },
    MISSED: {
      bg: "rgba(239,68,68,0.1)",
      color: "#ef4444",
      border: "rgba(239,68,68,0.25)",
    },
    SUBMITTED: {
      bg: "rgba(168,85,247,0.1)",
      color: "#a855f7",
      border: "rgba(168,85,247,0.25)",
    },
    CREATED: {
      bg: "rgba(107,114,128,0.1)",
      color: "#6b7280",
      border: "rgba(107,114,128,0.25)",
    },
    ACTIVE: {
      bg: "rgba(34,197,94,0.1)",
      color: "#16a34a",
      border: "rgba(34,197,94,0.25)",
    },
    RECEIVED: {
      bg: "rgba(34,197,94,0.1)",
      color: "#16a34a",
      border: "rgba(34,197,94,0.25)",
    },
    SHIPPED: {
      bg: "rgba(168,85,247,0.1)",
      color: "#a855f7",
      border: "rgba(168,85,247,0.25)",
    },
    SUPPLIER_REVIEWED: {
      bg: "rgba(59,130,246,0.1)",
      color: "#3b82f6",
      border: "rgba(59,130,246,0.25)",
    },
  };
  const s = colors[status] || colors.PENDING;
  return (
    <span
      className="kiosk_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      <MdCircle size={5} /> {status}
    </span>
  );
}

const TABS = [
  { key: "tasks", label: "Tasks", icon: <MdTask size={15} /> },
  { key: "inventory", label: "Inventory", icon: <MdInventory2 size={15} /> },
  { key: "menu", label: "Menu", icon: <MdMenuBook size={15} /> },
  { key: "elearning", label: "E-Learning", icon: <MdSchool size={15} /> },
  { key: "sales", label: "Sales", icon: <MdPointOfSale size={15} /> },
  { key: "orders", label: "Orders", icon: <MdOutlineShoppingBag size={15} /> },
];

/* TASKS */
function TaskSubmitForm({ task, onSubmitted }) {
  const schema = task.template?.schema?.fields || [];
  const [formData, setFormData] = useState(
    Object.fromEntries(
      schema.map((f) => [f.label, f.type === "checkbox" ? false : ""]),
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.patch(`/kiosk/tasks/${task.id}/submit`, { data: formData });
      toast.success("Task submitted");
      onSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginTop: 12,
      }}
    >
      {schema.map((field, i) => (
        <div key={i} className="form-field">
          <label className="modal-label">{field.label}</label>
          {field.type === "checkbox" ? (
            <button
              className={`kiosk_checkbox_btn ${formData[field.label] ? "kiosk_checkbox_checked" : ""}`}
              onClick={() =>
                setFormData((p) => ({ ...p, [field.label]: !p[field.label] }))
              }
            >
              {formData[field.label] ? (
                <MdCheckBox size={18} />
              ) : (
                <MdCheckBoxOutlineBlank size={18} />
              )}
              <span>{formData[field.label] ? "Done" : "Mark as done"}</span>
            </button>
          ) : (
            <input
              className="modal-input"
              type={field.type === "number" ? "number" : "text"}
              value={formData[field.label]}
              onChange={(e) =>
                setFormData((p) => ({ ...p, [field.label]: e.target.value }))
              }
            />
          )}
        </div>
      ))}
      <button
        className={`app_btn app_btn_confirm${submitting ? " btn_loading" : ""}`}
        style={{ height: 40, position: "relative" }}
        onClick={handleSubmit}
        disabled={submitting}
      >
        <span className="btn_text">Submit Task</span>
        {submitting && (
          <span className="btn_loader" style={{ width: 14, height: 14 }} />
        )}
      </button>
    </div>
  );
}

function TaskCard({ task, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const isPending = task.status === "PENDING" || task.status === "IN_PROGRESS";
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "13px 14px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="kiosk_task_icon">
          <MdTask size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kiosk_task_name">
            {task.template?.name || task.name || "Task"}
          </div>
          <div className="kiosk_task_meta">
            {task.template?.recurrence && (
              <span>{task.template.recurrence}</span>
            )}
            {task.dueAt && (
              <>
                <span className="contract_row_dot">·</span>
                <span>Due {fmtDate(task.dueAt)}</span>
              </>
            )}
          </div>
        </div>
        <StatusChip status={task.status} />
        {expanded ? (
          <MdExpandLess size={16} style={{ color: "var(--text-muted)" }} />
        ) : (
          <MdExpandMore size={16} style={{ color: "var(--text-muted)" }} />
        )}
      </div>
      {expanded && (
        <div
          style={{
            padding: "0 14px 14px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {task.data && Object.keys(task.data).length > 0 && (
            <div className="kiosk_task_data" style={{ marginTop: 12 }}>
              {Object.entries(task.data).map(([k, v]) => (
                <div key={k} className="kiosk_task_data_row">
                  <span className="kiosk_meta_key">{k}</span>
                  <span className="kiosk_meta_val">
                    {typeof v === "boolean" ? (
                      v ? (
                        <MdCheck size={14} style={{ color: "#22c55e" }} />
                      ) : (
                        <MdClose size={14} style={{ color: "#ef4444" }} />
                      )
                    ) : (
                      String(v)
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          {task.managerComments && (
            <div className="kiosk_manager_comment" style={{ marginTop: 10 }}>
              <span className="kiosk_meta_key">Manager Note</span>
              <p>{task.managerComments}</p>
            </div>
          )}
          {isPending && (
            <button
              className="app_btn app_btn_confirm"
              style={{
                marginTop: 12,
                height: 36,
                padding: "0 16px",
                fontSize: "0.78rem",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
              onClick={() => setShowSubmit((v) => !v)}
            >
              {showSubmit ? "Cancel" : "Complete Task"}
            </button>
          )}
          {showSubmit && (
            <TaskSubmitForm
              task={task}
              onSubmitted={() => {
                setShowSubmit(false);
                onRefresh();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function TasksTab({ kioskId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/kiosk/tasks?kioskId=${kioskId}`);
      setTasks(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTasks();
  }, [kioskId]);
  if (loading)
    return (
      <div className="drawer_loading">
        <div className="page_loader_spinner" />
      </div>
    );
  return tasks.length === 0 ? (
    <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
      <MdTask size={28} style={{ opacity: 0.3 }} />
      <span>No pending tasks</span>
    </div>
  ) : (
    <div>
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} onRefresh={fetchTasks} />
      ))}
    </div>
  );
}

/* INVENTORY */
const SEARCH_URL = (q) =>
  `/library/ingredient?returnPrep=true&search=${encodeURIComponent(q)}&limit=8`;
const REASON_OPTIONS = ["Usage", "Waste", "Damage", "Correction", "Other"];
function toBase(val, unit) {
  const n = Number(val);
  if (unit === "kg") return n * 1000;
  if (unit === "L") return n * 1000;
  return n;
}
function getUnitOptions(baseUnit) {
  if (!baseUnit) return ["g", "kg", "ml", "L"];
  const u = baseUnit.toLowerCase();
  if (u === "g" || u === "kg") return ["g", "kg"];
  if (u === "ml" || u === "l" || u === "liter") return ["ml", "L"];
  return ["unit"];
}

export function InventoryTab({ kioskId }) {
  const [view, setView] = useState("stock");
  const [inventory, setInventory] = useState([]);
  const [supply, setSupply] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usageItem, setUsageItem] = useState(null);
  const [usageQty, setUsageQty] = useState("");
  const [usageUnit, setUsageUnit] = useState("g");
  const [usageReason, setUsageReason] = useState("Usage");
  const [usageNotes, setUsageNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplyItems, setSupplyItems] = useState([
    { query: "", ingredient: null, quantity: "", unit: "g" },
  ]);
  const [submittingSupply, setSubmittingSupply] = useState(false);
  const [searchResults, setSearchResults] = useState({});
  const [searching, setSearching] = useState({});

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/kiosk/inventory/kiosk/${kioskId}`);
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
      const res = await api.get(`/kiosk/supply?kioskId=${kioskId}`);
      setSupply(
        res.data.data?.requests || res.data.data?.items || res.data.data || [],
      );
    } catch {
      toast.error("Failed to load supply");
    } finally {
      setLoading(false);
    }
  };
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/kiosk/inventory/history?kioskId=${kioskId}`);
      setHistory(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (view === "stock") fetchStock();
    else if (view === "supply") fetchSupply();
    else if (view === "history") fetchHistory();
  }, [view]);
  useEffect(() => {
    api
      .get("/supplier")
      .then((r) => {
        const d = r.data.data;
        setSuppliers(Array.isArray(d) ? d : d?.suppliers || d?.items || []);
      })
      .catch(() => {});
  }, []);

  const handleRecordUsage = async () => {
    if (!usageItem || !usageQty || Number(usageQty) <= 0)
      return toast.error("Enter a valid quantity");
    const notesStr = usageNotes.trim()
      ? `[${usageReason}] ${usageNotes.trim()}`
      : usageReason;
    setSaving(true);
    try {
      await api.post("/kiosk/inventory/record-usage", {
        itemId: usageItem.id,
        quantity: toBase(usageQty, usageUnit),
        notes: notesStr,
      });
      toast.success("Usage recorded");
      setUsageItem(null);
      setUsageQty("");
      setUsageNotes("");
      fetchStock();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const searchIngredient = async (idx, q) => {
    if (!q.trim()) {
      setSearchResults((p) => ({ ...p, [idx]: [] }));
      return;
    }
    setSearching((p) => ({ ...p, [idx]: true }));
    try {
      const r = await api.get(SEARCH_URL(q));
      const d = r.data.data;
      const rawList = Array.isArray(d) ? d : d?.data || d?.ingredient || [];
      setSearchResults((p) => ({
        ...p,
        [idx]: rawList.map((i) => ({
          ...i,
          _type: i._type || (i.unit ? "INGREDIENT" : "PREP_ITEM"),
        })),
      }));
    } catch {
      setSearchResults((p) => ({ ...p, [idx]: [] }));
    } finally {
      setSearching((p) => ({ ...p, [idx]: false }));
    }
  };

  const handleSubmitSupply = async () => {
    if (!supplierId) return toast.error("Select a supplier");
    const valid = supplyItems.filter(
      (r) => r.ingredient && r.quantity && Number(r.quantity) > 0,
    );
    if (!valid.length) return toast.error("Add at least one ingredient");
    setSubmittingSupply(true);
    try {
      await api.post("/kiosk/supply", {
        kioskId,
        supplierId,
        items: valid.map((row) => ({
          ingredientId: row.ingredient.id,
          quantity: toBase(row.quantity, row.unit),
        })),
      });
      toast.success("Supply request submitted");
      setShowSupplyForm(false);
      setSupplyItems([
        { query: "", ingredient: null, quantity: "", unit: "g" },
      ]);
      setSupplierId("");
      setView("supply");
      setTimeout(() => fetchSupply(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSubmittingSupply(false);
    }
  };

  return (
    <div>
      <div className="kiosk_sub_nav" style={{ marginBottom: 16 }}>
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
            className={`kiosk_sub_nav_btn ${view === sv.key ? "kiosk_sub_nav_active" : ""}`}
            onClick={() => {
              setView(sv.key);
              setShowSupplyForm(false);
            }}
          >
            {sv.icon} {sv.label}
          </button>
        ))}
        {view === "supply" && (
          <button
            className={`kiosk_sub_nav_btn ${showSupplyForm ? "kiosk_sub_nav_active" : ""}`}
            style={{ marginLeft: "auto" }}
            onClick={() => setShowSupplyForm((v) => !v)}
          >
            <MdAdd size={13} /> Request
          </button>
        )}
      </div>
      {loading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      ) : view === "stock" ? (
        inventory.length === 0 ? (
          <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
            <MdInventory2 size={28} style={{ opacity: 0.3 }} />
            <span>No inventory items</span>
          </div>
        ) : (
          inventory.map((item) => {
            const name = item.ingredient?.name || item.prepItem?.name || "Item";
            const img = item.ingredient?.image || item.prepItem?.image || null;
            const isActive = usageItem?.id === item.id;
            const isLow = item.quantity < 5;
            return (
              <div
                key={item.id}
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
                  {img ? (
                    <img
                      src={img}
                      alt={name}
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
                      <MdInventory2
                        size={16}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="kiosk_task_name">{name}</div>
                    <div className="kiosk_task_meta">
                      <span>{item.type?.replace("_", " ")}</span>
                      {isLow && (
                        <span style={{ color: "#ef4444", fontWeight: 700 }}>
                          · ⚠ LOW
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      flexShrink: 0,
                      marginRight: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: "var(--text-heading)",
                      }}
                    >
                      {item.quantity?.toLocaleString()}
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {item.ingredient?.unit || "units"}
                    </div>
                  </div>
                  <button
                    className="kiosk_icon_action_btn"
                    title="Record usage"
                    style={{ color: isActive ? "var(--accent)" : undefined }}
                    onClick={() => {
                      setUsageItem(isActive ? null : item);
                      setUsageQty("");
                      setUsageNotes("");
                    }}
                  >
                    <MdRemoveCircleOutline size={14} />
                  </button>
                </div>
                {isActive && (
                  <div
                    style={{
                      padding: "0 14px 14px",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        paddingTop: 10,
                        paddingBottom: 8,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Record Usage
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input
                        className="modal-input"
                        type="number"
                        style={{ flex: 1 }}
                        placeholder="Quantity used"
                        value={usageQty}
                        onChange={(e) => setUsageQty(e.target.value)}
                      />
                      {(() => {
                        const uOpts = getUnitOptions(
                          item.ingredient?.unit || item.prepItem?.unit,
                        );
                        return uOpts.length > 1 ? (
                          <select
                            className="modal-input"
                            style={{ width: 76 }}
                            value={usageUnit}
                            onChange={(e) => setUsageUnit(e.target.value)}
                          >
                            {uOpts.map((u) => (
                              <option key={u}>{u}</option>
                            ))}
                          </select>
                        ) : (
                          <div
                            className="modal-input"
                            style={{
                              width: 76,
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
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <select
                        className="modal-input"
                        value={usageReason}
                        onChange={(e) => setUsageReason(e.target.value)}
                      >
                        {REASON_OPTIONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                      <input
                        className="modal-input"
                        placeholder="Notes (optional)"
                        value={usageNotes}
                        onChange={(e) => setUsageNotes(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="app_btn app_btn_cancel"
                        style={{ flex: 1, height: 36 }}
                        onClick={() => setUsageItem(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
                        style={{ flex: 2, height: 36, position: "relative" }}
                        onClick={handleRecordUsage}
                        disabled={saving}
                      >
                        <span className="btn_text">Record</span>
                        {saving && (
                          <span
                            className="btn_loader"
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )
      ) : view === "supply" ? (
        <>
          {showSupplyForm && (
            <div
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div className="drawer_section_title">New Supply Request</div>
              <div className="form-field">
                <label className="modal-label">Supplier *</label>
                <select
                  className="modal-input"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">Select supplier…</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.businessName || s.user?.fullName || s.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              {supplyItems.map((row, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
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
                      }}
                    >
                      Ingredient {i + 1}
                    </span>
                    {supplyItems.length > 1 && (
                      <button
                        className="kiosk_icon_action_btn kiosk_icon_danger"
                        style={{ width: 22, height: 22 }}
                        onClick={() =>
                          setSupplyItems((p) => p.filter((_, idx) => idx !== i))
                        }
                      >
                        <MdClose size={12} />
                      </button>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <div className="kiosk_search_wrap" style={{ height: 40 }}>
                      <MdSearch
                        size={15}
                        style={{ color: "var(--text-muted)" }}
                      />
                      <input
                        className="modal-input"
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          flex: 1,
                          outline: "none",
                        }}
                        placeholder="Search ingredient…"
                        value={row.query}
                        onChange={(e) => {
                          const q = e.target.value;
                          setSupplyItems((p) => {
                            const u = [...p];
                            u[i] = { ...u[i], query: q, ingredient: null };
                            return u;
                          });
                          searchIngredient(i, q);
                        }}
                      />
                      {row.ingredient && (
                        <MdCheck size={14} style={{ color: "#16a34a" }} />
                      )}
                    </div>
                    {searchResults[i]?.length > 0 && !row.ingredient && (
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
                          maxHeight: 160,
                          overflowY: "auto",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                        }}
                      >
                        {(searching[i] ? [] : searchResults[i]).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSupplyItems((p) => {
                                const u = [...p];
                                u[i] = {
                                  ...u[i],
                                  ingredient: item,
                                  query: item.name,
                                };
                                return u;
                              });
                              setSearchResults((p) => ({ ...p, [i]: [] }));
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px 12px",
                              cursor: "pointer",
                              borderBottom: "1px solid var(--border)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "var(--bg-hover)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <span
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "var(--text-body)",
                              }}
                            >
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {row.ingredient && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        className="modal-input"
                        type="number"
                        style={{ flex: 1 }}
                        placeholder="Quantity"
                        value={row.quantity}
                        onChange={(e) =>
                          setSupplyItems((p) => {
                            const u = [...p];
                            u[i] = { ...u[i], quantity: e.target.value };
                            return u;
                          })
                        }
                      />
                      <select
                        className="modal-input"
                        style={{ width: 76 }}
                        value={row.unit}
                        onChange={(e) =>
                          setSupplyItems((p) => {
                            const u = [...p];
                            u[i] = { ...u[i], unit: e.target.value };
                            return u;
                          })
                        }
                      >
                        {getUnitOptions(row.ingredient?.unit).map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() =>
                  setSupplyItems((p) => [
                    ...p,
                    { query: "", ingredient: null, quantity: "", unit: "g" },
                  ])
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
                }}
              >
                <MdAdd size={14} /> Add ingredient
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="app_btn app_btn_cancel"
                  style={{ flex: 1, height: 38 }}
                  onClick={() => setShowSupplyForm(false)}
                >
                  Cancel
                </button>
                <button
                  className={`app_btn app_btn_confirm${submittingSupply ? " btn_loading" : ""}`}
                  style={{ flex: 2, height: 38, position: "relative" }}
                  onClick={handleSubmitSupply}
                  disabled={submittingSupply}
                >
                  <span className="btn_text">Submit Request</span>
                  {submittingSupply && (
                    <span
                      className="btn_loader"
                      style={{ width: 13, height: 13 }}
                    />
                  )}
                </button>
              </div>
            </div>
          )}
          {supply.length === 0 && !showSupplyForm ? (
            <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
              <MdLocalShipping size={28} style={{ opacity: 0.3 }} />
              <span>No supply requests</span>
            </div>
          ) : (
            supply.map((req) => (
              <div
                key={req.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 14px",
                  }}
                >
                  <div className="kiosk_task_icon">
                    <MdLocalShipping size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="kiosk_task_name">
                      {req.supplier?.businessName || "Supply Request"}
                    </div>
                    <div className="kiosk_task_meta">
                      <span>{req.items?.length || 0} items</span>
                      <span className="contract_row_dot">·</span>
                      <span>{fmtDate(req.createdAt)}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      padding: "3px 9px",
                      borderRadius: 999,
                      background: "rgba(234,179,8,0.1)",
                      color: "#ca8a04",
                      border: "1px solid rgba(234,179,8,0.25)",
                      flexShrink: 0,
                    }}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </>
      ) : history.length === 0 ? (
        <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
          <MdHistory size={28} style={{ opacity: 0.3 }} />
          <span>No history yet</span>
        </div>
      ) : (
        history.map((entry, i) => (
          <div
            key={entry.id || i}
            className="kiosk_history_row"
            style={{ marginBottom: 6 }}
          >
            <div className="kiosk_task_icon">
              {entry.delta > 0 ? (
                <MdAdd size={13} style={{ color: "#22c55e" }} />
              ) : (
                <MdRemoveCircleOutline size={13} style={{ color: "#ef4444" }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="kiosk_task_name">
                {entry.ingredient?.name || entry.item?.name || "Item"}
              </div>
              <div className="kiosk_task_meta">
                {entry.notes || (entry.delta > 0 ? "Added" : "Removed")}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: entry.delta > 0 ? "#22c55e" : "#ef4444",
                }}
              >
                {entry.delta > 0 ? "+" : ""}
                {entry.delta ?? entry.quantity}
              </div>
              <div className="kiosk_operator_meta">
                {fmtDate(entry.createdAt)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function MenuTab({ menuItems }) {
  if (!menuItems?.length)
    return (
      <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
        <MdMenuBook size={28} style={{ opacity: 0.3 }} />
        <span>No menu items assigned</span>
      </div>
    );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {menuItems.map((item, idx) => {
        const name = item.name || item.menuItem?.name || "Item";
        const img = item.image || item.menuItem?.image;
        const price = item.sellingPrice || item.menuItem?.sellingPrice || 0;
        return (
          <div
            key={item.id || idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          >
            {img ? (
              <img
                src={img}
                alt={name}
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
                <MdImage size={18} style={{ color: "var(--text-muted)" }} />
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
                {name}
              </div>
              {item.description && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: 1,
                  }}
                >
                  {item.description}
                </div>
              )}
              {item.ticketTime > 0 && (
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  ⏱ {item.ticketTime} min
                </div>
              )}
            </div>
            {price > 0 && (
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  color: "var(--text-heading)",
                  flexShrink: 0,
                }}
              >
                ₦{Number(price).toLocaleString()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* E-LEARNING - all patches applied */
function getEmbedUrl(src) {
  if (!src) return null;
  const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch)
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=0&title=0&byline=0&portrait=0`;
  const ytMatch = src.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return null;
}

function VideoBlock({ src, label, onWatched }) {
  if (src) {
    const embedUrl = getEmbedUrl(src);
    if (embedUrl) {
      return (
        <div>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              borderRadius: 12,
              overflow: "hidden",
              background: "#000",
            }}
          >
            <iframe
              src={embedUrl}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              title="Tutorial video"
            />
          </div>
          {onWatched && (
            <button
              onClick={onWatched}
              style={{
                marginTop: 8,
                width: "100%",
                height: 36,
                borderRadius: 9,
                border: "1px solid rgba(34,197,94,0.3)",
                background: "rgba(34,197,94,0.07)",
                color: "#16a34a",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <MdCheck size={15} /> Mark as Watched
            </button>
          )}
        </div>
      );
    }
    return (
      <video
        src={src}
        controls
        playsInline
        onEnded={onWatched}
        style={{
          width: "100%",
          borderRadius: 12,
          background: "#000",
          maxHeight: 240,
          display: "block",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16/9",
        background: "linear-gradient(135deg,#0f0f0f 0%,#1a1a1a 100%)",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(203,108,220,0.1)",
          border: "1.5px solid rgba(203,108,220,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MdPlayCircle size={26} style={{ color: "rgba(203,108,220,0.5)" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          No video available
        </div>
        {label && (
          <div
            style={{
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.25)",
              marginTop: 2,
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

function LearnRecipeStep({ step, index }) {
  const ing = step.ingredient || step.prepItem;
  const typeColor =
    step.type === "variant"
      ? {
          bg: "rgba(203,108,220,0.1)",
          color: "var(--accent)",
          border: "rgba(203,108,220,0.25)",
        }
      : step.type === "prep"
        ? {
            bg: "rgba(59,130,246,0.1)",
            color: "#3b82f6",
            border: "rgba(59,130,246,0.25)",
          }
        : {
            bg: "rgba(34,197,94,0.1)",
            color: "#16a34a",
            border: "rgba(34,197,94,0.25)",
          };
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--bg-active)",
          border: "1px solid rgba(203,108,220,0.3)",
          color: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.65rem",
          fontWeight: 900,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {ing && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: step.instruction ? 4 : 0,
            }}
          >
            {ing.image ? (
              <img
                src={ing.image}
                alt={ing.name}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : null}
            <div>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--text-body)",
                }}
              >
                {ing.name}
              </span>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: 4,
                  background: typeColor.bg,
                  color: typeColor.color,
                  border: `1px solid ${typeColor.border}`,
                  marginLeft: 6,
                }}
              >
                {step.type}
              </span>
              {step.quantity != null && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--accent)",
                    fontWeight: 700,
                    marginLeft: 6,
                  }}
                >
                  {step.quantity}
                  {ing.unit}
                </span>
              )}
            </div>
          </div>
        )}
        {step.instruction && (
          <p
            style={{
              margin: 0,
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              lineHeight: 1.55,
              paddingLeft: ing ? 36 : 0,
            }}
          >
            {step.instruction}
          </p>
        )}
      </div>
    </div>
  );
}

function MenuItemSummaryView({ summary, onVideoWatched, videoWatched }) {
  const [learnSection, setLearnSection] = useState("recipe");
  const [activeVariant, setActiveVariant] = useState(0);
  const item = summary.menuItem || summary;
  const recipe = summary.recipe || item.recipe || [];
  const extras = summary.extras || item.extras || [];
  const variants = summary.variants || item.variants || [];
  const prepItems = summary.prepItems || [];
  const currentRecipe =
    variants.length > 0 ? variants[activeVariant]?.recipe || recipe : recipe;
  const tabs = [
    { key: "recipe", label: "Recipe", count: currentRecipe.length },
    ...(extras.length > 0
      ? [{ key: "extras", label: "Extras", count: extras.length }]
      : []),
    ...(prepItems.length > 0
      ? [{ key: "prep", label: "Prep Items", count: prepItems.length }]
      : []),
  ];
  return (
    <div>
      {item.image && (
        <div
          style={{
            position: "relative",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <img
            src={item.image}
            alt={item.name}
            style={{
              width: "100%",
              height: 160,
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.72) 100%)",
            }}
          />
          <div
            style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}
          >
            <div
              style={{ fontSize: "1.05rem", fontWeight: 900, color: "#fff" }}
            >
              {item.name}
            </div>
          </div>
        </div>
      )}
      {item.description && (
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            lineHeight: 1.6,
            margin: "0 0 14px",
          }}
        >
          {item.description}
        </p>
      )}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: "0.62rem",
            fontWeight: 900,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 3,
              height: 11,
              borderRadius: 2,
              background: "var(--accent)",
              display: "inline-block",
            }}
          />
          Tutorial Video
        </div>
        <VideoBlock
          src={item.tutorialVideo}
          label="Tutorial not yet uploaded"
          onWatched={onVideoWatched}
        />
        {item.tutorialVideo && !videoWatched && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "rgba(234,179,8,0.08)",
              border: "1px solid rgba(234,179,8,0.25)",
              borderRadius: 8,
              fontSize: "0.74rem",
              color: "#ca8a04",
              fontWeight: 600,
            }}
          >
            ⚠ Watch the full video then tap "Mark as Watched" to unlock the test
          </div>
        )}
        {item.tutorialVideo && videoWatched && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "rgba(34,197,94,0.07)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 8,
              fontSize: "0.74rem",
              color: "#16a34a",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <MdCheck size={14} /> Tutorial watched — test is unlocked!
          </div>
        )}
      </div>
      {tabs.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 14,
            background: "var(--bg-hover)",
            borderRadius: 9,
            padding: 3,
            border: "1px solid var(--border)",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setLearnSection(t.key)}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: 7,
                border: "none",
                background:
                  learnSection === t.key ? "var(--bg-card)" : "transparent",
                color:
                  learnSection === t.key
                    ? "var(--accent)"
                    : "var(--text-muted)",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      )}
      {learnSection === "recipe" && (
        <div>
          {!currentRecipe?.length ? (
            <div
              style={{
                padding: "14px 0",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              No recipe steps defined
            </div>
          ) : (
            currentRecipe.map((step, i) => (
              <LearnRecipeStep key={step.id || i} step={step} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── ScoresView — PATCHED: score IS already %, pass = 90 ── */
function ScoresView({ onBack }) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get("/library/elearning/scores")
      .then((r) => {
        const d = r.data.data;
        setScores(
          Array.isArray(d) ? d : d?.tests || d?.items || d?.scores || [],
        );
      })
      .catch(() => toast.error("Failed to load scores"))
      .finally(() => setLoading(false));
  }, []);
  // PATCH: pass threshold = 90
  const scoreColor = (pct) =>
    pct >= 90 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#ef4444";
  const scoreBg = (pct) =>
    pct >= 90
      ? "rgba(34,197,94,0.1)"
      : pct >= 50
        ? "rgba(234,179,8,0.1)"
        : "rgba(239,68,68,0.1)";
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
          fontFamily: "inherit",
        }}
      >
        <MdArrowBack size={15} /> Back to Learning
      </button>
      <div
        style={{
          fontSize: "0.95rem",
          fontWeight: 900,
          color: "var(--text-heading)",
          marginBottom: 4,
        }}
      >
        Test History
      </div>
      <div
        style={{
          fontSize: "0.74rem",
          color: "var(--text-muted)",
          marginBottom: 16,
        }}
      >
        Your past e-learning test results
      </div>
      {loading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      ) : scores.length === 0 ? (
        <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
          <MdHistory size={28} style={{ opacity: 0.3 }} />
          <span>No test attempts yet</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {scores.map((entry, i) => {
            // PATCH: API score IS already a percentage (0-100), pass = 90
            const pct = entry.score != null ? Math.round(entry.score) : null;
            const passed = pct != null ? pct >= 90 : null;
            return (
              <div
                key={entry.id || i}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 13,
                  padding: "13px 15px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: pct != null ? scoreBg(pct) : "var(--bg-hover)",
                    border: `2px solid ${pct != null ? scoreColor(pct) : "var(--border)"}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 900,
                      color:
                        pct != null ? scoreColor(pct) : "var(--text-muted)",
                      lineHeight: 1,
                    }}
                  >
                    {pct != null ? `${pct}%` : "—"}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                      marginBottom: 3,
                    }}
                  >
                    {entry.menuItemName ||
                      entry.menuItem?.name ||
                      `Test · ${(entry.id || "").slice(0, 6).toUpperCase()}`}
                  </div>
                  <div className="kiosk_task_meta">
                    {entry.menuIds?.length > 0 && (
                      <span>
                        {entry.menuIds.length} menu item
                        {entry.menuIds.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {entry.createdAt && (
                      <>
                        <span className="contract_row_dot">·</span>
                        <span>{fmtDate(entry.createdAt)}</span>
                      </>
                    )}
                  </div>
                </div>
                {passed != null && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      padding: "3px 9px",
                      borderRadius: 999,
                      flexShrink: 0,
                      background: passed
                        ? "rgba(34,197,94,0.1)"
                        : "rgba(239,68,68,0.1)",
                      color: passed ? "#16a34a" : "#ef4444",
                      border: `1px solid ${passed ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                    }}
                  >
                    {passed ? "Passed" : "Failed"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── TestResultView — PATCHED: pass=90, correct buttons, grade labels ── */
function TestResultView({ result, onRetake, onDone }) {
  const pct = result.percentage != null ? Math.round(result.percentage) : null;
  // PATCH: pass threshold = 90
  const passed = result.passed ?? (pct != null ? pct >= 90 : null);
  const color =
    pct != null
      ? pct >= 90
        ? "#16a34a"
        : pct >= 50
          ? "#ca8a04"
          : "#ef4444"
      : "var(--text-muted)";
  const bg =
    pct != null
      ? pct >= 90
        ? "rgba(34,197,94,0.08)"
        : pct >= 50
          ? "rgba(234,179,8,0.08)"
          : "rgba(239,68,68,0.08)"
      : "var(--bg-hover)";
  const grade =
    pct == null
      ? null
      : pct >= 90
        ? {
            letter: "A",
            label: "Distinction",
            color: "#16a34a",
            bg: "rgba(34,197,94,0.1)",
            border: "rgba(34,197,94,0.3)",
            range: "90–100%",
          }
        : pct >= 75
          ? {
              letter: "B",
              label: "Credit",
              color: "#3b82f6",
              bg: "rgba(59,130,246,0.1)",
              border: "rgba(59,130,246,0.3)",
              range: "75–89%",
            }
          : pct >= 60
            ? {
                letter: "C",
                label: "Merit",
                color: "#ca8a04",
                bg: "rgba(234,179,8,0.1)",
                border: "rgba(234,179,8,0.3)",
                range: "60–74%",
              }
            : pct >= 50
              ? {
                  letter: "D",
                  label: "Pass",
                  color: "#f97316",
                  bg: "rgba(249,115,22,0.1)",
                  border: "rgba(249,115,22,0.3)",
                  range: "50–59%",
                }
              : {
                  letter: "F",
                  label: "Fail — Retake Required",
                  color: "#ef4444",
                  bg: "rgba(239,68,68,0.1)",
                  border: "rgba(239,68,68,0.3)",
                  range: "under 90%",
                };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 0 8px",
      }}
    >
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: bg,
          border: `3px solid ${color}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}
        >
          {pct != null ? `${pct}%` : "—"}
        </span>
        {result.score != null && result.total != null && (
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: 3,
            }}
          >
            {result.score}/{result.total}
          </span>
        )}
      </div>
      {grade && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
            padding: "10px 18px",
            background: grade.bg,
            border: `1.5px solid ${grade.border}`,
            borderRadius: 14,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "1.8rem",
                fontWeight: 900,
                color: grade.color,
                lineHeight: 1,
              }}
            >
              {grade.letter}
            </span>
          </div>
          <div>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 900,
                color: grade.color,
              }}
            >
              {grade.label}
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                marginTop: 1,
              }}
            >
              {grade.range}
            </div>
          </div>
        </div>
      )}
      {/* PATCH: passed uses 90 threshold, messages updated */}
      <div
        style={{
          fontSize: "1.1rem",
          fontWeight: 900,
          color: passed ? "#16a34a" : "#ef4444",
          marginBottom: 6,
        }}
      >
        {passed ? "🎉 Passed!" : "Try Again"}
      </div>
      <div
        style={{
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          marginBottom: 20,
          textAlign: "center",
          maxWidth: 300,
        }}
      >
        {passed
          ? "Excellent! You've demonstrated solid knowledge of this menu item."
          : "You need 90% or above to pass. Review the tutorial video and try again."}
      </div>
      {result.answers?.length > 0 && (
        <div style={{ width: "100%", marginBottom: 20 }}>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            Answer Review
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.answers.map((ans, i) => (
              <div
                key={ans.questionId || i}
                style={{
                  background: ans.correct
                    ? "rgba(34,197,94,0.06)"
                    : "rgba(239,68,68,0.06)",
                  border: `1px solid ${ans.correct ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                >
                  <div style={{ flexShrink: 0, marginTop: 1 }}>
                    {ans.correct ? (
                      <MdCheck size={15} style={{ color: "#16a34a" }} />
                    ) : (
                      <MdClose size={15} style={{ color: "#ef4444" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                        marginBottom: 3,
                      }}
                    >
                      {ans.question || `Q${i + 1}`}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Your answer:{" "}
                      <span
                        style={{
                          fontWeight: 700,
                          color: ans.correct ? "#16a34a" : "#ef4444",
                        }}
                      >
                        {ans.answer}
                      </span>
                    </div>
                    {!ans.correct && ans.correctAnswer && (
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "#16a34a",
                          marginTop: 2,
                        }}
                      >
                        Correct:{" "}
                        <span style={{ fontWeight: 700 }}>
                          {ans.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* PATCH: Retake only shown when failed; button text contextual */}
      <div style={{ display: "flex", gap: 8, width: "100%" }}>
        {!passed && onRetake && (
          <button
            className="app_btn app_btn_cancel"
            style={{ flex: 1, height: 42 }}
            onClick={onRetake}
          >
            Retake Test
          </button>
        )}
        <button
          className="app_btn app_btn_confirm"
          style={{ flex: !passed && onRetake ? 2 : 1, height: 42 }}
          onClick={onDone}
        >
          {passed ? "Continue" : "Back to Learning"}
        </button>
      </div>
    </div>
  );
}

/* ── ActiveTestView — PATCHED: normalise API response ── */
function ActiveTestView({ test, onSubmit, onCancel }) {
  const questions = test.questions || [];
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const q = questions[current];
  const totalQ = questions.length;
  const answered = Object.keys(answers).length;
  const progress = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;
  const selectAnswer = (questionId, answer) =>
    setAnswers((p) => ({ ...p, [questionId]: answer }));

  const handleSubmit = async () => {
    if (answered < totalQ) {
      const confirmed = window.confirm(
        `You've answered ${answered} of ${totalQ} questions. Submit anyway?`,
      );
      if (!confirmed) return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/library/elearning/submit", {
        testId: test.id,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      });
      // PATCH: normalise API response to TestResultView shape
      // API returns: { score (0-100 %), questions: [{id, question, isCorrect, correctAnswer, userAnswer}] }
      const raw = res.data.data;
      const pct = typeof raw.score === "number" ? Math.round(raw.score) : null;
      const qs = raw.questions || [];
      const correct = qs.filter((q) => q.isCorrect).length;
      const normalised = {
        percentage: pct,
        score: correct,
        total: qs.length,
        passed: pct != null ? pct >= 90 : null,
        answers: qs.map((q) => ({
          questionId: q.id,
          question: q.question,
          answer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          correct: q.isCorrect,
        })),
      };
      onSubmit(normalised);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  if (!q)
    return (
      <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
        <MdSchool size={28} style={{ opacity: 0.3 }} />
        <span>No questions in this test</span>
      </div>
    );
  const options = q.options || q.choices || [];
  const isWritten = q.type === "WRITTEN" || options.length === 0;
  const selectedAnswer = answers[q.id];
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <button
          onClick={onCancel}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          <MdArrowBack size={15} />
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginBottom: 4,
            }}
          >
            Question {current + 1} of {totalQ}
          </div>
          <div
            style={{
              height: 4,
              background: "var(--bg-hover)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--accent)",
                borderRadius: 999,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            color: "var(--accent)",
            padding: "3px 10px",
            background: "var(--bg-active)",
            borderRadius: 999,
            border: "1px solid rgba(203,108,220,0.3)",
            flexShrink: 0,
          }}
        >
          {answered}/{totalQ}
        </div>
      </div>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "18px 16px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--bg-active)",
              border: "1px solid rgba(203,108,220,0.3)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            {current + 1}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "0.92rem",
              fontWeight: 700,
              color: "var(--text-heading)",
              lineHeight: 1.55,
              flex: 1,
            }}
          >
            {q.question || q.text || q.prompt || "Question"}
          </p>
        </div>
        {!isWritten ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {options.map((opt, oi) => {
              const optValue =
                typeof opt === "string"
                  ? opt
                  : opt.value || opt.text || opt.label || String(opt);
              const isSelected = selectedAnswer === optValue;
              return (
                <button
                  key={oi}
                  onClick={() => selectAnswer(q.id, optValue)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 11,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    background: isSelected
                      ? "var(--bg-active)"
                      : "var(--bg-hover)",
                    border: `1.5px solid ${isSelected ? "rgba(203,108,220,0.5)" : "var(--border)"}`,
                    transition: "all 0.12s",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      flexShrink: 0,
                      border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                      background: isSelected ? "var(--accent)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && (
                      <MdCheck size={12} style={{ color: "#fff" }} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "var(--accent)" : "var(--text-body)",
                    }}
                  >
                    {optValue}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <textarea
            className="modal-input"
            rows={3}
            placeholder="Type your answer…"
            value={selectedAnswer || ""}
            onChange={(e) => selectAnswer(q.id, e.target.value)}
            style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
          />
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="app_btn app_btn_cancel"
          style={{ height: 42, width: 44, padding: 0, flexShrink: 0 }}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          <MdArrowBack size={16} />
        </button>
        {current < totalQ - 1 ? (
          <button
            className="app_btn app_btn_confirm"
            style={{
              flex: 1,
              height: 42,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onClick={() => setCurrent((c) => Math.min(totalQ - 1, c + 1))}
          >
            Next <MdArrowForward size={15} />
          </button>
        ) : (
          <button
            className={`app_btn app_btn_confirm${submitting ? " btn_loading" : ""}`}
            style={{
              flex: 1,
              height: 42,
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            <span className="btn_text">Submit Test</span>
            {submitting && (
              <span className="btn_loader" style={{ width: 14, height: 14 }} />
            )}
          </button>
        )}
      </div>
      {totalQ > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 5,
            marginTop: 14,
            flexWrap: "wrap",
          }}
        >
          {questions.map((qItem, qi) => (
            <button
              key={qi}
              onClick={() => setCurrent(qi)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                cursor: "pointer",
                border: `1px solid ${qi === current ? "var(--accent)" : answers[qItem.id] ? "rgba(34,197,94,0.4)" : "var(--border)"}`,
                background:
                  qi === current
                    ? "var(--bg-active)"
                    : answers[qItem.id]
                      ? "rgba(34,197,94,0.08)"
                      : "var(--bg-hover)",
                color:
                  qi === current
                    ? "var(--accent)"
                    : answers[qItem.id]
                      ? "#16a34a"
                      : "var(--text-muted)",
                fontSize: "0.7rem",
                fontWeight: 700,
              }}
            >
              {qi + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── StartTestView — PATCHED: 90% threshold mention ── */
function StartTestView({ menuItems, onStarted, onCancel }) {
  const [selectedIds, setSelectedIds] = useState(
    menuItems.length === 1 ? [menuItems[0].id] : [],
  );
  const [starting, setStarting] = useState(false);
  const toggle = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const handleStart = async () => {
    if (!selectedIds.length)
      return toast.error("Select at least one menu item");
    setStarting(true);
    try {
      const res = await api.post("/library/elearning", {
        menuIds: selectedIds,
      });
      onStarted(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start test");
    } finally {
      setStarting(false);
    }
  };
  return (
    <div>
      <button
        onClick={onCancel}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
          fontFamily: "inherit",
        }}
      >
        <MdArrowBack size={15} /> Back to Learning
      </button>
      <div
        style={{
          background:
            "linear-gradient(135deg,rgba(203,108,220,0.12),rgba(203,108,220,0.04))",
          border: "1px solid rgba(203,108,220,0.2)",
          borderRadius: 16,
          padding: "20px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            flexShrink: 0,
            background: "rgba(203,108,220,0.15)",
            border: "1px solid rgba(203,108,220,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MdSchool size={22} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 900,
              color: "var(--text-heading)",
              marginBottom: 4,
            }}
          >
            Knowledge Test
          </div>
          {/* PATCH: mention 90% threshold */}
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              lineHeight: 1.55,
            }}
          >
            Select the menu items you want to be tested on. You need 90% or
            above to pass.
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: "0.62rem",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          marginBottom: 10,
        }}
      >
        Select Menu Items ({selectedIds.length} selected)
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {menuItems.map((item) => {
          const name = item.name || item.menuItem?.name || "Item";
          const img = item.image || item.menuItem?.image;
          const isSel = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 13px",
                borderRadius: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                background: isSel ? "var(--bg-active)" : "var(--bg-hover)",
                border: `1.5px solid ${isSel ? "rgba(203,108,220,0.45)" : "var(--border)"}`,
                transition: "all 0.12s",
              }}
            >
              {img ? (
                <img
                  src={img}
                  alt=""
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: isSel
                      ? "rgba(203,108,220,0.15)"
                      : "var(--bg-card)",
                    border: `1px solid ${isSel ? "rgba(203,108,220,0.3)" : "var(--border)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdRestaurantMenu
                    size={16}
                    style={{
                      color: isSel ? "var(--accent)" : "var(--text-muted)",
                    }}
                  />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: isSel ? "var(--accent)" : "var(--text-body)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </div>
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  flexShrink: 0,
                  border: `2px solid ${isSel ? "var(--accent)" : "var(--border)"}`,
                  background: isSel ? "var(--accent)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSel && <MdCheck size={14} style={{ color: "#fff" }} />}
              </div>
            </button>
          );
        })}
      </div>
      <button
        className={`app_btn app_btn_confirm${starting ? " btn_loading" : ""}`}
        style={{
          width: "100%",
          height: 46,
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: "0.92rem",
          fontWeight: 800,
        }}
        onClick={handleStart}
        disabled={starting || !selectedIds.length}
      >
        <span className="btn_text">
          <MdSchool size={16} /> Start Test
          {selectedIds.length > 0 &&
            ` \u00B7 ${selectedIds.length} item${selectedIds.length !== 1 ? "s" : ""}`}
        </span>
        {starting && (
          <span className="btn_loader" style={{ width: 15, height: 15 }} />
        )}
      </button>
    </div>
  );
}

/* ── ELearningTab — PATCHED: unmarkWatched + onRetake re-locks tutorial ── */
export function ELearningTab({ menuItems }) {
  const [mode, setMode] = useState("learn");
  const [selectedId, setSelectedId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTest, setActiveTest] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [watchedIds, setWatchedIds] = useState(new Set());
  const markWatched = (id) => setWatchedIds((prev) => new Set([...prev, id]));
  // PATCH: unmark so tutorial must be re-watched after failed test
  const unmarkWatched = (id) =>
    setWatchedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const loadSummary = async (menuItemId) => {
    setSelectedId(menuItemId);
    setSummary(null);
    setLoadingSummary(true);
    try {
      const res = await api.get(`/vendor/menu/${menuItemId}/summary`);
      const data = res.data.data;
      setSummary(data);
      const item = data?.menuItem || data;
      if (!item?.tutorialVideo) markWatched(menuItemId);
    } catch {
      toast.error("Failed to load item summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (menuItems?.length > 0 && !selectedId) loadSummary(menuItems[0].id);
  }, [menuItems]);

  if (!menuItems?.length)
    return (
      <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
        <MdSchool size={28} style={{ opacity: 0.3 }} />
        <span>No menu items available</span>
      </div>
    );
  if (mode === "scores") return <ScoresView onBack={() => setMode("learn")} />;
  if (mode === "start-test")
    return (
      <StartTestView
        menuItems={menuItems}
        onStarted={(test) => {
          setActiveTest(test);
          setMode("active-test");
        }}
        onCancel={() => setMode("learn")}
      />
    );
  if (mode === "active-test" && activeTest)
    return (
      <ActiveTestView
        test={activeTest}
        onSubmit={(result) => {
          setTestResult(result);
          setMode("result");
        }}
        onCancel={() => {
          if (
            window.confirm("Abandon this test? Your progress will be lost.")
          ) {
            setActiveTest(null);
            setMode("learn");
          }
        }}
      />
    );
  if (mode === "result" && testResult)
    return (
      <TestResultView
        result={testResult}
        // PATCH: onRetake re-locks tutorial so user must re-watch before retaking
        onRetake={
          !testResult.passed
            ? () => {
                setActiveTest(null);
                setTestResult(null);
                if (selectedId) unmarkWatched(selectedId);
                setMode("learn");
              }
            : undefined
        }
        onDone={() => {
          setActiveTest(null);
          setTestResult(null);
          setMode("learn");
        }}
      />
    );

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 18,
          padding: "12px 14px",
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "var(--text-heading)",
            }}
          >
            {watchedIds.has(selectedId)
              ? "Ready to be tested?"
              : "Watch the tutorial first"}
          </div>
          {/* PATCH: subtitle mentions 90% threshold */}
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              marginTop: 1,
            }}
          >
            {watchedIds.has(selectedId)
              ? "Score 90% or above to pass"
              : "Finish the video below to unlock the test"}
          </div>
        </div>
        <button
          onClick={() => setMode("scores")}
          style={{
            height: 34,
            padding: "0 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: "0.75rem",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
          }}
        >
          <MdHistory size={14} /> Scores
        </button>
        <button
          onClick={() => setMode("start-test")}
          className="app_btn app_btn_confirm"
          disabled={!watchedIds.has(selectedId)}
          style={{
            height: 34,
            padding: "0 14px",
            fontSize: "0.78rem",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            flexShrink: 0,
            opacity: watchedIds.has(selectedId) ? 1 : 0.45,
            cursor: watchedIds.has(selectedId) ? "pointer" : "not-allowed",
          }}
        >
          <MdSchool size={14} />{" "}
          {watchedIds.has(selectedId) ? "Take Test" : "\uD83D\uDD12 Locked"}
        </button>
      </div>
      {menuItems.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {menuItems.map((item) => {
            const name = item.name || item.menuItem?.name || "Item";
            const img = item.image || item.menuItem?.image;
            const isSel = selectedId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => loadSummary(item.id)}
                style={{
                  padding: "7px 14px",
                  border: `1px solid ${isSel ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: isSel ? "var(--bg-active)" : "var(--bg-hover)",
                  color: isSel ? "var(--accent)" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                {img && (
                  <img
                    src={img}
                    alt=""
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      objectFit: "cover",
                    }}
                  />
                )}
                {name}
                {watchedIds.has(item.id) && (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "#16a34a",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MdCheck size={9} style={{ color: "#fff" }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {loadingSummary && (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      )}
      {summary && !loadingSummary && (
        <MenuItemSummaryView
          summary={summary}
          onVideoWatched={() => selectedId && markWatched(selectedId)}
          videoWatched={selectedId ? watchedIds.has(selectedId) : false}
        />
      )}
    </div>
  );
}

/* SALES */
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
        fontSize: "0.65rem",
        fontWeight: 800,
        padding: "3px 9px",
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

function ItemCustomiser({ item, kioskId, onConfirm, onClose }) {
  const hasVariants = item.variants?.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants ? item.variants[0].id : null,
  );
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(item.sellingPrice || 0);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const fmt = (n) =>
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
    const variantObj =
      item.variants?.find((v) => v.id === selectedVariant) || null;
    const extrasObjs =
      item.extras?.filter((e) => selectedExtras.includes(e.id)) || [];
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
                    Calculating…
                  </span>
                ) : price > 0 ? (
                  `\u20A6${fmt(price)}`
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
                          +\u20A6{fmt(v.priceAddition)}
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
              onClick={confirm}
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
              <MdAdd size={17} /> Add to Order{" "}
              {!fetchingPrice && totalPrice > 0 && (
                <span style={{ opacity: 0.85 }}>
                  \u00B7 \u20A6{fmt(totalPrice)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordSaleForm({ kioskId, menuItems, onSaved }) {
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
  const [kiosk, setCart] = useState({});
  const [customising, setCustomising] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [saving, setSaving] = useState(false);
  const addToCart = ({
    item,
    qty,
    variantId,
    extraIds,
    variantLabel,
    extrasLabels,
    unitPrice,
  }) => {
    const key = [item.id, variantId || "", ...(extraIds || []).sort()].join(
      "_",
    );
    setCart((prev) => ({
      ...prev,
      [key]: prev[key]
        ? { ...prev[key], qty: prev[key].qty + qty }
        : {
            item,
            qty,
            variantId,
            extraIds,
            variantLabel,
            extrasLabels,
            unitPrice,
          },
    }));
    toast.success(`${item.name} added`, { autoClose: 800 });
  };
  const removeFromCart = (key) =>
    setCart((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  const adjustQty = (key, delta) =>
    setCart((prev) => {
      const e = prev[key];
      if (!e) return prev;
      const newQty = e.qty + delta;
      if (newQty <= 0) {
        const n = { ...prev };
        delete n[key];
        return n;
      }
      return { ...prev, [key]: { ...e, qty: newQty } };
    });
  const kioskEntries = Object.entries(kiosk);
  const kioskTotal = kioskEntries.reduce(
    (s, [, e]) => s + (e.unitPrice || 0) * e.qty,
    0,
  );
  const kioskCount = kioskEntries.reduce((s, [, e]) => s + e.qty, 0);
  const handleSubmit = async () => {
    if (!kioskEntries.length) return toast.error("Add at least one item");
    setSaving(true);
    try {
      await api.post("/kiosk/sale", {
        kioskId,
        paymentMethod,
        items: kioskEntries.map(([, e]) => ({
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
          <div
            style={{
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "var(--text-heading)",
            }}
          >
            Record Sale
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
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
      <div style={{ padding: "12px 16px", maxHeight: 320, overflowY: "auto" }}>
        {!menuItems?.length ? (
          <div className="kiosk_empty_inline" style={{ padding: "24px 0" }}>
            <MdRestaurantMenu size={22} style={{ opacity: 0.3 }} />
            <span>No menu items</span>
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
              const price =
                item.sellingPrice || item.menuItem?.sellingPrice || 0;
              const inCart = Object.values(kiosk)
                .filter((e) => e.item.id === item.id)
                .reduce((s, e) => s + e.qty, 0);
              return (
                <button
                  key={item.id}
                  onClick={() => setCustomising(item)}
                  style={{
                    background:
                      inCart > 0 ? "var(--bg-active)" : "var(--bg-hover)",
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
                      style={{
                        width: "100%",
                        height: 70,
                        objectFit: "cover",
                        borderRadius: 7,
                        marginBottom: 7,
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: 70,
                        borderRadius: 7,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 7,
                      }}
                    >
                      <MdImage
                        size={20}
                        style={{ color: "var(--text-muted)", opacity: 0.4 }}
                      />
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                      lineHeight: 1.3,
                      marginBottom: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: inCart > 0 ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {price > 0
                      ? `\u20A6${Number(price).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`
                      : "—"}
                  </div>
                  {inCart > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        color: "#fff",
                        fontSize: "0.62rem",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {inCart}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {kioskEntries.length > 0 && (
        <div
          style={{ borderTop: "1px solid var(--border)", padding: "12px 16px" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 12,
            }}
          >
            {kioskEntries.map(([key, entry]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  background: "var(--bg-hover)",
                  borderRadius: 9,
                }}
              >
                {entry.item.image ? (
                  <img
                    src={entry.item.image}
                    alt=""
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: "var(--bg-card)",
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
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.item.name}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => adjustQty(key, -1)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.9rem",
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--text-heading)",
                      minWidth: 16,
                      textAlign: "center",
                    }}
                  >
                    {entry.qty}
                  </span>
                  <button
                    onClick={() => adjustQty(key, +1)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.9rem",
                    }}
                  >
                    +
                  </button>
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "var(--text-heading)",
                    flexShrink: 0,
                    minWidth: 56,
                    textAlign: "right",
                  }}
                >
                  {entry.unitPrice > 0
                    ? `\u20A6${fmt(entry.unitPrice * entry.qty)}`
                    : "—"}
                </div>
                <button
                  onClick={() => removeFromCart(key)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdClose size={13} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "0.66rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Total
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 900,
                  color: "var(--accent)",
                }}
              >
                \u20A6{fmt(kioskTotal)}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{
                height: 44,
                padding: "0 24px",
                position: "relative",
                fontSize: "0.88rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <span className="btn_text">
                <MdPointOfSale size={16} /> Submit Sale
              </span>
              {saving && (
                <span
                  className="btn_loader"
                  style={{ width: 14, height: 14 }}
                />
              )}
            </button>
          </div>
        </div>
      )}
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

function SaleRow({ sale }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 13,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 14px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="kiosk_task_icon">
          <MdPointOfSale size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: "0.82rem",
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
            <span className="contract_row_dot">\u00B7</span>
            <span>{fmtDate(sale.createdAt)}</span>
          </div>
        </div>
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 900,
            color: "var(--text-heading)",
            textAlign: "right",
          }}
        >
          \u20A6
          {Number(sale.totalAmount || 0).toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
        </div>
        {expanded ? (
          <MdExpandLess
            size={16}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        ) : (
          <MdExpandMore
            size={16}
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
                padding: "9px 14px",
                borderBottom:
                  idx < sale.items.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                  }}
                >
                  {item.menuItem?.name || "Item"}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  qty: {item.quantity}
                </div>
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--text-heading)",
                  flexShrink: 0,
                }}
              >
                \u20A6
                {Number(item.priceAtTime || 0).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SalesTab({ kioskId, menuItems, isOperator = true }) {
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const fetchSales = () => {
    setLoading(true);
    Promise.allSettled([
      api.get(`/kiosk/sale?kioskId=${kioskId}`),
      api.get(`/kiosk/sale/analytics?kioskId=${kioskId}`),
    ])
      .then(([salesRes, analyticsRes]) => {
        if (salesRes.status === "fulfilled") {
          const d = salesRes.value.data.data;
          setSales(Array.isArray(d) ? d : d?.items || []);
        }
        if (analyticsRes.status === "fulfilled")
          setAnalytics(analyticsRes.value.data.data);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchSales();
  }, [kioskId]);
  const chartData = (analytics?.chartData || []).map((d) => ({
    ...d,
    sales: Math.round(d.sales),
    profit: Math.round(d.profit),
  }));
  const fmtChartDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        })
      : "";
  const fmtTick = (v) => `\u20A6${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;
  return (
    <div>
      {analytics?.totals && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {[
            {
              label: "Revenue",
              value: `\u20A6${Number(analytics.totals.totalSales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              accent: false,
            },
            {
              label: "Profit",
              value: `\u20A6${Number(analytics.totals.totalProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              accent: true,
            },
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
                  fontSize: "0.68rem",
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
                  fontSize: "1rem",
                  fontWeight: 900,
                  color: s.accent ? "var(--accent)" : "var(--text-heading)",
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}
      {chartData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="opSalesGrad" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="opProfitGrad" x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={fmtTick}
                width={40}
              />
              <Tooltip
                formatter={(v, name) => [
                  `\u20A6${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                  name === "sales" ? "Revenue" : "Profit",
                ]}
                labelFormatter={fmtChartDate}
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: "0.78rem",
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#opSalesGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#opProfitGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {isOperator && (
        <div style={{ marginBottom: 14 }}>
          <button
            className={`app_btn${showForm ? " app_btn_cancel" : " app_btn_confirm"}`}
            style={{
              height: 40,
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
            onClick={() => setShowForm((v) => !v)}
          >
            <MdAdd size={15} /> {showForm ? "Cancel" : "Record Sale"}
          </button>
        </div>
      )}
      {showForm && (
        <RecordSaleForm
          kioskId={kioskId}
          menuItems={menuItems}
          onSaved={() => {
            setShowForm(false);
            fetchSales();
          }}
        />
      )}
      {loading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      ) : sales.length === 0 ? (
        <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
          <MdPointOfSale size={28} style={{ opacity: 0.3 }} />
          <span>No sales recorded yet</span>
        </div>
      ) : (
        sales.map((sale) => <SaleRow key={sale.id} sale={sale} />)
      )}
    </div>
  );
}

/* MAIN PAGE */
export default function OperatorKioskPage() {
  const { kioskId } = useParams();
  const navigate = useNavigate();
  const [kiosk, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");
  useEffect(() => {
    api
      .get(`/kiosk/${kioskId}`)
      .then((r) => setCart(r.data.data))
      .catch(() => toast.error("Failed to load kiosk"))
      .finally(() => setLoading(false));
  }, [kioskId]);
  if (loading)
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  if (!kiosk)
    return (
      <div className="page_wrapper">
        <div className="kiosk_empty_state" style={{ padding: "64px 0" }}>
          <LuStore size={32} style={{ opacity: 0.3 }} />
          <p className="kiosk_empty_title">Cart not found</p>
          <button
            className="app_btn app_btn_cancel"
            style={{ height: 38, padding: "0 20px" }}
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  const menuItems = kiosk.menuItems || [];
  return (
    <div className="page_wrapper">
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "0.82rem",
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-body)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-muted)")
        }
      >
        <MdArrowBack size={16} /> Back to Operator
      </button>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "18px 20px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              flexShrink: 0,
              background: "var(--bg-active)",
              border: "1px solid rgba(203,108,220,0.2)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LuStore size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 900,
                  color: "var(--text-heading)",
                  fontFamily: "monospace",
                }}
              >
                {kiosk.serialNumber}
              </span>
              <StatusChip status={kiosk.status} />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: kiosk.isOnline
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(107,114,128,0.1)",
                  color: kiosk.isOnline ? "#22c55e" : "#6b7280",
                  border: `1px solid ${kiosk.isOnline ? "rgba(34,197,94,0.25)" : "rgba(107,114,128,0.25)"}`,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: kiosk.isOnline ? "#22c55e" : "#9ca3af",
                  }}
                />
                {kiosk.isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {kiosk.location && (
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <MdRestaurantMenu size={13} />
                {kiosk.location.name}
                {kiosk.location.city ? ` \u00B7 ${kiosk.location.city}` : ""}
              </div>
            )}
          </div>
        </div>
        {menuItems.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div className="kiosk_summary_chip">
              <MdRestaurantMenu size={12} />
              {menuItems.length} Menu Item{menuItems.length !== 1 ? "s" : ""}
            </div>
            {kiosk.operators?.length > 0 && (
              <div className="kiosk_summary_chip">
                👤 {kiosk.operators.length} Operator
                {kiosk.operators.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          marginBottom: 20,
          overflowX: "auto",
          scrollbarWidth: "none",
          background: "var(--bg-card)",
          borderRadius: "12px 12px 0 0",
          padding: "0 4px",
        }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                color: active ? "var(--accent)" : "var(--text-muted)",
                fontSize: "0.8rem",
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab === "tasks" && <TasksTab kioskId={kioskId} />}
      {activeTab === "inventory" && <InventoryTab kioskId={kioskId} />}
      {activeTab === "menu" && <MenuTab menuItems={menuItems} />}
      {activeTab === "elearning" && <ELearningTab menuItems={menuItems} />}
      {activeTab === "orders" && <KioskOrders kioskId={kioskId} />}
      {activeTab === "sales" && (
        <SalesTab kioskId={kioskId} menuItems={menuItems} isOperator={true} />
      )}
    </div>
  );
}
