import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import {
  MdArrowBack,
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
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ── helpers ──────────────────────────────────────────────── */
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
  };
  const s = colors[status] || colors.PENDING;
  return (
    <span
      className="icart_status_badge"
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
  { key: "elearning", label: "-Learning", icon: <MdSchool size={15} /> },
  { key: "sales", label: "Sales", icon: <MdPointOfSale size={15} /> },
];

/* ════════════════════════════════════════════════════════════
   TAB: TASKS
   ════════════════════════════════════════════════════════════ */
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
      await api.patch(`/icart/tasks/${task.id}/submit`, { data: formData });
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
              className={`icart_checkbox_btn ${formData[field.label] ? "icart_checkbox_checked" : ""}`}
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
        <div className="icart_task_icon">
          <MdTask size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="icart_task_name">
            {task.template?.name || task.name || "Task"}
          </div>
          <div className="icart_task_meta">
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
            <div className="icart_task_data" style={{ marginTop: 12 }}>
              {Object.entries(task.data).map(([k, v]) => (
                <div key={k} className="icart_task_data_row">
                  <span className="icart_meta_key">{k}</span>
                  <span className="icart_meta_val">
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
            <div className="icart_manager_comment" style={{ marginTop: 10 }}>
              <span className="icart_meta_key">Manager Note</span>
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

export function TasksTab({ cartId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/tasks?cartId=${cartId}`);
      setTasks(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [cartId]);

  if (loading)
    return (
      <div className="drawer_loading">
        <div className="page_loader_spinner" />
      </div>
    );

  return tasks.length === 0 ? (
    <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
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

/* ════════════════════════════════════════════════════════════
   TAB: INVENTORY
   ════════════════════════════════════════════════════════════ */
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
  if (u === "ml" || u === "l") return ["ml", "L"];
  return ["unit"];
}

function getDefaultUnit(baseUnit) {
  if (!baseUnit) return "g";
  const u = baseUnit.toLowerCase();
  if (u === "g" || u === "kg") return "g";
  if (u === "ml" || u === "l") return "ml";
  return "unit";
}

export function InventoryTab({ cartId }) {
  const [view, setView] = useState("stock"); // stock | supply | history
  const [inventory, setInventory] = useState([]);
  const [supply, setSupply] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usageItem, setUsageItem] = useState(null); // item being recorded
  const [usageQty, setUsageQty] = useState("");
  const [usageUnit, setUsageUnit] = useState("g");
  const [usageReason, setUsageReason] = useState("Usage");
  const [usageNotes, setUsageNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Supply request state
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
      const res = await api.get(`/icart/inventory/icart/${cartId}`);
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
      const res = await api.get(`/icart/supply?cartId=${cartId}`);
      setSupply(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load supply");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/inventory/history?cartId=${cartId}`);
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
        setSuppliers(Array.isArray(d) ? d : d?.items || d?.suppliers || []);
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
      await api.post("/icart/inventory/record-usage", {
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
      const items = [
        ...(d?.ingredient || []).map((i) => ({ ...i, _type: "INGREDIENT" })),
        ...(d?.preps || []).map((i) => ({ ...i, _type: "PREP_ITEM" })),
      ];
      setSearchResults((p) => ({ ...p, [idx]: items }));
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
      await api.post("/icart/supply", {
        cartId,
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
      fetchSupply();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSubmittingSupply(false);
    }
  };

  return (
    <div>
      {/* Sub-nav */}
      <div className="icart_sub_nav" style={{ marginBottom: 16 }}>
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
            className={`icart_sub_nav_btn ${showSupplyForm ? "icart_sub_nav_active" : ""}`}
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
        <>
          {inventory.length === 0 ? (
            <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
              <MdInventory2 size={28} style={{ opacity: 0.3 }} />
              <span>No inventory items</span>
            </div>
          ) : (
            inventory.map((item) => {
              const name =
                item.ingredient?.name ||
                item.prepItem?.name ||
                item.menuItem?.name ||
                "Item";
              const img =
                item.ingredient?.image || item.prepItem?.image || null;
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
                      <div className="icart_task_name">{name}</div>
                      <div className="icart_task_meta">
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
                      className="icart_icon_action_btn"
                      title="Record usage"
                      style={{
                        color: isActive ? "var(--accent)" : undefined,
                        borderColor: isActive
                          ? "rgba(203,108,220,0.4)"
                          : undefined,
                      }}
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
                          letterSpacing: "0.05em",
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
                      {(usageUnit === "kg" || usageUnit === "L") &&
                        usageQty && (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--accent)",
                              fontWeight: 600,
                              marginBottom: 8,
                            }}
                          >
                            → {toBase(usageQty, usageUnit).toLocaleString()}{" "}
                            {usageUnit === "kg" ? "g" : "ml"} will be recorded
                          </div>
                        )}
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
          )}
        </>
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
                        className="icart_icon_action_btn icart_icon_danger"
                        style={{ width: 22, height: 22 }}
                        onClick={() =>
                          setSupplyItems((p) => p.filter((_, idx) => idx !== i))
                        }
                      >
                        <MdClose size={12} />
                      </button>
                    )}
                  </div>
                  {/* Search */}
                  <div style={{ position: "relative" }}>
                    <div className="icart_search_wrap" style={{ height: 40 }}>
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
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  background: "var(--bg-hover)",
                                  border: "1px solid var(--border)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
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
            <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
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
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div className="icart_task_icon">
                  <MdLocalShipping size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="icart_task_name">
                    {req.ingredient?.name || "Ingredient"}
                  </div>
                  <div className="icart_task_meta">
                    Qty: {req.quantity} ·{" "}
                    {req.supplier?.businessName || "Supplier"}
                  </div>
                </div>
                <StatusChip status={req.status} />
              </div>
            ))
          )}
        </>
      ) : // History
      history.length === 0 ? (
        <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
          <MdHistory size={28} style={{ opacity: 0.3 }} />
          <span>No history yet</span>
        </div>
      ) : (
        history.map((entry, i) => (
          <div
            key={entry.id || i}
            className="icart_history_row"
            style={{ marginBottom: 6 }}
          >
            <div className="icart_task_icon">
              {entry.delta > 0 ? (
                <MdAdd size={13} style={{ color: "#22c55e" }} />
              ) : (
                <MdRemoveCircleOutline size={13} style={{ color: "#ef4444" }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="icart_task_name">
                {entry.ingredient?.name || entry.item?.name || "Item"}
              </div>
              <div className="icart_task_meta">
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
              <div className="icart_operator_meta">
                {fmtDate(entry.createdAt)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB: MENU
   ════════════════════════════════════════════════════════════ */
export function MenuTab({ concepts }) {
  const [expanded, setExpanded] = useState({});
  if (!concepts?.length)
    return (
      <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
        <MdMenuBook size={28} style={{ opacity: 0.3 }} />
        <span>No concepts assigned</span>
      </div>
    );

  return (
    <div>
      {concepts.map((concept) => {
        const isOpen = expanded[concept.id];
        const items = concept.menuItems || [];
        return (
          <div
            key={concept.id}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            {/* Concept header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                cursor: "pointer",
              }}
              onClick={() =>
                setExpanded((p) => ({ ...p, [concept.id]: !p[concept.id] }))
              }
            >
              <div className="icart_concept_icon">
                <MdRestaurantMenu size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    color: "var(--text-heading)",
                  }}
                >
                  {concept.name}
                </div>
                <div className="icart_task_meta">
                  <span>
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </span>
                  {concept.status && (
                    <>
                      <span className="contract_row_dot">·</span>
                      <StatusChip status={concept.status} />
                    </>
                  )}
                </div>
              </div>
              {isOpen ? (
                <MdExpandLess
                  size={18}
                  style={{ color: "var(--text-muted)" }}
                />
              ) : (
                <MdExpandMore
                  size={18}
                  style={{ color: "var(--text-muted)" }}
                />
              )}
            </div>

            {isOpen &&
              items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderTop: "1px solid var(--border)",
                    background: "var(--bg-hover)",
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
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
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MdImage
                        size={18}
                        style={{ color: "var(--text-muted)" }}
                      />
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
                      {item.name}
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
                        ⏱ {item.ticketTime} min prep
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 800,
                        color: "var(--text-heading)",
                      }}
                    >
                      ₦{Number(item.sellingPrice || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB: E-LEARNING
   ════════════════════════════════════════════════════════════ */
export function ELearningTab({ concepts }) {
  const [selected, setSelected] = useState(null); // conceptId
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeItem, setActiveItem] = useState(null); // menuItemId expanded

  const loadSummary = async (conceptId) => {
    setSelected(conceptId);
    setActiveItem(null);
    setSummary(null);
    setLoadingSummary(true);
    try {
      const res = await api.get(`/vendor/menu/concept/${conceptId}/summary`);
      setSummary(res.data.data);
    } catch {
      toast.error("Failed to load concept summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  if (!concepts?.length)
    return (
      <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
        <MdSchool size={28} style={{ opacity: 0.3 }} />
        <span>No concepts available</span>
      </div>
    );

  return (
    <div>
      {/* Concept selector */}
      {concepts.length > 1 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {concepts.map((c) => (
            <button
              key={c.id}
              onClick={() => loadSummary(c.id)}
              style={{
                padding: "7px 16px",
                border: "1px solid var(--border)",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "inherit",
                background:
                  selected === c.id ? "var(--bg-active)" : "var(--bg-hover)",
                color:
                  selected === c.id ? "var(--accent)" : "var(--text-muted)",
                borderColor:
                  selected === c.id ? "rgba(203,108,220,0.4)" : "var(--border)",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Auto-load single concept */}
      {concepts.length === 1 &&
        !selected &&
        (() => {
          loadSummary(concepts[0].id);
          return null;
        })()}

      {loadingSummary && (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      )}

      {summary && (
        <div>
          {/* Concept hero */}
          {summary.concept?.banner && (
            <img
              src={summary.concept.banner}
              alt={summary.concept.name}
              style={{
                width: "100%",
                height: 160,
                objectFit: "cover",
                borderRadius: 14,
                marginBottom: 16,
              }}
            />
          )}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              {summary.vendor?.brandLogo && (
                <img
                  src={summary.vendor.brandLogo}
                  alt=""
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    objectFit: "cover",
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "var(--text-heading)",
                  }}
                >
                  {summary.concept.name}
                </div>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  {summary.vendor?.businessName}
                </div>
              </div>
            </div>
            {summary.concept.description && (
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-body)",
                  lineHeight: 1.6,
                  margin: "0 0 8px",
                }}
              >
                {summary.concept.description}
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {summary.concept.origin && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  🌍 {summary.concept.origin}
                </span>
              )}
              {summary.concept.serveTo && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  👥 {summary.concept.serveTo}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {[
              { label: "Menu Items", value: summary.stats?.totalMenuItems },
              {
                label: "Ingredients",
                value: summary.stats?.totalUniqueIngredients,
              },
              {
                label: "Prep Items",
                value: summary.stats?.totalUniquePrepItems,
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 900,
                    color: "var(--accent)",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Menu items with recipes */}
          <div className="drawer_section_title" style={{ marginBottom: 12 }}>
            Menu Items & Recipes
          </div>
          {summary.menuItems?.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <div
                key={item.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                {/* Item header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveItem(isActive ? null : item.id)}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MdImage
                        size={20}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 800,
                        color: "var(--text-heading)",
                      }}
                    >
                      {item.name}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginTop: 1,
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                    <div className="icart_task_meta" style={{ marginTop: 4 }}>
                      <span>{item.recipe?.length || 0} recipe steps</span>
                      {item.ticketTime > 0 && (
                        <>
                          <span className="contract_row_dot">·</span>
                          <span>⏱ {item.ticketTime} min</span>
                        </>
                      )}
                      {item.tutorialVideo && (
                        <>
                          <span className="contract_row_dot">·</span>
                          <span style={{ color: "#ef4444" }}>▶ Video</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isActive ? (
                    <MdExpandLess
                      size={18}
                      style={{ color: "var(--text-muted)" }}
                    />
                  ) : (
                    <MdExpandMore
                      size={18}
                      style={{ color: "var(--text-muted)" }}
                    />
                  )}
                </div>

                {isActive && (
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      background: "var(--bg-hover)",
                    }}
                  >
                    {/* Tutorial video */}
                    {item.tutorialVideo && (
                      <div
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 10,
                          }}
                        >
                          Tutorial Video
                        </div>
                        <video
                          src={item.tutorialVideo}
                          controls
                          style={{
                            width: "100%",
                            borderRadius: 10,
                            maxHeight: 220,
                            background: "#000",
                          }}
                        />
                      </div>
                    )}

                    {/* Recipe steps */}
                    {item.recipe?.length > 0 && (
                      <div style={{ padding: "14px 16px" }}>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 12,
                          }}
                        >
                          Recipe
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          {item.recipe.map((step, si) => {
                            const ing = step.ingredient || step.prepItem;
                            return (
                              <div
                                key={step.id || si}
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  alignItems: "flex-start",
                                }}
                              >
                                {/* Step number */}
                                <div
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                    background: "var(--bg-active)",
                                    border: "1px solid rgba(203,108,220,0.3)",
                                    color: "var(--accent)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    flexShrink: 0,
                                  }}
                                >
                                  {si + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {/* Ingredient */}
                                  {ing && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        marginBottom: 4,
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
                                            size={12}
                                            style={{
                                              color: "var(--text-muted)",
                                            }}
                                          />
                                        </div>
                                      )}
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
                                            fontSize: "0.72rem",
                                            color: "var(--accent)",
                                            fontWeight: 700,
                                            marginLeft: 6,
                                          }}
                                        >
                                          {step.quantity}
                                          {ing.unit}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {/* Instruction */}
                                  {step.instruction && (
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: "0.8rem",
                                        color: "var(--text-muted)",
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {step.instruction}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Extras */}
                    {item.extras?.length > 0 && (
                      <div style={{ padding: "0 16px 14px" }}>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 8,
                          }}
                        >
                          Extras / Add-ons
                        </div>
                        {item.extras.map((ex, ei) => (
                          <div
                            key={ei}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "6px 0",
                              borderBottom: "1px solid var(--border)",
                              fontSize: "0.8rem",
                            }}
                          >
                            <span
                              style={{
                                color: "var(--text-body)",
                                fontWeight: 600,
                              }}
                            >
                              {ex.name}
                            </span>
                            <span
                              style={{
                                color: "var(--accent)",
                                fontWeight: 700,
                              }}
                            >
                              ₦{Number(ex.price || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Ingredients overview */}
          {summary.ingredients?.length > 0 && (
            <>
              <div
                className="drawer_section_title"
                style={{ marginBottom: 10, marginTop: 20 }}
              >
                All Ingredients
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {summary.ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                    }}
                  >
                    {ing.image ? (
                      <img
                        src={ing.image}
                        alt={ing.name}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 7,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 7,
                          background: "var(--bg-hover)",
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "var(--text-body)",
                        }}
                      >
                        {ing.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Total: {ing.totalQuantity}
                        {ing.unit} · Used in:{" "}
                        {ing.usedIn?.map((u) => u.menuItem).join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB: SALES (record + history)
   ════════════════════════════════════════════════════════════ */
/* ── payment method badge colours ────────────────────────── */
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

/* ── Record Sale Form ─────────────────────────────────────── */
function QtyControl({ value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg-hover)",
        border: "1px solid var(--border)",
        borderRadius: 9,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        style={{
          width: 32,
          height: 32,
          background: "transparent",
          border: "none",
          color: "var(--text-body)",
          cursor: "pointer",
          fontSize: "1rem",
          fontFamily: "inherit",
        }}
      >
        −
      </button>
      <div
        style={{
          minWidth: 36,
          textAlign: "center",
          fontSize: "0.9rem",
          fontWeight: 800,
          color: "var(--text-heading)",
          borderLeft: "1px solid var(--border)",
          borderRight: "1px solid var(--border)",
          lineHeight: "32px",
        }}
      >
        {value}
      </div>
      <button
        onClick={() => onChange(value + 1)}
        style={{
          width: 32,
          height: 32,
          background: "transparent",
          border: "none",
          color: "var(--text-body)",
          cursor: "pointer",
          fontSize: "1rem",
          fontFamily: "inherit",
        }}
      >
        +
      </button>
    </div>
  );
}

function RecordSaleForm({ cartId, concepts, onSaved }) {
  const allItems = (concepts || []).flatMap((c) =>
    (c.menuItems || []).map((item) => ({ ...item, conceptName: c.name })),
  );

  // items: [{ menuItemId, quantity }]
  const [orderItems, setOrderItems] = useState([
    { menuItemId: allItems[0]?.id || "", quantity: 1 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [saving, setSaving] = useState(false);

  const updateItem = (i, key, val) =>
    setOrderItems((prev) => {
      const u = [...prev];
      u[i] = { ...u[i], [key]: val };
      return u;
    });

  const addItem = () =>
    setOrderItems((prev) => [
      ...prev,
      { menuItemId: allItems[0]?.id || "", quantity: 1 },
    ]);
  const removeItem = (i) =>
    setOrderItems((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    const valid = orderItems.filter((r) => r.menuItemId && r.quantity >= 1);
    if (!valid.length) return toast.error("Add at least one item");
    setSaving(true);
    try {
      await api.post("/icart/sale", {
        cartId,
        paymentMethod,
        items: valid.map((r) => ({
          menuItemId: r.menuItemId,
          quantity: Number(r.quantity),
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
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: "0.85rem",
          fontWeight: 800,
          color: "var(--text-heading)",
          marginBottom: 16,
        }}
      >
        Record Sale
      </div>

      {/* Payment method */}
      <div className="form-field">
        <label className="modal-label">Payment Method *</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 6,
          }}
        >
          {["CASH", "POS", "TRANSFER", "OTHER"].map((m) => {
            const c = pmColors[m];
            const active = paymentMethod === m;
            return (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                style={{
                  height: 36,
                  border: `1px solid ${active ? c.border : "var(--border)"}`,
                  borderRadius: 9,
                  cursor: "pointer",
                  background: active ? c.bg : "var(--bg-hover)",
                  color: active ? c.color : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Order items */}
      <div className="form-field">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <label className="modal-label" style={{ margin: 0 }}>
            Items *
          </label>
          <button
            onClick={addItem}
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
            <MdAdd size={14} /> Add item
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orderItems.map((row, i) => {
            const selected = allItems.find((it) => it.id === row.menuItemId);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                {selected?.image ? (
                  <img
                    src={selected.image}
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
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MdImage size={13} style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
                <select
                  className="modal-input"
                  style={{ flex: 1 }}
                  value={row.menuItemId}
                  onChange={(e) => updateItem(i, "menuItemId", e.target.value)}
                >
                  {allItems.length === 0 ? (
                    <option value="">No items available</option>
                  ) : (
                    allItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.conceptName ? ` (${item.conceptName})` : ""}
                      </option>
                    ))
                  )}
                </select>
                <QtyControl
                  value={row.quantity}
                  onChange={(v) => updateItem(i, "quantity", v)}
                />
                {orderItems.length > 1 && (
                  <button
                    className="icart_icon_action_btn icart_icon_danger"
                    style={{ width: 26, height: 26, flexShrink: 0 }}
                    onClick={() => removeItem(i)}
                  >
                    <MdClose size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
        style={{
          width: "100%",
          height: 42,
          position: "relative",
          marginTop: 4,
        }}
        onClick={handleSubmit}
        disabled={saving}
      >
        <span className="btn_text">Submit Sale</span>
        {saving && (
          <span className="btn_loader" style={{ width: 14, height: 14 }} />
        )}
      </button>
    </div>
  );
}

/* ── Sale Row ─────────────────────────────────────────────── */
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
      {/* Main row */}
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
        <div className="icart_task_icon">
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
          <div className="icart_task_meta">
            <span>
              {sale.items?.length || 0} item
              {sale.items?.length !== 1 ? "s" : ""}
            </span>
            <span className="contract_row_dot">·</span>
            <span>{fmtDate(sale.createdAt)}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 900,
              color: "var(--text-heading)",
            }}
          >
            ₦
            {Number(sale.totalAmount || 0).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </div>
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

      {/* Expanded items */}
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
              {item.menuItem?.image ? (
                <img
                  src={item.menuItem.image}
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
                  <MdImage size={12} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
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
                ₦
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

export function SalesTab({ cartId, concepts, isOperator = true }) {
  const [sales, setSales] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchSales = () => {
    setLoading(true);
    Promise.allSettled([
      api.get("/icart/sale"),
      api.get("/icart/sale/analytics"),
    ])
      .then(([salesRes, analyticsRes]) => {
        if (salesRes.status === "fulfilled") {
          const d = salesRes.value.data.data;
          const all = Array.isArray(d) ? d : d?.items || [];
          // filter to this cart
          setSales(
            all.filter((s) => s.cartId === cartId || s.cart?.id === cartId),
          );
        }
        if (analyticsRes.status === "fulfilled") {
          setAnalytics(analyticsRes.value.data.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
  }, [cartId]);

  const cartSales = sales; // already filtered
  const totalRevenue = cartSales.reduce(
    (sum, s) => sum + (s.totalAmount || 0),
    0,
  );

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
  const fmtTick = (v) => `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;

  return (
    <div>
      {/* Summary cards */}
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
              value: `₦${Number(analytics.totals.totalSales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              accent: false,
            },
            {
              label: "Profit",
              value: `₦${Number(analytics.totals.totalProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
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

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
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
              Sales Trend
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
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
                  `₦${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
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

      {/* Summary chips */}
      {cartSales.length > 0 && (
        <div className="icart_summary_row" style={{ marginBottom: 16 }}>
          <div className="icart_summary_chip">
            <MdPointOfSale size={12} />
            {cartSales.length} sale{cartSales.length !== 1 ? "s" : ""}
          </div>
          <div
            className="icart_summary_chip"
            style={{
              color: "var(--accent)",
              background: "var(--bg-active)",
              borderColor: "rgba(203,108,220,0.2)",
            }}
          >
            ₦
            {totalRevenue.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}{" "}
            total
          </div>
          {["CASH", "POS", "TRANSFER"].map((m) => {
            const count = cartSales.filter((s) => s.paymentMethod === m).length;
            if (!count) return null;
            const c = pmColors[m];
            return (
              <div
                key={m}
                className="icart_summary_chip"
                style={{
                  color: c.color,
                  background: c.bg,
                  borderColor: c.border,
                }}
              >
                {m} · {count}
              </div>
            );
          })}
        </div>
      )}

      {/* Record sale button — operator only */}
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
          cartId={cartId}
          concepts={concepts}
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
      ) : cartSales.length === 0 ? (
        <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
          <MdPointOfSale size={28} style={{ opacity: 0.3 }} />
          <span>No sales recorded yet</span>
        </div>
      ) : (
        <div>
          {cartSales.map((sale) => (
            <SaleRow key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════ */
export default function OperatorCartPage() {
  const { cartId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");

  useEffect(() => {
    api
      .get(`/icart/${cartId}`)
      .then((r) => setCart(r.data.data))
      .catch(() => toast.error("Failed to load cart"))
      .finally(() => setLoading(false));
  }, [cartId]);

  if (loading)
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );

  if (!cart)
    return (
      <div className="page_wrapper">
        <div className="icart_empty_state" style={{ padding: "64px 0" }}>
          <LuShoppingCart size={32} style={{ opacity: 0.3 }} />
          <p className="icart_empty_title">Cart not found</p>
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

  return (
    <div className="page_wrapper">
      {/* Back button */}
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
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-body)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-muted)")
        }
      >
        <MdArrowBack size={16} /> Back to Operator
      </button>

      {/* Cart hero card */}
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
          {/* Cart icon */}
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
            <LuShoppingCart size={20} />
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
                  letterSpacing: "0.02em",
                }}
              >
                {cart.serialNumber}
              </span>
              <StatusChip status={cart.status} />
              {/* Online indicator */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: cart.isOnline
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(107,114,128,0.1)",
                  color: cart.isOnline ? "#22c55e" : "#6b7280",
                  border: `1px solid ${cart.isOnline ? "rgba(34,197,94,0.25)" : "rgba(107,114,128,0.25)"}`,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: cart.isOnline ? "#22c55e" : "#9ca3af",
                  }}
                />
                {cart.isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {/* Location */}
            {cart.location && (
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
                {cart.location.name}
                {cart.location.city ? ` · ${cart.location.city}` : ""}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        {cart.concepts?.length > 0 && (
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
            <div className="icart_summary_chip">
              <MdRestaurantMenu size={12} />
              {cart.concepts.length} Concept
              {cart.concepts.length !== 1 ? "s" : ""}
            </div>
            {cart.operators?.length > 0 && (
              <div className="icart_summary_chip">
                👤 {cart.operators.length} Operator
                {cart.operators.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab bar */}
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
                transition: "color 0.15s, border-color 0.15s",
                fontFamily: "inherit",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "tasks" && <TasksTab cartId={cartId} />}
      {activeTab === "inventory" && <InventoryTab cartId={cartId} />}
      {activeTab === "menu" && <MenuTab concepts={cart.concepts} />}
      {activeTab === "elearning" && <ELearningTab concepts={cart.concepts} />}
      {activeTab === "sales" && (
        <SalesTab cartId={cartId} concepts={cart.concepts} isOperator={true} />
      )}
    </div>
  );
}
