import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import IcartOrders from "../../icart/IcartOrders";
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
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/* ── helpers ──────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function StatusChip({ status }) {
  const colors = {
    PENDING:    { bg: "rgba(234,179,8,0.1)",   color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
    IN_PROGRESS:{ bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "rgba(59,130,246,0.25)" },
    COMPLETED:  { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", border: "rgba(34,197,94,0.25)" },
    MISSED:     { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "rgba(239,68,68,0.25)" },
    SUBMITTED:  { bg: "rgba(168,85,247,0.1)",  color: "#a855f7", border: "rgba(168,85,247,0.25)" },
    CREATED:    { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.25)" },
    ACTIVE:     { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  };
  const s = colors[status] || colors.PENDING;
  return (
    <span className="icart_status_badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <MdCircle size={5} /> {status}
    </span>
  );
}

const TABS = [
  { key: "tasks",     label: "Tasks",     icon: <MdTask size={15} /> },
  { key: "inventory", label: "Inventory", icon: <MdInventory2 size={15} /> },
  { key: "menu",      label: "Menu",      icon: <MdMenuBook size={15} /> },
  { key: "elearning", label: "E-Learning",icon: <MdSchool size={15} /> },
  { key: "sales",     label: "Sales",     icon: <MdPointOfSale size={15} /> },
  { key: "orders",    label: "Orders",    icon: <MdOutlineShoppingBag size={15} /> },
];

/* ════════════════════════════════════════════════════════════
   TAB: TASKS
   ════════════════════════════════════════════════════════════ */
function TaskSubmitForm({ task, onSubmitted }) {
  const schema = task.template?.schema?.fields || [];
  const [formData, setFormData] = useState(
    Object.fromEntries(schema.map((f) => [f.label, f.type === "checkbox" ? false : ""]))
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
      {schema.map((field, i) => (
        <div key={i} className="form-field">
          <label className="modal-label">{field.label}</label>
          {field.type === "checkbox" ? (
            <button
              className={`icart_checkbox_btn ${formData[field.label] ? "icart_checkbox_checked" : ""}`}
              onClick={() => setFormData((p) => ({ ...p, [field.label]: !p[field.label] }))}
            >
              {formData[field.label] ? <MdCheckBox size={18} /> : <MdCheckBoxOutlineBlank size={18} />}
              <span>{formData[field.label] ? "Done" : "Mark as done"}</span>
            </button>
          ) : (
            <input
              className="modal-input"
              type={field.type === "number" ? "number" : "text"}
              value={formData[field.label]}
              onChange={(e) => setFormData((p) => ({ ...p, [field.label]: e.target.value }))}
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
        {submitting && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
      </button>
    </div>
  );
}

function TaskCard({ task, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const isPending = task.status === "PENDING" || task.status === "IN_PROGRESS";

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="icart_task_icon"><MdTask size={14} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="icart_task_name">{task.template?.name || task.name || "Task"}</div>
          <div className="icart_task_meta">
            {task.template?.recurrence && <span>{task.template.recurrence}</span>}
            {task.dueAt && <><span className="contract_row_dot">·</span><span>Due {fmtDate(task.dueAt)}</span></>}
          </div>
        </div>
        <StatusChip status={task.status} />
        {expanded ? <MdExpandLess size={16} style={{ color: "var(--text-muted)" }} /> : <MdExpandMore size={16} style={{ color: "var(--text-muted)" }} />}
      </div>

      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
          {task.data && Object.keys(task.data).length > 0 && (
            <div className="icart_task_data" style={{ marginTop: 12 }}>
              {Object.entries(task.data).map(([k, v]) => (
                <div key={k} className="icart_task_data_row">
                  <span className="icart_meta_key">{k}</span>
                  <span className="icart_meta_val">
                    {typeof v === "boolean"
                      ? (v ? <MdCheck size={14} style={{ color: "#22c55e" }} /> : <MdClose size={14} style={{ color: "#ef4444" }} />)
                      : String(v)}
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
              style={{ marginTop: 12, height: 36, padding: "0 16px", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 5 }}
              onClick={() => setShowSubmit((v) => !v)}
            >
              {showSubmit ? "Cancel" : "Complete Task"}
            </button>
          )}
          {showSubmit && <TaskSubmitForm task={task} onSubmitted={() => { setShowSubmit(false); onRefresh(); }} />}
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
    } catch { toast.error("Failed to load tasks"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, [cartId]);

  if (loading) return <div className="drawer_loading"><div className="page_loader_spinner" /></div>;

  return tasks.length === 0 ? (
    <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
      <MdTask size={28} style={{ opacity: 0.3 }} />
      <span>No pending tasks</span>
    </div>
  ) : (
    <div>{tasks.map((t) => <TaskCard key={t.id} task={t} onRefresh={fetchTasks} />)}</div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB: INVENTORY
   ════════════════════════════════════════════════════════════ */
const SEARCH_URL = (q) => `/library/ingredient?returnPrep=true&search=${encodeURIComponent(q)}&limit=8`;
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
  const [supplyItems, setSupplyItems] = useState([{ query: "", ingredient: null, quantity: "", unit: "g" }]);
  const [submittingSupply, setSubmittingSupply] = useState(false);
  const [searchResults, setSearchResults] = useState({});
  const [searching, setSearching] = useState({});

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/inventory/icart/${cartId}`);
      setInventory(res.data.data?.items || res.data.data || []);
    } catch { toast.error("Failed to load inventory"); }
    finally { setLoading(false); }
  };

  const fetchSupply = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/supply?cartId=${cartId}`);
      setSupply(res.data.data?.requests || res.data.data?.items || res.data.data || []);
    } catch { toast.error("Failed to load supply"); }
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/icart/inventory/history?cartId=${cartId}`);
      setHistory(res.data.data?.items || res.data.data || []);
    } catch { toast.error("Failed to load history"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (view === "stock") fetchStock();
    else if (view === "supply") fetchSupply();
    else if (view === "history") fetchHistory();
  }, [view]);

  useEffect(() => {
    api.get("/supplier").then((r) => {
      const d = r.data.data;
      setSuppliers(Array.isArray(d) ? d : d?.suppliers || d?.items || []);
    }).catch(() => {});
  }, []);

  const handleRecordUsage = async () => {
    if (!usageItem || !usageQty || Number(usageQty) <= 0) return toast.error("Enter a valid quantity");
    const notesStr = usageNotes.trim() ? `[${usageReason}] ${usageNotes.trim()}` : usageReason;
    setSaving(true);
    try {
      await api.post("/icart/inventory/record-usage", {
        itemId: usageItem.id,
        quantity: toBase(usageQty, usageUnit),
        notes: notesStr,
      });
      toast.success("Usage recorded");
      setUsageItem(null);
      setUsageQty(""); setUsageNotes("");
      fetchStock();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const searchIngredient = async (idx, q) => {
    if (!q.trim()) { setSearchResults((p) => ({ ...p, [idx]: [] })); return; }
    setSearching((p) => ({ ...p, [idx]: true }));
    try {
      const r = await api.get(SEARCH_URL(q));
      const d = r.data.data;
      const items = [
        ...(d?.ingredient || []).map((i) => ({ ...i, _type: "INGREDIENT" })),
        ...(d?.preps || []).map((i) => ({ ...i, _type: "PREP_ITEM" })),
      ];
      setSearchResults((p) => ({ ...p, [idx]: items }));
    } catch { setSearchResults((p) => ({ ...p, [idx]: [] })); }
    finally { setSearching((p) => ({ ...p, [idx]: false })); }
  };

  const handleSubmitSupply = async () => {
    if (!supplierId) return toast.error("Select a supplier");
    const valid = supplyItems.filter((r) => r.ingredient && r.quantity && Number(r.quantity) > 0);
    if (!valid.length) return toast.error("Add at least one ingredient");
    setSubmittingSupply(true);
    try {
      await api.post("/icart/supply", {
        cartId,
        supplierId,
        items: valid.map((row) => ({ ingredientId: row.ingredient.id, quantity: toBase(row.quantity, row.unit) })),
      });
      toast.success("Supply request submitted");
      setShowSupplyForm(false);
      setSupplyItems([{ query: "", ingredient: null, quantity: "", unit: "g" }]);
      setSupplierId("");
      // Always switch to supply tab and re-fetch
      setView("supply");
      setTimeout(() => fetchSupply(), 100); // ensure state update completes first
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSubmittingSupply(false); }
  };

  return (
    <div>
      {/* Sub-nav */}
      <div className="icart_sub_nav" style={{ marginBottom: 16 }}>
        {[
          { key: "stock", label: "Stock", icon: <MdInventory2 size={13} /> },
          { key: "supply", label: "Supply", icon: <MdLocalShipping size={13} /> },
          { key: "history", label: "History", icon: <MdHistory size={13} /> },
        ].map((sv) => (
          <button key={sv.key} className={`icart_sub_nav_btn ${view === sv.key ? "icart_sub_nav_active" : ""}`} onClick={() => { setView(sv.key); setShowSupplyForm(false); }}>
            {sv.icon} {sv.label}
          </button>
        ))}
        {view === "supply" && (
          <button className={`icart_sub_nav_btn ${showSupplyForm ? "icart_sub_nav_active" : ""}`} style={{ marginLeft: "auto" }} onClick={() => setShowSupplyForm((v) => !v)}>
            <MdAdd size={13} /> Request
          </button>
        )}
      </div>

      {loading ? (
        <div className="drawer_loading"><div className="page_loader_spinner" /></div>
      ) : view === "stock" ? (
        <>
          {inventory.length === 0 ? (
            <div className="icart_empty_inline" style={{ padding: "40px 0" }}><MdInventory2 size={28} style={{ opacity: 0.3 }} /><span>No inventory items</span></div>
          ) : inventory.map((item) => {
            const name = item.ingredient?.name || item.prepItem?.name || item.menuItem?.name || "Item";
            const img = item.ingredient?.image || item.prepItem?.image || null;
            const isActive = usageItem?.id === item.id;
            const isLow = item.quantity < 5;
            return (
              <div key={item.id} style={{ background: "var(--bg-card)", border: `1px solid ${isLow ? "rgba(239,68,68,0.3)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                  {img ? <img src={img} alt={name} style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} /> : (
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MdInventory2 size={16} style={{ color: "var(--text-muted)" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="icart_task_name">{name}</div>
                    <div className="icart_task_meta">
                      <span>{item.type?.replace("_", " ")}</span>
                      {isLow && <span style={{ color: "#ef4444", fontWeight: 700 }}>· ⚠ LOW</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginRight: 8 }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)" }}>{item.quantity?.toLocaleString()}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{item.ingredient?.unit || "units"}</div>
                  </div>
                  <button
                    className="icart_icon_action_btn"
                    title="Record usage"
                    style={{ color: isActive ? "var(--accent)" : undefined, borderColor: isActive ? "rgba(203,108,220,0.4)" : undefined }}
                    onClick={() => { setUsageItem(isActive ? null : item); setUsageQty(""); setUsageNotes(""); }}
                  >
                    <MdRemoveCircleOutline size={14} />
                  </button>
                </div>

                {isActive && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
                    <div style={{ paddingTop: 10, paddingBottom: 8, fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Record Usage</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input className="modal-input" type="number" style={{ flex: 1 }} placeholder="Quantity used" value={usageQty} onChange={(e) => setUsageQty(e.target.value)} />
                      {(() => {
                        const uOpts = getUnitOptions(item.ingredient?.unit || item.prepItem?.unit);
                        return uOpts.length > 1 ? (
                          <select className="modal-input" style={{ width: 76 }} value={usageUnit} onChange={(e) => setUsageUnit(e.target.value)}>
                            {uOpts.map((u) => <option key={u}>{u}</option>)}
                          </select>
                        ) : (
                          <div className="modal-input" style={{ width: 76, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                            {uOpts[0] || "unit"}
                          </div>
                        );
                      })()}
                    </div>
                    {(usageUnit === "kg" || usageUnit === "L") && usageQty && (
                      <div style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 600, marginBottom: 8 }}>
                        → {toBase(usageQty, usageUnit).toLocaleString()} {usageUnit === "kg" ? "g" : "ml"} will be recorded
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <select className="modal-input" value={usageReason} onChange={(e) => setUsageReason(e.target.value)}>
                        {REASON_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                      </select>
                      <input className="modal-input" placeholder="Notes (optional)" value={usageNotes} onChange={(e) => setUsageNotes(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="app_btn app_btn_cancel" style={{ flex: 1, height: 36 }} onClick={() => setUsageItem(null)}>Cancel</button>
                      <button
                        className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
                        style={{ flex: 2, height: 36, position: "relative" }}
                        onClick={handleRecordUsage}
                        disabled={saving}
                      >
                        <span className="btn_text">Record</span>
                        {saving && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      ) : view === "supply" ? (
        <>
          {showSupplyForm && (
            <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="drawer_section_title">New Supply Request</div>
              <div className="form-field">
                <label className="modal-label">Supplier *</label>
                <select className="modal-input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  <option value="">Select supplier…</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.businessName || s.user?.fullName || s.id.slice(0, 8)}</option>)}
                </select>
              </div>
              {supplyItems.map((row, i) => (
                <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Ingredient {i + 1}</span>
                    {supplyItems.length > 1 && (
                      <button className="icart_icon_action_btn icart_icon_danger" style={{ width: 22, height: 22 }} onClick={() => setSupplyItems((p) => p.filter((_, idx) => idx !== i))}>
                        <MdClose size={12} />
                      </button>
                    )}
                  </div>
                  {/* Search */}
                  <div style={{ position: "relative" }}>
                    <div className="icart_search_wrap" style={{ height: 40 }}>
                      <MdSearch size={15} style={{ color: "var(--text-muted)" }} />
                      <input
                        className="modal-input"
                        style={{ border: "none", background: "transparent", padding: 0, flex: 1, outline: "none" }}
                        placeholder="Search ingredient…"
                        value={row.query}
                        onChange={(e) => {
                          const q = e.target.value;
                          setSupplyItems((p) => { const u = [...p]; u[i] = { ...u[i], query: q, ingredient: null }; return u; });
                          searchIngredient(i, q);
                        }}
                      />
                      {row.ingredient && <MdCheck size={14} style={{ color: "#16a34a" }} />}
                    </div>
                    {searchResults[i]?.length > 0 && !row.ingredient && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, zIndex: 50, maxHeight: 160, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                        {(searching[i] ? [] : searchResults[i]).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => { setSupplyItems((p) => { const u = [...p]; u[i] = { ...u[i], ingredient: item, query: item.name }; return u; }); setSearchResults((p) => ({ ...p, [i]: [] })); }}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            {item.image ? <img src={item.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} /> : <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}><MdImage size={13} style={{ color: "var(--text-muted)" }} /></div>}
                            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-body)" }}>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {row.ingredient && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="modal-input" type="number" style={{ flex: 1 }} placeholder="Quantity" value={row.quantity} onChange={(e) => setSupplyItems((p) => { const u = [...p]; u[i] = { ...u[i], quantity: e.target.value }; return u; })} />
                      <select className="modal-input" style={{ width: 76 }} value={row.unit} onChange={(e) => setSupplyItems((p) => { const u = [...p]; u[i] = { ...u[i], unit: e.target.value }; return u; })}>
                        {getUnitOptions(row.ingredient?.unit).map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setSupplyItems((p) => [...p, { query: "", ingredient: null, quantity: "", unit: "g" }])} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                <MdAdd size={14} /> Add ingredient
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="app_btn app_btn_cancel" style={{ flex: 1, height: 38 }} onClick={() => setShowSupplyForm(false)}>Cancel</button>
                <button
                  className={`app_btn app_btn_confirm${submittingSupply ? " btn_loading" : ""}`}
                  style={{ flex: 2, height: 38, position: "relative" }}
                  onClick={handleSubmitSupply}
                  disabled={submittingSupply}
                >
                  <span className="btn_text">Submit Request</span>
                  {submittingSupply && <span className="btn_loader" style={{ width: 13, height: 13 }} />}
                </button>
              </div>
            </div>
          )}
          {supply.length === 0 && !showSupplyForm ? (
            <div className="icart_empty_inline" style={{ padding: "40px 0" }}><MdLocalShipping size={28} style={{ opacity: 0.3 }} /><span>No supply requests</span></div>
          ) : supply.map((req) => (
            <div key={req.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <div className="icart_task_icon"><MdLocalShipping size={14} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="icart_task_name">
                  {req.items?.length > 0
                    ? req.items.map((it) => it.ingredient?.name || "Item").join(", ")
                    : "Supply Request"}
                </div>
                <div className="icart_task_meta">
                  {req.items?.length > 0 && (
                    <span>{req.items.length} ingredient{req.items.length !== 1 ? "s" : ""}</span>
                  )}
                  {req.supplier?.businessName && (
                    <> · {req.supplier.businessName}</>
                  )}
                </div>
              </div>
              <StatusChip status={req.status} />
            </div>
          ))}
        </>
      ) : (
        // History
        history.length === 0 ? (
          <div className="icart_empty_inline" style={{ padding: "40px 0" }}><MdHistory size={28} style={{ opacity: 0.3 }} /><span>No history yet</span></div>
        ) : history.map((entry, i) => (
          <div key={entry.id || i} className="icart_history_row" style={{ marginBottom: 6 }}>
            <div className="icart_task_icon">
              {entry.delta > 0 ? <MdAdd size={13} style={{ color: "#22c55e" }} /> : <MdRemoveCircleOutline size={13} style={{ color: "#ef4444" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="icart_task_name">{entry.ingredient?.name || entry.item?.name || "Item"}</div>
              <div className="icart_task_meta">{entry.notes || (entry.delta > 0 ? "Added" : "Removed")}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: entry.delta > 0 ? "#22c55e" : "#ef4444" }}>
                {entry.delta > 0 ? "+" : ""}{entry.delta ?? entry.quantity}
              </div>
              <div className="icart_operator_meta">{fmtDate(entry.createdAt)}</div>
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
  if (!concepts?.length) return (
    <div className="icart_empty_inline" style={{ padding: "40px 0" }}><MdMenuBook size={28} style={{ opacity: 0.3 }} /><span>No concepts assigned</span></div>
  );

  return (
    <div>
      {concepts.map((concept) => {
        const isOpen = expanded[concept.id];
        const items = concept.menuItems || [];
        return (
          <div key={concept.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
            {/* Concept header */}
            <div
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
              onClick={() => setExpanded((p) => ({ ...p, [concept.id]: !p[concept.id] }))}
            >
              <div className="icart_concept_icon"><MdRestaurantMenu size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)" }}>{concept.name}</div>
                <div className="icart_task_meta">
                  <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                  {concept.status && <><span className="contract_row_dot">·</span><StatusChip status={concept.status} /></>}
                </div>
              </div>
              {isOpen ? <MdExpandLess size={18} style={{ color: "var(--text-muted)" }} /> : <MdExpandMore size={18} style={{ color: "var(--text-muted)" }} />}
            </div>

            {isOpen && items.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-hover)" }}
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MdImage size={18} style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-body)" }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>{item.description}</div>}
                  {item.ticketTime > 0 && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>⏱ {item.ticketTime} min prep</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)" }}>₦{Number(item.sellingPrice || 0).toLocaleString()}</div>
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
    } catch { toast.error("Failed to load concept summary"); }
    finally { setLoadingSummary(false); }
  };

  if (!concepts?.length) return (
    <div className="icart_empty_inline" style={{ padding: "40px 0" }}><MdSchool size={28} style={{ opacity: 0.3 }} /><span>No concepts available</span></div>
  );

  return (
    <div>
      {/* Concept selector */}
      {concepts.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {concepts.map((c) => (
            <button
              key={c.id}
              onClick={() => loadSummary(c.id)}
              style={{
                padding: "7px 16px", border: "1px solid var(--border)", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                background: selected === c.id ? "var(--bg-active)" : "var(--bg-hover)",
                color: selected === c.id ? "var(--accent)" : "var(--text-muted)",
                borderColor: selected === c.id ? "rgba(203,108,220,0.4)" : "var(--border)",
                fontWeight: 700, fontSize: "0.8rem",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Auto-load single concept */}
      {concepts.length === 1 && !selected && (() => { loadSummary(concepts[0].id); return null; })()}

      {loadingSummary && <div className="drawer_loading"><div className="page_loader_spinner" /></div>}

      {summary && (
        <div>
          {/* Concept hero */}
          {summary.concept?.banner && (
            <img src={summary.concept.banner} alt={summary.concept.name} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 14, marginBottom: 16 }} />
          )}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              {summary.vendor?.brandLogo && <img src={summary.vendor.brandLogo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />}
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-heading)" }}>{summary.concept.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{summary.vendor?.businessName}</div>
              </div>
            </div>
            {summary.concept.description && <p style={{ fontSize: "0.85rem", color: "var(--text-body)", lineHeight: 1.6, margin: "0 0 8px" }}>{summary.concept.description}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {summary.concept.origin && <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>🌍 {summary.concept.origin}</span>}
              {summary.concept.serveTo && <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>👥 {summary.concept.serveTo}</span>}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
            {[
              { label: "Menu Items", value: summary.stats?.totalMenuItems },
              { label: "Ingredients", value: summary.stats?.totalUniqueIngredients },
              { label: "Prep Items", value: summary.stats?.totalUniquePrepItems },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--accent)" }}>{s.value}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Menu items with recipes */}
          <div className="drawer_section_title" style={{ marginBottom: 12 }}>Menu Items & Recipes</div>
          {summary.menuItems?.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <div key={item.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
                {/* Item header */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setActiveItem(isActive ? null : item.id)}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MdImage size={20} style={{ color: "var(--text-muted)" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)" }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 1 }}>{item.description}</div>}
                    <div className="icart_task_meta" style={{ marginTop: 4 }}>
                      <span>{item.recipe?.length || 0} recipe steps</span>
                      {item.ticketTime > 0 && <><span className="contract_row_dot">·</span><span>⏱ {item.ticketTime} min</span></>}
                      {item.tutorialVideo && <><span className="contract_row_dot">·</span><span style={{ color: "#ef4444" }}>▶ Video</span></>}
                    </div>
                  </div>
                  {isActive ? <MdExpandLess size={18} style={{ color: "var(--text-muted)" }} /> : <MdExpandMore size={18} style={{ color: "var(--text-muted)" }} />}
                </div>

                {isActive && (
                  <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-hover)" }}>
                    {/* Tutorial video */}
                    {item.tutorialVideo && (
                      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Tutorial Video</div>
                        <video
                          src={item.tutorialVideo}
                          controls
                          style={{ width: "100%", borderRadius: 10, maxHeight: 220, background: "#000" }}
                        />
                      </div>
                    )}

                    {/* Recipe steps */}
                    {item.recipe?.length > 0 && (
                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Recipe</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {item.recipe.map((step, si) => {
                            const ing = step.ingredient || step.prepItem;
                            return (
                              <div key={step.id || si} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                {/* Step number */}
                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.3)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, flexShrink: 0 }}>
                                  {si + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {/* Ingredient */}
                                  {ing && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                      {ing.image ? (
                                        <img src={ing.image} alt={ing.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                                      ) : (
                                        <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                          <MdImage size={12} style={{ color: "var(--text-muted)" }} />
                                        </div>
                                      )}
                                      <div>
                                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)" }}>{ing.name}</span>
                                        <span style={{ fontSize: "0.72rem", color: "var(--accent)", fontWeight: 700, marginLeft: 6 }}>{step.quantity}{ing.unit}</span>
                                      </div>
                                    </div>
                                  )}
                                  {/* Instruction */}
                                  {step.instruction && (
                                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{step.instruction}</p>
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
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Extras / Add-ons</div>
                        {item.extras.map((ex, ei) => (
                          <div key={ei} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "0.8rem" }}>
                            <span style={{ color: "var(--text-body)", fontWeight: 600 }}>{ex.name}</span>
                            <span style={{ color: "var(--accent)", fontWeight: 700 }}>₦{Number(ex.price || 0).toLocaleString()}</span>
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
              <div className="drawer_section_title" style={{ marginBottom: 10, marginTop: 20 }}>All Ingredients</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {summary.ingredients.map((ing) => (
                  <div key={ing.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }}>
                    {ing.image ? (
                      <img src={ing.image} alt={ing.name} style={{ width: 30, height: 30, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MdImage size={13} style={{ color: "var(--text-muted)" }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)" }}>{ing.name}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        Total: {ing.totalQuantity}{ing.unit} · Used in: {ing.usedIn?.map((u) => u.menuItem).join(", ")}
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
  CASH:     { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", border: "rgba(34,197,94,0.2)" },
  POS:      { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
  TRANSFER: { bg: "rgba(168,85,247,0.1)",  color: "#a855f7", border: "rgba(168,85,247,0.2)" },
  OTHER:    { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.2)" },
};

function PaymentBadge({ method }) {
  const c = pmColors[method] || pmColors.OTHER;
  return (
    <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "3px 9px", borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
      {method}
    </span>
  );
}

/* ── Record Sale Form — shop-style with variants & extras ─── */
function ItemCustomiser({ item, cartId, onConfirm, onClose }) {
  const hasVariants = item.variants?.length > 0;
  const hasExtras   = item.extras?.length > 0;
  const [selectedVariant, setSelectedVariant] = useState(hasVariants ? item.variants[0].id : null);
  const [selectedExtras,  setSelectedExtras]  = useState([]);
  const [qty,             setQty]             = useState(1);
  const [price,           setPrice]           = useState(item.sellingPrice || 0);
  const [fetchingPrice,   setFetchingPrice]   = useState(false);

  useEffect(() => {
    setFetchingPrice(true);
    api.get(`/library/price/menu/${item.id}`, { params: {
      cartId,
      ...(selectedVariant ? { variantId: selectedVariant } : {}),
      ...(selectedExtras.length ? { "extras[]": selectedExtras } : {}),
    }})
      .then((r) => {
        const d = r.data.data;
        setPrice(Number(d?.sellingPrice ?? d?.price ?? d?.total ?? item.sellingPrice ?? 0));
      })
      .catch(() => setPrice(item.sellingPrice || 0))
      .finally(() => setFetchingPrice(false));
  }, [selectedVariant, selectedExtras.join(",")]);

  const toggleExtra = (id) => setSelectedExtras((p) => p.includes(id) ? p.filter((e) => e !== id) : [...p, id]);

  const confirm = () => {
    const variantObj = item.variants?.find((v) => v.id === selectedVariant) || null;
    const extrasObjs = item.extras?.filter((e) => selectedExtras.includes(e.id)) || [];
    onConfirm({ item, qty, variantId: selectedVariant, extraIds: selectedExtras, variantLabel: variantObj?.name || null, extrasLabels: extrasObjs.map((e) => e.name), unitPrice: price });
    onClose();
  };

  const totalPrice = price * qty;
  const fmt = (n) => Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 520, background: "var(--bg-card)", borderRadius: "20px 20px 0 0", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)", animation: "saleSlideUp 0.25s ease" }}>
        <style>{`@keyframes saleSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border)" }} />
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 8px" }}>
          {/* Item header */}
          <div style={{ display: "flex", gap: 14, marginBottom: 20, paddingTop: 4 }}>
            {item.image
              ? <img src={item.image} alt={item.name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 72, height: 72, borderRadius: 12, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdImage size={24} style={{ color: "var(--text-muted)" }} /></div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-heading)", marginBottom: 4 }}>{item.name}</div>
              {item.description && <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{item.description}</div>}
              <div style={{ marginTop: 6, fontSize: "1rem", fontWeight: 900, color: "var(--accent)" }}>
                {fetchingPrice ? <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Calculating…</span> : price > 0 ? `₦${fmt(price)}` : "Price TBD"}
              </div>
            </div>
          </div>

          {/* Variants */}
          {hasVariants && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Choose Variant <span style={{ color: "#ef4444" }}>*</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {item.variants.map((v) => {
                  const active = selectedVariant === v.id;
                  return (
                    <button key={v.id} onClick={() => setSelectedVariant(v.id)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit", background: active ? "var(--bg-active)" : "var(--bg-hover)", border: `1px solid ${active ? "rgba(203,108,220,0.4)" : "var(--border)"}`, transition: "all 0.12s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />}
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: active ? 700 : 500, color: active ? "var(--accent)" : "var(--text-body)" }}>{v.name}</span>
                      </div>
                      {v.priceAddition > 0 && <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>+₦{fmt(v.priceAddition)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras */}
          {hasExtras && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Extras <span style={{ fontSize: "0.65rem", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {item.extras.map((ex) => {
                  const active = selectedExtras.includes(ex.id);
                  return (
                    <button key={ex.id} onClick={() => toggleExtra(ex.id)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit", background: active ? "var(--bg-active)" : "var(--bg-hover)", border: `1px solid ${active ? "rgba(203,108,220,0.4)" : "var(--border)"}`, transition: "all 0.12s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {active && <MdCheck size={12} style={{ color: "#fff" }} />}
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: active ? 700 : 500, color: active ? "var(--accent)" : "var(--text-body)" }}>{ex.name}</span>
                      </div>
                      {ex.price > 0 && <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>+₦{fmt(ex.price)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div style={{ padding: "14px 20px 28px", borderTop: "1px solid var(--border)", background: "var(--bg-card)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Qty stepper */}
            <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 38, height: 42, background: "var(--bg-hover)", border: "none", cursor: "pointer", color: "var(--text-body)", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ minWidth: 36, textAlign: "center", fontSize: "0.9rem", fontWeight: 900, color: "var(--text-heading)", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", lineHeight: "42px" }}>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} style={{ width: 38, height: 42, background: "var(--bg-hover)", border: "none", cursor: "pointer", color: "var(--text-body)", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            <button onClick={confirm} className="app_btn app_btn_confirm" style={{ flex: 1, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "0.9rem", fontWeight: 800 }}>
              <MdAdd size={17} />
              Add to Order
              {!fetchingPrice && totalPrice > 0 && <span style={{ opacity: 0.85 }}>· ₦{fmt(totalPrice)}</span>}
              {fetchingPrice && <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "saleSpin 0.7s linear infinite" }} />}
            </button>
            <style>{`@keyframes saleSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordSaleForm({ cartId, concepts, onSaved }) {
  const allItems = (concepts || []).flatMap((c) =>
    (c.menuItems || []).map((item) => ({ ...item, conceptName: c.name, conceptId: c.id }))
  );
  const fmt = (n) => Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  // Cart: { key: { item, qty, variantId, extraIds, variantLabel, extrasLabels, unitPrice } }
  const [cart,         setCart]         = useState({});
  const [customising,  setCustomising]  = useState(null); // item being customised
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [saving,       setSaving]       = useState(false);
  const [activeConceptId, setActiveConceptId] = useState(allItems[0]?.conceptId || null);

  const pmColors = {
    CASH:     { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", border: "rgba(34,197,94,0.2)" },
    POS:      { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
    TRANSFER: { bg: "rgba(168,85,247,0.1)",  color: "#a855f7", border: "rgba(168,85,247,0.2)" },
    OTHER:    { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.2)" },
  };

  const addToCart = ({ item, qty, variantId, extraIds, variantLabel, extrasLabels, unitPrice }) => {
    const key = [item.id, variantId || "", ...(extraIds || []).sort()].join("_");
    setCart((prev) => ({
      ...prev,
      [key]: prev[key]
        ? { ...prev[key], qty: prev[key].qty + qty }
        : { item, qty, variantId, extraIds, variantLabel, extrasLabels, unitPrice }
    }));
    // haptic-like toast
    toast.success(`${item.name} added`, { autoClose: 800 });
  };

  const removeFromCart = (key) => setCart((prev) => {
    const n = { ...prev }; delete n[key]; return n;
  });
  const adjustQty = (key, delta) => setCart((prev) => {
    const e = prev[key];
    if (!e) return prev;
    const newQty = e.qty + delta;
    if (newQty <= 0) { const n = { ...prev }; delete n[key]; return n; }
    return { ...prev, [key]: { ...e, qty: newQty } };
  });

  const cartEntries = Object.entries(cart);
  const cartTotal   = cartEntries.reduce((s, [, e]) => s + (e.unitPrice || 0) * e.qty, 0);
  const cartCount   = cartEntries.reduce((s, [, e]) => s + e.qty, 0);

  const handleSubmit = async () => {
    if (!cartEntries.length) return toast.error("Add at least one item");
    setSaving(true);
    try {
      await api.post("/icart/sale", {
        cartId,
        paymentMethod,
        items: cartEntries.map(([, e]) => ({
          menuItemId: e.item.id,
          quantity:   e.qty,
          ...(e.variantId  ? { variantId: e.variantId }     : {}),
          ...(e.extraIds?.length ? { extras: e.extraIds }   : {}),
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

  // Group concepts
  const conceptGroups = (concepts || []).map((c) => ({
    ...c,
    items: c.menuItems || [],
  }));

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-heading)" }}>Record Sale</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>Tap an item to customise and add</div>
        </div>
        {/* Payment method */}
        <div style={{ display: "flex", gap: 5 }}>
          {["CASH", "POS", "TRANSFER", "OTHER"].map((m) => {
            const col = pmColors[m];
            const active = paymentMethod === m;
            return (
              <button key={m} onClick={() => setPaymentMethod(m)}
                style={{ height: 30, padding: "0 10px", border: `1px solid ${active ? col.border : "var(--border)"}`, borderRadius: 7, cursor: "pointer", background: active ? col.bg : "var(--bg-hover)", color: active ? col.color : "var(--text-muted)", fontWeight: 700, fontSize: "0.66rem", fontFamily: "inherit", transition: "all 0.15s" }}>
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Concept tabs (if multiple) */}
      {conceptGroups.length > 1 && (
        <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none", borderBottom: "1px solid var(--border)", padding: "0 16px" }}>
          {conceptGroups.map((c) => {
            const active = activeConceptId === c.id;
            return (
              <button key={c.id} onClick={() => setActiveConceptId(c.id)}
                style={{ padding: "10px 14px", background: "transparent", border: "none", borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`, color: active ? "var(--accent)" : "var(--text-muted)", fontSize: "0.78rem", fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}>
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Menu items grid */}
      <div style={{ padding: "12px 16px", maxHeight: 320, overflowY: "auto" }}>
        {conceptGroups
          .filter((c) => conceptGroups.length === 1 || c.id === activeConceptId)
          .map((c) => (
            <div key={c.id}>
              {conceptGroups.length === 1 && <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{c.name}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, marginBottom: 12 }}>
                {c.items.map((item) => {
                  const inCart = Object.values(cart).filter((e) => e.item.id === item.id).reduce((s, e) => s + e.qty, 0);
                  return (
                    <button key={item.id} onClick={() => setCustomising(item)}
                      style={{ background: inCart > 0 ? "var(--bg-active)" : "var(--bg-hover)", border: `1px solid ${inCart > 0 ? "rgba(203,108,220,0.35)" : "var(--border)"}`, borderRadius: 10, padding: "10px 10px 8px", cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s", position: "relative" }}>
                      {item.image
                        ? <img src={item.image} alt={item.name} style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 7, marginBottom: 7, display: "block" }} />
                        : <div style={{ width: "100%", height: 70, borderRadius: 7, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}><MdImage size={20} style={{ color: "var(--text-muted)", opacity: 0.4 }} /></div>
                      }
                      <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-body)", lineHeight: 1.3, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 800, color: inCart > 0 ? "var(--accent)" : "var(--text-muted)" }}>
                        {item.sellingPrice > 0 ? `₦${Number(item.sellingPrice).toLocaleString("en-NG", { maximumFractionDigits: 0 })}` : "—"}
                      </div>
                      {inCart > 0 && (
                        <div style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: "0.62rem", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{inCart}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Order summary */}
      {cartEntries.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Order ({cartCount} item{cartCount !== 1 ? "s" : ""})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {cartEntries.map(([key, entry]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "var(--bg-hover)", borderRadius: 9 }}>
                {entry.item.image
                  ? <img src={entry.item.image} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 30, height: 30, borderRadius: 6, background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdImage size={12} style={{ color: "var(--text-muted)" }} /></div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.item.name}</div>
                  {(entry.variantLabel || entry.extrasLabels?.length > 0) && (
                    <div style={{ fontSize: "0.64rem", color: "var(--text-muted)" }}>
                      {[entry.variantLabel, ...(entry.extrasLabels || [])].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                  <button onClick={() => adjustQty(key, -1)} style={{ width: 22, height: 22, borderRadius: 5, background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>−</button>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-heading)", minWidth: 16, textAlign: "center" }}>{entry.qty}</span>
                  <button onClick={() => adjustQty(key, +1)} style={{ width: 22, height: 22, borderRadius: 5, background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>+</button>
                </div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)", flexShrink: 0, minWidth: 56, textAlign: "right" }}>
                  {entry.unitPrice > 0 ? `₦${fmt(entry.unitPrice * entry.qty)}` : "—"}
                </div>
                <button onClick={() => removeFromCart(key)} style={{ width: 20, height: 20, borderRadius: 4, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MdClose size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Total + submit */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--accent)" }}>₦{fmt(cartTotal)}</div>
            </div>
            <button onClick={handleSubmit} disabled={saving}
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{ height: 44, padding: "0 24px", position: "relative", fontSize: "0.88rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span className="btn_text"><MdPointOfSale size={16} /> Submit Sale</span>
              {saving && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
            </button>
          </div>
        </div>
      )}

      {/* Customiser sheet */}
      {customising && (
        <ItemCustomiser
          item={customising}
          cartId={cartId}
          onConfirm={addToCart}
          onClose={() => setCustomising(null)}
        />
      )}
    </div>
  );
}

/* ── Sale Row ─────────────────────────────────────────────── */
function SaleRow({ sale }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", marginBottom: 8 }}>
      {/* Main row */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="icart_task_icon"><MdPointOfSale size={14} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)", fontFamily: "monospace" }}>
              #{sale.id.slice(0, 8).toUpperCase()}
            </span>
            <PaymentBadge method={sale.paymentMethod} />
          </div>
          <div className="icart_task_meta">
            <span>{sale.items?.length || 0} item{sale.items?.length !== 1 ? "s" : ""}</span>
            <span className="contract_row_dot">·</span>
            <span>{fmtDate(sale.createdAt)}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--text-heading)" }}>
            ₦{Number(sale.totalAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        {expanded
          ? <MdExpandLess size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          : <MdExpandMore size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        }
      </div>

      {/* Expanded items */}
      {expanded && sale.items?.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-hover)" }}>
          {sale.items.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
                borderBottom: idx < sale.items.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              {item.menuItem?.image ? (
                <img src={item.menuItem.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MdImage size={12} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-body)" }}>
                  {item.menuItem?.name || "Item"}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  qty: {item.quantity}
                </div>
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-heading)", flexShrink: 0 }}>
                ₦{Number(item.priceAtTime || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
    ]).then(([salesRes, analyticsRes]) => {
      if (salesRes.status === "fulfilled") {
        const d = salesRes.value.data.data;
        const all = Array.isArray(d) ? d : d?.items || [];
        // filter to this cart
        setSales(all.filter((s) => s.cartId === cartId || s.cart?.id === cartId));
      }
      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value.data.data);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSales(); }, [cartId]);

  const cartSales = sales; // already filtered
  const totalRevenue = cartSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

  const chartData = (analytics?.chartData || []).map((d) => ({
    ...d, sales: Math.round(d.sales), profit: Math.round(d.profit),
  }));
  const fmtChartDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";
  const fmtTick = (v) => `₦${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`;

  return (
    <div>
      {/* Summary cards */}
      {analytics?.totals && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Revenue", value: `₦${Number(analytics.totals.totalSales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, accent: false },
            { label: "Profit",  value: `₦${Number(analytics.totals.totalProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, accent: true },
          ].map((s) => (
            <div key={s.label} style={{ background: s.accent ? "var(--bg-active)" : "var(--bg-hover)", border: `1px solid ${s.accent ? "rgba(203,108,220,0.2)" : "var(--border)"}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: "1rem", fontWeight: 900, color: s.accent ? "var(--accent)" : "var(--text-heading)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sales Trend</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              {[{ color: "var(--accent)", label: "Revenue" }, { color: "#22c55e", label: "Profit" }].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-muted)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="opSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(203,108,220,0.3)" stopOpacity={1} />
                  <stop offset="95%" stopColor="rgba(203,108,220,0)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="opProfitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(34,197,94,0.25)" stopOpacity={1} />
                  <stop offset="95%" stopColor="rgba(34,197,94,0)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtChartDate} tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={fmtTick} width={40} />
              <Tooltip formatter={(v, name) => [`₦${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name === "sales" ? "Revenue" : "Profit"]} labelFormatter={fmtChartDate} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: "0.78rem" }} />
              <Area type="monotone" dataKey="sales" stroke="var(--accent)" strokeWidth={2} fill="url(#opSalesGrad)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} fill="url(#opProfitGrad)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary chips */}
      {cartSales.length > 0 && (
        <div className="icart_summary_row" style={{ marginBottom: 16 }}>
          <div className="icart_summary_chip"><MdPointOfSale size={12} />{cartSales.length} sale{cartSales.length !== 1 ? "s" : ""}</div>
          <div className="icart_summary_chip" style={{ color: "var(--accent)", background: "var(--bg-active)", borderColor: "rgba(203,108,220,0.2)" }}>
            ₦{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} total
          </div>
          {["CASH", "POS", "TRANSFER"].map((m) => {
            const count = cartSales.filter((s) => s.paymentMethod === m).length;
            if (!count) return null;
            const c = pmColors[m];
            return <div key={m} className="icart_summary_chip" style={{ color: c.color, background: c.bg, borderColor: c.border }}>{m} · {count}</div>;
          })}
        </div>
      )}

      {/* Record sale button — operator only */}
      {isOperator && (
        <div style={{ marginBottom: 14 }}>
          <button
            className={`app_btn${showForm ? " app_btn_cancel" : " app_btn_confirm"}`}
            style={{ height: 40, padding: "0 20px", display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 700 }}
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
          onSaved={() => { setShowForm(false); fetchSales(); }}
        />
      )}

      {loading ? (
        <div className="drawer_loading"><div className="page_loader_spinner" /></div>
      ) : cartSales.length === 0 ? (
        <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
          <MdPointOfSale size={28} style={{ opacity: 0.3 }} />
          <span>No sales recorded yet</span>
        </div>
      ) : (
        <div>{cartSales.map((sale) => <SaleRow key={sale.id} sale={sale} />)}</div>
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
    api.get(`/icart/${cartId}`)
      .then((r) => setCart(r.data.data))
      .catch(() => toast.error("Failed to load cart"))
      .finally(() => setLoading(false));
  }, [cartId]);

  if (loading) return (
    <div className="page_wrapper">
      <div className="page_loader"><div className="page_loader_spinner" /></div>
    </div>
  );

  if (!cart) return (
    <div className="page_wrapper">
      <div className="icart_empty_state" style={{ padding: "64px 0" }}>
        <LuShoppingCart size={32} style={{ opacity: 0.3 }} />
        <p className="icart_empty_title">Cart not found</p>
        <button className="app_btn app_btn_cancel" style={{ height: 38, padding: "0 20px" }} onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="page_wrapper">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "none", border: "none", color: "var(--text-muted)",
          fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
          padding: 0, marginBottom: 16, fontFamily: "inherit", transition: "color 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-body)"}
        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
      >
        <MdArrowBack size={16} /> Back to Operator
      </button>

      {/* Cart hero card */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "18px 20px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          {/* Cart icon */}
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)",
            color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <LuShoppingCart size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--text-heading)", fontFamily: "monospace", letterSpacing: "0.02em" }}>
                {cart.serialNumber}
              </span>
              <StatusChip status={cart.status} />
              {/* Online indicator */}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                background: cart.isOnline ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)",
                color: cart.isOnline ? "#22c55e" : "#6b7280",
                border: `1px solid ${cart.isOnline ? "rgba(34,197,94,0.25)" : "rgba(107,114,128,0.25)"}`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: cart.isOnline ? "#22c55e" : "#9ca3af" }} />
                {cart.isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {/* Location */}
            {cart.location && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <MdRestaurantMenu size={13} />
                {cart.location.name}
                {cart.location.city ? ` · ${cart.location.city}` : ""}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        {cart.concepts?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <div className="icart_summary_chip">
              <MdRestaurantMenu size={12} />
              {cart.concepts.length} Concept{cart.concepts.length !== 1 ? "s" : ""}
            </div>
            {cart.operators?.length > 0 && (
              <div className="icart_summary_chip">
                👤 {cart.operators.length} Operator{cart.operators.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", borderBottom: "1px solid var(--border)",
        marginBottom: 20, overflowX: "auto", scrollbarWidth: "none",
        background: "var(--bg-card)", borderRadius: "12px 12px 0 0",
        padding: "0 4px",
      }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 16px", background: "transparent", border: "none",
                borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                color: active ? "var(--accent)" : "var(--text-muted)",
                fontSize: "0.8rem", fontWeight: active ? 700 : 600,
                cursor: "pointer", whiteSpace: "nowrap",
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
      {activeTab === "tasks"     && <TasksTab cartId={cartId} />}
      {activeTab === "inventory" && <InventoryTab cartId={cartId} />}
      {activeTab === "menu"      && <MenuTab concepts={cart.concepts} />}
      {activeTab === "elearning" && <ELearningTab concepts={cart.concepts} />}
      {activeTab === "orders"    && <IcartOrders cartId={cartId} />}
      {activeTab === "sales"     && <SalesTab cartId={cartId} concepts={cart.concepts} isOperator={true} />}
    </div>
  );
}