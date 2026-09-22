import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MdOutlineWarehouse,
  MdOutlineStore,
  MdOutlineLocationOn,
  MdOutlineCategory,
  MdOutlineInventory2,
  MdOutlineHistory,
  MdEdit,
  MdDelete,
  MdClose,
  MdSearch,
  MdUpload,
  MdOutlineImage,
  MdOutlineTrendingUp,
  MdOutlineTrendingDown,
  MdOutlineSwapHoriz,
  MdOutlineTune,
  MdArrowBack,
  MdOutlineWarning,
  MdOutlineLabel,
  MdOutlineBuild,
  MdOutlineFastfood,
  MdOutlineLocalDrink,
  MdOutlineLocalShipping,
  MdOutlineStorage,
  MdOutlineSettings,
  MdOutlinePrint,
  MdOutlineAssignment,
  MdOutlineLightbulb,
  MdOutlineWater,
  MdOutlineScience,
  MdOutlinePrecisionManufacturing,
  MdOutlinePlace,
  MdOutlineCheckBox,
  MdOutlineElectricalServices,
  MdOutlineConstruction,
  MdOutlineShoppingCart,
} from "react-icons/md";
import { LuPlus, LuArrowLeft, LuArrowRight } from "react-icons/lu";
import api from "../../../api/axios";
import Modal from "../../../components/Modal";
import "./AdminInventory.css";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "—";

const fmtShortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

const LOCATION_TYPES = ["STORE", "WAREHOUSE", "FACTORY", "OTHER"];
const MOVEMENT_ACTIONS = ["IN", "OUT", "ADJUST", "TRANSFER"];

// ─── Location type → icon component ──────────────────────────────────────────

const LOC_TYPE_META = {
  STORE: { Icon: MdOutlineStore, bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  WAREHOUSE: { Icon: MdOutlineWarehouse, bg: "rgba(245,158,11,0.1)", color: "#d97706" },
  FACTORY: { Icon: MdOutlinePrecisionManufacturing, bg: "rgba(139,92,246,0.1)", color: "#7c3aed" },
  OTHER: { Icon: MdOutlinePlace, bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
};

function LocTypeIcon({ type, size = 16 }) {
  const meta = LOC_TYPE_META[type] || LOC_TYPE_META.OTHER;
  const { Icon } = meta;
  return <Icon size={size} />;
}

const locTypeColors = (type) => LOC_TYPE_META[type] || LOC_TYPE_META.OTHER;

// ─── Category icon system ─────────────────────────────────────────────────────
// Icons are stored as string keys in the DB; this map resolves them to components.

export const CAT_ICON_MAP = {
  box: { Icon: MdOutlineInventory2, label: "Box" },
  tools: { Icon: MdOutlineBuild, label: "Tools" },
  construction: { Icon: MdOutlineConstruction, label: "Construction" },
  science: { Icon: MdOutlineScience, label: "Science" },
  food: { Icon: MdOutlineFastfood, label: "Food" },
  drink: { Icon: MdOutlineLocalDrink, label: "Drink" },
  shipping: { Icon: MdOutlineLocalShipping, label: "Shipping" },
  storage: { Icon: MdOutlineStorage, label: "Storage" },
  settings: { Icon: MdOutlineSettings, label: "Settings" },
  print: { Icon: MdOutlinePrint, label: "Print" },
  label: { Icon: MdOutlineLabel, label: "Label" },
  assignment: { Icon: MdOutlineAssignment, label: "Documents" },
  electrical: { Icon: MdOutlineElectricalServices, label: "Electrical" },
  lighting: { Icon: MdOutlineLightbulb, label: "Lighting" },
  liquids: { Icon: MdOutlineWater, label: "Liquids" },
  warehouse: { Icon: MdOutlineWarehouse, label: "Warehouse" },
  shopping: { Icon: MdOutlineShoppingCart, label: "Shopping" },
  checklist: { Icon: MdOutlineCheckBox, label: "Checklist" },
};

function CatIconRenderer({ iconKey, size = 16, style }) {
  const entry = CAT_ICON_MAP[iconKey] || CAT_ICON_MAP.box;
  const { Icon } = entry;
  return <Icon size={size} style={style} />;
}

// ─── Item Conditions ─────────────────────────────────────────────────────────

export const ITEM_CONDITIONS = [
  { key: "NEW", label: "New / Raw", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", desc: "Brand new part or raw material" },
  { key: "COMPLETED", label: "Completed", color: "#10b981", bg: "rgba(16,185,129,0.1)", desc: "Finished assembly ready for deployment" },
  { key: "INCOMPLETE", label: "Incomplete", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", desc: "Work in progress / pending parts" },
  { key: "USED", label: "Used", color: "#64748b", bg: "rgba(100,116,139,0.1)", desc: "Previously used functional item" },
  { key: "REFURBISHED", label: "Refurbished", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", desc: "Repaired and certified working" },
  { key: "FAULTY", label: "Faulty", color: "#f97316", bg: "rgba(249,115,22,0.1)", desc: "Defective / needs inspection or repair" },
  { key: "NOT_WORKING", label: "Not Working", color: "#ef4444", bg: "rgba(239,68,68,0.1)", desc: "Non-functional / broken" },
  { key: "SCRAP", label: "Scrap", color: "#9ca3af", bg: "rgba(156,163,175,0.1)", desc: "Beyond repair / salvage only" },
];

const ITEM_COND_MAP = Object.fromEntries(ITEM_CONDITIONS.map((c) => [c.key, c]));

function ConditionBadge({ condition }) {
  const meta = ITEM_COND_MAP[condition] || ITEM_COND_MAP.NEW;
  return (
    <span
      className={`inv_cond_badge inv_cond_${(condition || "new").toLowerCase()}`}
      style={{
        background: meta.bg,
        color: meta.color,
        borderColor: `${meta.color}33`,
      }}
      title={meta.desc}
    >
      <span className="inv_cond_dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

// ─── Movement action icon ─────────────────────────────────────────────────────

const actionIcon = (action) => {
  if (action === "IN") return <MdOutlineTrendingUp size={12} />;
  if (action === "OUT") return <MdOutlineTrendingDown size={12} />;
  if (action === "TRANSFER") return <MdOutlineSwapHoriz size={12} />;
  return <MdOutlineTune size={12} />;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPageChange, total }) {
  if (totalPages <= 1) return null;
  return (
    <div className="inv_pagination">
      <span className="inv_pagination_info">
        Page {page} of {totalPages} · {total} items
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="app_btn app_btn_cancel"
          style={{ height: 32, padding: "0 12px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <LuArrowLeft size={13} /> Prev
        </button>
        <button
          className="app_btn app_btn_cancel"
          style={{ height: 32, padding: "0 12px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <LuArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

function LocationTypeChip({ type }) {
  const { color } = locTypeColors(type);
  return (
    <span className={`inv_type_chip inv_type_${type}`}>
      <LocTypeIcon type={type} size={11} />
      {type}
    </span>
  );
}

function ActionBadge({ action }) {
  return (
    <span className={`inv_action_badge inv_action_${action}`}>
      {actionIcon(action)} {action}
    </span>
  );
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, loading, name }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete" description={`Delete "${name}"? This cannot be undone.`}>
      <div className="modal-footer" style={{ paddingTop: 0 }}>
        <button className="app_btn app_btn_cancel" onClick={onClose}>Cancel</button>
        <button
          className={`app_btn app_btn_confirm${loading ? " btn_loading" : ""}`}
          style={{ background: "#ef4444", position: "relative", minWidth: 90 }}
          onClick={onConfirm}
          disabled={loading}
        >
          <span className="btn_text">Delete</span>
          {loading && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
        </button>
      </div>
    </Modal>
  );
}

// ─── LOCATIONS TAB ───────────────────────────────────────────────────────────

function LocationsTab() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "STORE", address: "", city: "", country: "Nigeria", notes: "", status: "ACTIVE" });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(h);
  }, [search]);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/physical-inventory/location", { params: { page, limit: 20, search: debouncedSearch || undefined } });
      const d = r.data.data;
      setLocations(d.locations || []);
      setTotal(d.total || 0);
      setTotalPages(d.totalPages || 1);
    } catch { toast.error("Failed to load locations"); }
    finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", type: "STORE", address: "", city: "", country: "Nigeria", notes: "", status: "ACTIVE" });
    setModalOpen(true);
  };

  const openEdit = (loc) => {
    setEditing(loc);
    setForm({ name: loc.name, type: loc.type, address: loc.address || "", city: loc.city || "", country: loc.country || "Nigeria", notes: loc.notes || "", status: loc.status });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/physical-inventory/location/${editing.id}`, form);
        toast.success("Location updated");
      } else {
        await api.post("/physical-inventory/location", form);
        toast.success("Location created");
      }
      setModalOpen(false);
      fetchLocations();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/physical-inventory/location/${deleteTarget.id}`);
      toast.success("Location deleted");
      setDeleteTarget(null);
      fetchLocations();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete"); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="inv_toolbar">
        <div className="inv_search_wrap">
          <MdSearch size={16} className="inv_search_icon" />
          <input className="inv_search" placeholder="Search locations…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="app_btn app_btn_confirm" style={{ height: 38, padding: "0 16px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }} onClick={openCreate}>
          <LuPlus size={14} /> New Location
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
          <div className="page_loader_spinner" />
        </div>
      ) : locations.length === 0 ? (
        <div className="inv_empty">
          <div className="inv_empty_icon"><MdOutlineLocationOn size={44} /></div>
          <h3>No locations yet</h3>
          <p>Create your first location — a store, warehouse, or factory.</p>
          <button className="app_btn app_btn_confirm" style={{ height: 36, padding: "0 16px", fontSize: "0.8rem", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }} onClick={openCreate}>
            <LuPlus size={13} /> Add Location
          </button>
        </div>
      ) : (
        <>
          <div className="inv_loc_grid">
            {locations.map((loc) => {
              const { bg, color, Icon } = locTypeColors(loc.type);
              return (
                <div key={loc.id} className="inv_loc_card">
                  <div className="inv_loc_card_header">
                    <div className="inv_loc_icon" style={{ background: bg, color }}>
                      <Icon size={20} />
                    </div>
                    <div className="inv_loc_info">
                      <div className="inv_loc_name">{loc.name}</div>
                      <div className="inv_loc_addr">{[loc.city, loc.country].filter(Boolean).join(", ") || "—"}</div>
                    </div>
                  </div>
                  <div className="inv_loc_meta">
                    <LocationTypeChip type={loc.type} />
                    <span className={`inv_status_${loc.status.toLowerCase()}`}>● {loc.status}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {loc._count?.items ?? 0} item{loc._count?.items !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {loc.address && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{loc.address}</div>}
                  <div className="inv_loc_actions">
                    <button className="biz_icon_btn" title="Edit" onClick={() => openEdit(loc)}>
                      <MdEdit size={14} />
                    </button>
                    <button className="biz_icon_btn biz_icon_btn_danger" title="Delete" onClick={() => setDeleteTarget(loc)}>
                      <MdDelete size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Location" : "New Location"} description="Physical location where inventory is stored.">
        <div className="modal-body">
          <div className="inv_form_grid" style={{ marginBottom: 12 }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Name *</label>
              <input className="modal-input" placeholder="e.g. Lagos Warehouse A" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Type</label>
              <select className="modal-input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                {LOCATION_TYPES.map((t) => {
                  const labels = { STORE: "Store", WAREHOUSE: "Warehouse", FACTORY: "Factory", OTHER: "Other" };
                  return <option key={t} value={t}>{labels[t]}</option>;
                })}
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Address</label>
              <input className="modal-input" placeholder="Street address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">City</label>
              <input className="modal-input" placeholder="e.g. Lagos" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Country</label>
              <input className="modal-input" placeholder="e.g. Nigeria" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Status</label>
              <select className="modal-input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label className="modal-label">Notes</label>
            <textarea className="modal-input" style={{ height: 60, padding: 8, resize: "vertical" }} placeholder="Optional notes…" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{ position: "relative", minWidth: 100 }}
              onClick={handleSave}
              disabled={saving}
            >
              <span className="btn_text">{editing ? "Save Changes" : "Create"}</span>
              {saving && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} name={deleteTarget?.name} />
    </div>
  );
}

// ─── CATEGORIES TAB ──────────────────────────────────────────────────────────

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#6366f1", icon: "box" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const COLOR_PRESETS = ["#6366f1", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#14b8a6", "#f97316", "#84cc16", "#6b7280"];

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/physical-inventory/category");
      setCategories(r.data.data?.categories || []);
    } catch { toast.error("Failed to load categories"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", color: "#6366f1", icon: "box" });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || "", color: cat.color, icon: cat.icon });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/physical-inventory/category/${editing.id}`, form);
        toast.success("Category updated");
      } else {
        await api.post("/physical-inventory/category", form);
        toast.success("Category created");
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/physical-inventory/category/${deleteTarget.id}`);
      toast.success("Category deleted");
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete"); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="inv_toolbar">
        <button className="app_btn app_btn_confirm" style={{ height: 38, padding: "0 16px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }} onClick={openCreate}>
          <LuPlus size={14} /> New Category
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><div className="page_loader_spinner" /></div>
      ) : categories.length === 0 ? (
        <div className="inv_empty">
          <div className="inv_empty_icon"><MdOutlineCategory size={44} /></div>
          <h3>No categories yet</h3>
          <p>Group your inventory items into categories for easier management.</p>
          <button className="app_btn app_btn_confirm" style={{ height: 36, padding: "0 16px", fontSize: "0.8rem", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }} onClick={openCreate}>
            <LuPlus size={13} /> Add Category
          </button>
        </div>
      ) : (
        <div className="inv_cat_grid">
          {categories.map((cat) => (
            <div key={cat.id} className="inv_cat_card">
              <div className="inv_cat_icon_box" style={{ background: `${cat.color}18`, color: cat.color }}>
                <CatIconRenderer iconKey={cat.icon} size={20} />
              </div>
              <div className="inv_cat_info">
                <div className="inv_cat_name">{cat.name}</div>
                <div className="inv_cat_count">{cat._count?.items ?? 0} items</div>
                {cat.description && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>{cat.description}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                <button className="biz_icon_btn" title="Edit" onClick={() => openEdit(cat)}><MdEdit size={13} /></button>
                <button className="biz_icon_btn biz_icon_btn_danger" title="Delete" onClick={() => setDeleteTarget(cat)}><MdDelete size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Category" : "New Category"} description="Group items for better organization.">
        <div className="modal-body">
          <div className="form-field">
            <label className="modal-label">Name *</label>
            <input className="modal-input" placeholder="e.g. Packaging Materials" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="modal-label">Description</label>
            <input className="modal-input" placeholder="Optional" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>

          {/* Icon picker — SVG icon grid */}
          <div className="form-field">
            <label className="modal-label">Icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {Object.entries(CAT_ICON_MAP).map(([key, { Icon, label }]) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => setForm((p) => ({ ...p, icon: key }))}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: form.icon === key ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: form.icon === key ? "var(--bg-active)" : "var(--bg-hover)",
                    color: form.icon === key ? "var(--accent)" : "var(--text-muted)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "border-color 0.15s, color 0.15s, background 0.15s",
                  }}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
            {/* selected icon label */}
            <div style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Selected: <strong style={{ color: "var(--text-body)" }}>{CAT_ICON_MAP[form.icon]?.label || "Box"}</strong>
            </div>
          </div>

          {/* Color picker */}
          <div className="form-field">
            <label className="modal-label">Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6, alignItems: "center" }}>
              {COLOR_PRESETS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: col }))}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", background: col,
                    border: form.color === col ? "3px solid var(--text-heading)" : "2px solid transparent",
                    cursor: "pointer", padding: 0,
                  }}
                />
              ))}
              <input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} style={{ width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer" }} />
            </div>
            {/* preview swatch */}
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${form.color}18`, color: form.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CatIconRenderer iconKey={form.icon} size={18} />
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Preview</span>
            </div>
          </div>

          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{ position: "relative", minWidth: 100 }}
              onClick={handleSave}
              disabled={saving}
            >
              <span className="btn_text">{editing ? "Save Changes" : "Create"}</span>
              {saving && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} name={deleteTarget?.name} />
    </div>
  );
}

// ─── ITEMS TAB ───────────────────────────────────────────────────────────────

function ItemsTab({ locations, categories }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", description: "", condition: "NEW", quantity: "", unit: "pcs", costPerUnit: "", lowStockLevel: "", locationId: "", categoryId: "", notes: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Movement modal
  const [movItem, setMovItem] = useState(null);
  const [movForm, setMovForm] = useState({ action: "IN", quantityChange: "", notes: "", reference: "", toLocationId: "" });
  const [savingMov, setSavingMov] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(h);
  }, [search]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/physical-inventory/item", {
        params: {
          page, limit: 20,
          search: debouncedSearch || undefined,
          locationId: filterLocation || undefined,
          categoryId: filterCategory || undefined,
          condition: filterCondition || undefined,
          lowStockOnly: filterLowStock || undefined,
        },
      });
      const d = r.data.data;
      setItems(d.items || []);
      setTotal(d.total || 0);
      setTotalPages(d.totalPages || 1);
    } catch { toast.error("Failed to load items"); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, filterLocation, filterCategory, filterCondition, filterLowStock]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", sku: "", description: "", condition: "NEW", quantity: "", unit: "pcs", costPerUnit: "", lowStockLevel: "", locationId: "", categoryId: "", notes: "" });
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name, sku: item.sku, description: item.description || "",
      condition: item.condition || "NEW",
      quantity: String(item.quantity), unit: item.unit, costPerUnit: item.costPerUnit != null ? String(item.costPerUnit) : "",
      lowStockLevel: String(item.lowStockLevel), locationId: item.locationId, categoryId: item.categoryId || "", notes: item.notes || "",
    });
    setImageFile(null);
    setImagePreview(item.image || null);
    setImageRemoved(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.locationId) return toast.error("Please select a location");
    if (form.quantity !== "" && Number(form.quantity) < 0) return toast.error("Quantity cannot be negative");
    if (form.lowStockLevel !== "" && Number(form.lowStockLevel) < 0) return toast.error("Low stock threshold cannot be negative");
    if (form.costPerUnit !== "" && Number(form.costPerUnit) < 0) return toast.error("Cost per unit cannot be negative");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      if (form.sku.trim()) fd.append("sku", form.sku.trim());
      if (form.description.trim()) fd.append("description", form.description.trim());
      if (form.condition) fd.append("condition", form.condition);
      if (form.quantity !== "") fd.append("quantity", form.quantity);
      if (form.unit) fd.append("unit", form.unit);
      if (form.costPerUnit !== "") fd.append("costPerUnit", form.costPerUnit);
      if (form.lowStockLevel !== "") fd.append("lowStockLevel", form.lowStockLevel);
      if (form.locationId) fd.append("locationId", form.locationId);
      if (form.categoryId) fd.append("categoryId", form.categoryId);
      if (form.notes.trim()) fd.append("notes", form.notes.trim());

      if (imageFile) {
        fd.append("image", imageFile);
      } else if (imageRemoved) {
        fd.append("image", "");
      }

      if (editing) {
        await api.patch(`/physical-inventory/item/${editing.id}`, fd);
        toast.success("Item updated");
      } else {
        await api.post("/physical-inventory/item", fd);
        toast.success("Item created");
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/physical-inventory/item/${deleteTarget.id}`);
      toast.success("Item deleted");
      setDeleteTarget(null);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete"); }
    finally { setDeleting(false); }
  };

  const handleMovement = async () => {
    const qty = Number(movForm.quantityChange);
    if (movForm.action === "ADJUST") {
      if (movForm.quantityChange === "" || isNaN(qty) || qty < 0) {
        return toast.error("Adjusted quantity cannot be negative");
      }
    } else {
      if (!movForm.quantityChange || isNaN(qty) || qty <= 0) {
        return toast.error("Quantity must be greater than 0");
      }
    }
    setSavingMov(true);
    try {
      await api.post(`/physical-inventory/item/${movItem.id}/movement`, movForm);
      toast.success("Movement recorded");
      setMovItem(null);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to record movement"); }
    finally { setSavingMov(false); }
  };

  const COMMON_UNITS = ["pcs", "kg", "g", "mg", "L", "mL", "m", "cm", "box", "pack", "bag", "carton", "roll", "sheet", "pair", "set"];

  return (
    <div>
      <div className="inv_toolbar">
        <div className="inv_search_wrap">
          <MdSearch size={16} className="inv_search_icon" />
          <input className="inv_search" placeholder="Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="inv_select" value={filterLocation} onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }}>
          <option value="">All Locations</option>
          {locations.map((l) => {
            const labels = { STORE: "Store", WAREHOUSE: "Warehouse", FACTORY: "Factory", OTHER: "Other" };
            return <option key={l.id} value={l.id}>{labels[l.type] || l.type} · {l.name}</option>;
          })}
        </select>
        <select className="inv_select" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="inv_select" value={filterCondition} onChange={(e) => { setFilterCondition(e.target.value); setPage(1); }}>
          <option value="">All Conditions</option>
          {ITEM_CONDITIONS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-body)", whiteSpace: "nowrap", cursor: "pointer" }}>
          <input type="checkbox" checked={filterLowStock} onChange={(e) => { setFilterLowStock(e.target.checked); setPage(1); }} />
          Low stock only
        </label>
        <button className="app_btn app_btn_confirm" style={{ height: 38, padding: "0 16px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }} onClick={openCreate}>
          <LuPlus size={14} /> New Item
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><div className="page_loader_spinner" /></div>
      ) : items.length === 0 ? (
        <div className="inv_empty">
          <div className="inv_empty_icon"><MdOutlineInventory2 size={44} /></div>
          <h3>No items found</h3>
          <p>{search || filterLocation || filterCategory || filterCondition || filterLowStock ? "Try adjusting your filters." : "Add your first inventory item."}</p>
          {!search && !filterLocation && !filterCategory && !filterCondition && !filterLowStock && (
            <button className="app_btn app_btn_confirm" style={{ height: 36, padding: "0 16px", fontSize: "0.8rem", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }} onClick={openCreate}>
              <LuPlus size={13} /> Add Item
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="inv_table_wrap">
            <table className="inv_table">
              <thead>
                <tr>
                  <th>Item</th>
                  {/* <th>SKU</th> */}
                  <th>Location</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLow = item.lowStockLevel > 0 && item.quantity <= item.lowStockLevel;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="inv_item_cell">
                          {item.image ? (
                            <img src={item.image} alt="" className="inv_item_thumb" />
                          ) : (
                            <div className="inv_item_thumb_placeholder">
                              {item.category ? (
                                <CatIconRenderer iconKey={item.category.icon} size={18} style={{ color: item.category.color }} />
                              ) : (
                                <MdOutlineInventory2 size={18} />
                              )}
                            </div>
                          )}
                          <div>
                            <div className="inv_table_name">{item.name}</div>
                            {item.description && <div className="inv_table_sub">{item.description.slice(0, 50)}{item.description.length > 50 ? "…" : ""}</div>}
                          </div>
                        </div>
                      </td>
                      {/* <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-muted)" }}>{item.sku}</td> */}
                      <td>
                        {item.location && <LocationTypeChip type={item.location.type} />}
                        {item.location && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{item.location.name}</div>}
                      </td>
                      <td>
                        {item.category && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.75rem", fontWeight: 600, color: "var(--text-body)" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.category.color, display: "inline-block", flexShrink: 0 }} />
                            <CatIconRenderer iconKey={item.category.icon} size={13} style={{ color: item.category.color }} />
                            {item.category.name}
                          </span>
                        )}
                      </td>
                      <td>
                        <ConditionBadge condition={item.condition} />
                      </td>
                      <td>
                        <span className={`inv_qty ${isLow ? "low" : "ok"}`}>
                          {item.quantity} {item.unit}
                        </span>
                        {isLow && (
                          <div style={{ marginTop: 2 }}>
                            <span className="inv_low_stock"><MdOutlineWarning size={10} /> Low stock</span>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {item.costPerUnit != null ? `${item.costPerUnit.toLocaleString()}` : "—"}
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmtShortDate(item.updatedAt)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button
                            className="app_btn app_btn_confirm"
                            style={{ height: 28, padding: "0 10px", fontSize: "0.7rem" }}
                            title="Record movement"
                            onClick={() => {
                              setMovItem(item);
                              setMovForm({ action: "IN", quantityChange: "", notes: "", reference: "", toLocationId: "" });
                            }}
                          >
                            ± Stock
                          </button>
                          <button className="biz_icon_btn" title="Edit" onClick={() => openEdit(item)}><MdEdit size={13} /></button>
                          <button className="biz_icon_btn biz_icon_btn_danger" title="Delete" onClick={() => setDeleteTarget(item)}><MdDelete size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}

      {/* Create/Edit Item Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Item" : "New Inventory Item"} description="Track stock for a physical item at a location.">
        <div className="modal-body">
          {/* Image Upload Area */}
          <div className="form-field">
            <label className="modal-label">Item Image</label>
            <div
              className="inv_upload_zone"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="inv_upload_preview" />
              ) : (
                <div className="inv_upload_icon_box">
                  <MdUpload size={20} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: imagePreview ? "var(--text-body)" : "var(--text-muted)" }}>
                  {imageFile ? imageFile.name : imagePreview ? "Image uploaded · click to change" : "Click to upload an item image"}
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>
                  JPG, PNG, WEBP up to 5MB
                </div>
              </div>
              {imagePreview && (
                <button
                  type="button"
                  className="biz_icon_btn biz_icon_btn_danger"
                  title="Remove image"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageFile(null);
                    setImagePreview(null);
                    setImageRemoved(true);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <MdClose size={14} />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setImageFile(f);
                  setImagePreview(URL.createObjectURL(f));
                  setImageRemoved(false);
                }
              }}
            />
          </div>

          <div className="inv_form_grid" style={{ marginBottom: 12 }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Name *</label>
              <input className="modal-input" placeholder="e.g. Cardboard Box A4" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">SKU (auto-generated if blank)</label>
              <input className="modal-input" placeholder="e.g. BOX-A4-001" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Location *</label>
              <select className="modal-input" value={form.locationId} onChange={(e) => setForm((p) => ({ ...p, locationId: e.target.value }))}>
                <option value="">Select location…</option>
                {locations.map((l) => {
                  const labels = { STORE: "Store", WAREHOUSE: "Warehouse", FACTORY: "Factory", OTHER: "Other" };
                  return <option key={l.id} value={l.id}>{labels[l.type] || l.type} · {l.name}</option>;
                })}
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Category</label>
              <select className="modal-input" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Condition *</label>
              <select className="modal-input" value={form.condition} onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}>
                {ITEM_CONDITIONS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label} — {c.desc}</option>
                ))}
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Quantity</label>
              <input className="modal-input" type="number" min="0" placeholder="0" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Unit</label>
              <select className="modal-input" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}>
                {COMMON_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Cost per Unit</label>
              <input className="modal-input" type="number" min="0" step="0.01" placeholder="e.g. 250.00" value={form.costPerUnit} onChange={(e) => setForm((p) => ({ ...p, costPerUnit: e.target.value }))} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Low Stock Threshold</label>
              <input className="modal-input" type="number" min="0" placeholder="e.g. 10" value={form.lowStockLevel} onChange={(e) => setForm((p) => ({ ...p, lowStockLevel: e.target.value }))} />
            </div>
          </div>
          <div className="form-field">
            <label className="modal-label">Description</label>
            <textarea className="modal-input" style={{ height: 60, padding: 8, resize: "vertical" }} placeholder="Optional description…" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="modal-label">Notes</label>
            <input className="modal-input" placeholder="Any additional notes…" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{ position: "relative", minWidth: 100 }}
              onClick={handleSave}
              disabled={saving}
            >
              <span className="btn_text">{editing ? "Save Changes" : "Create Item"}</span>
              {saving && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
            </button>
          </div>
        </div>
      </Modal>

      {/* Record Movement Modal */}
      <Modal isOpen={!!movItem} onClose={() => setMovItem(null)} title={`Record Movement — ${movItem?.name}`} description="Log stock in, out, adjustment, or transfer.">
        <div className="modal-body">
          <div className="inv_form_grid" style={{ marginBottom: 12 }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Action *</label>
              <select className="modal-input" value={movForm.action} onChange={(e) => setMovForm((p) => ({ ...p, action: e.target.value }))}>
                <option value="IN">Stock In (receive)</option>
                <option value="OUT">Stock Out (issue)</option>
                <option value="ADJUST">Adjust (set quantity)</option>
                <option value="TRANSFER">Transfer Out</option>
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">
                {movForm.action === "ADJUST" ? "New Quantity *" : "Quantity *"}
              </label>
              <input className="modal-input" type="number" min={movForm.action === "ADJUST" ? "0" : "0.01"} step="any" placeholder={movForm.action === "ADJUST" ? "0" : "Enter quantity"} value={movForm.quantityChange} onChange={(e) => setMovForm((p) => ({ ...p, quantityChange: e.target.value }))} />
            </div>
            {movForm.action === "TRANSFER" && (
              <div className="form-field" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
                <label className="modal-label">Transfer To Location *</label>
                <select className="modal-input" value={movForm.toLocationId} onChange={(e) => setMovForm((p) => ({ ...p, toLocationId: e.target.value }))}>
                  <option value="">Select destination…</option>
                  {locations.filter((l) => l.id !== movItem?.locationId).map((l) => {
                    const labels = { STORE: "Store", WAREHOUSE: "Warehouse", FACTORY: "Factory", OTHER: "Other" };
                    return <option key={l.id} value={l.id}>{labels[l.type] || l.type} · {l.name}</option>;
                  })}
                </select>
              </div>
            )}
          </div>
          <div className="form-field">
            <label className="modal-label">Reference (PO#, Invoice#, etc.)</label>
            <input className="modal-input" placeholder="Optional reference number" value={movForm.reference} onChange={(e) => setMovForm((p) => ({ ...p, reference: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="modal-label">Notes</label>
            <textarea className="modal-input" style={{ height: 60, padding: 8 }} placeholder="Reason for movement…" value={movForm.notes} onChange={(e) => setMovForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>

          {movItem && (
            <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", marginBottom: 4, fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Current stock: <strong style={{ color: "var(--text-heading)" }}>{movItem.quantity} {movItem.unit}</strong>
              {movForm.quantityChange && (
                <>
                  {" → "}
                  <strong style={{ color: "var(--accent)" }}>
                    {movForm.action === "IN" && `${movItem.quantity + Number(movForm.quantityChange)} ${movItem.unit}`}
                    {movForm.action === "OUT" && `${movItem.quantity - Number(movForm.quantityChange)} ${movItem.unit}`}
                    {movForm.action === "ADJUST" && `${Number(movForm.quantityChange)} ${movItem.unit}`}
                    {movForm.action === "TRANSFER" && `${movItem.quantity - Number(movForm.quantityChange)} ${movItem.unit} (here)`}
                  </strong>
                </>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" onClick={() => setMovItem(null)}>Cancel</button>
            <button
              className={`app_btn app_btn_confirm${savingMov ? " btn_loading" : ""}`}
              style={{ position: "relative", minWidth: 120 }}
              onClick={handleMovement}
              disabled={savingMov}
            >
              <span className="btn_text">Record Movement</span>
              {savingMov && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} name={deleteTarget?.name} />
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────

function HistoryTab({ locations }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/physical-inventory/history", {
        params: {
          page, limit: 25,
          action: filterAction || undefined,
          locationId: filterLocation || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      const d = r.data.data;
      setMovements(d.movements || []);
      setTotal(d.total || 0);
      setTotalPages(d.totalPages || 1);
    } catch { toast.error("Failed to load history"); }
    finally { setLoading(false); }
  }, [page, filterAction, filterLocation, startDate, endDate]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const hasFilters = filterAction || filterLocation || startDate || endDate;

  return (
    <div>
      <div className="inv_toolbar" style={{ flexWrap: "wrap" }}>
        <select className="inv_select" value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          {MOVEMENT_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="inv_select" value={filterLocation} onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }}>
          <option value="">All Locations</option>
          {locations.map((l) => {
            const labels = { STORE: "Store", WAREHOUSE: "Warehouse", FACTORY: "Factory", OTHER: "Other" };
            return <option key={l.id} value={l.id}>{labels[l.type] || l.type} · {l.name}</option>;
          })}
        </select>
        <input type="date" className="inv_select" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} style={{ minWidth: 140 }} />
        <input type="date" className="inv_select" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} style={{ minWidth: 140 }} />
        {hasFilters && (
          <button
            className="app_btn app_btn_cancel"
            style={{ height: 38, display: "flex", alignItems: "center", gap: 5 }}
            onClick={() => { setFilterAction(""); setFilterLocation(""); setStartDate(""); setEndDate(""); setPage(1); }}
          >
            <MdClose size={14} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><div className="page_loader_spinner" /></div>
      ) : movements.length === 0 ? (
        <div className="inv_empty">
          <div className="inv_empty_icon"><MdOutlineHistory size={44} /></div>
          <h3>No movements yet</h3>
          <p>Movement history will appear here once you start recording stock changes.</p>
        </div>
      ) : (
        <>
          <div className="inv_table_wrap">
            <table className="inv_table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Item</th>
                  <th>Location</th>
                  <th>Change</th>
                  <th>Before → After</th>
                  <th>Reference</th>
                  <th>By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mv) => {
                  const qtyDelta = mv.quantityAfter - mv.quantityBefore;
                  const isAdj = mv.action === "ADJUST";
                  return (
                    <tr key={mv.id}>
                      <td><ActionBadge action={mv.action} /></td>
                      <td>
                        <div className="inv_history_item_cell">
                          {mv.item?.image ? (
                            <img src={mv.item.image} alt="" className="inv_history_thumb" />
                          ) : (
                            <div className="inv_history_thumb_placeholder">
                              <MdOutlineInventory2 size={14} />
                            </div>
                          )}
                          <div>
                            <div className="inv_table_name">{mv.item?.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                              <span className="inv_table_sub" style={{ fontFamily: "monospace" }}>{mv.item?.sku}</span>
                              {mv.item?.condition && <ConditionBadge condition={mv.item.condition} />}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {mv.item?.location && <LocationTypeChip type={mv.item.location.type} />}
                        {mv.item?.location && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{mv.item.location.name}</div>}
                      </td>
                      <td>
                        <span className={`inv_qty_change ${isAdj ? "adj" : qtyDelta >= 0 ? "pos" : "neg"}`}>
                          {isAdj ? `± ${mv.quantityChange}` : qtyDelta > 0 ? `+${mv.quantityChange}` : `-${mv.quantityChange}`}
                          {" "}{mv.item?.unit}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {mv.quantityBefore} → <strong style={{ color: "var(--text-heading)" }}>{mv.quantityAfter}</strong>
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                        {mv.reference || "—"}
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {mv.user?.fullName || "System"}
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {fmtDate(mv.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "history", label: "History", Icon: MdOutlineHistory },
  { key: "locations", label: "Locations", Icon: MdOutlineLocationOn },
  { key: "categories", label: "Categories", Icon: MdOutlineCategory },
  { key: "items", label: "Items", Icon: MdOutlineInventory2 },
];

export default function AdminInventory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("history");

  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchGlobal = useCallback(async () => {
    try {
      const [statsRes, locsRes, catsRes] = await Promise.all([
        api.get("/physical-inventory/stats"),
        api.get("/physical-inventory/location", { params: { limit: 200 } }),
        api.get("/physical-inventory/category", { params: { limit: 200 } }),
      ]);
      setStats(statsRes.data.data);
      setLocations(locsRes.data.data?.locations || []);
      setCategories(catsRes.data.data?.categories || []);
    } catch {
      // stats failing silently is fine — tabs still work
    }
  }, []);

  useEffect(() => { fetchGlobal(); }, [fetchGlobal]);

  const STAT_ITEMS = [
    { label: "Active Locations", value: stats?.totalLocations, Icon: MdOutlineLocationOn, color: "#3b82f6" },
    { label: "Categories", value: stats?.totalCategories, Icon: MdOutlineLabel, color: "#8b5cf6" },
    { label: "Total Items", value: stats?.totalItems, Icon: MdOutlineInventory2, color: "#10b981" },
    { label: "Low Stock Alerts", value: stats?.lowStockItems, Icon: MdOutlineWarning, color: "#ef4444" },
    { label: "Movements (7d)", value: stats?.recentMovements, Icon: MdOutlineHistory, color: "#f59e0b" },
  ];

  return (
    <div className="inv_page">
      {/* Header */}
      <div className="inv_header">
        <div className="inv_header_left">
          <h1>Inventory Management</h1>
          <p>Track stock across your stores, warehouses, and factories</p>
        </div>
        <div className="inv_header_actions">
          <button className="admin_back_link" onClick={() => navigate("/app/admin")} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <MdArrowBack size={16} /> Back to Admin
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="inv_stats_strip">
        {STAT_ITEMS.map(({ label, value, Icon, color }) => (
          <div key={label} className="inv_stat_card">
            <div className="inv_stat_icon" style={{ color }}>
              <Icon size={20} />
            </div>
            <div
              className="inv_stat_value"
              style={value > 0 && label === "Low Stock Alerts" ? { color: "#ef4444" } : undefined}
            >
              {value ?? "—"}
            </div>
            <div className="inv_stat_label">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="inv_tabs" role="tablist">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`inv_tab${activeTab === key ? " active" : ""}`}
            onClick={() => setActiveTab(key)}
            role="tab"
            aria-selected={activeTab === key}
          >
            <Icon size={15} />
            {label}
            {key === "locations" && stats?.totalLocations > 0 && <span className="inv_tab_count">{stats.totalLocations}</span>}
            {key === "categories" && stats?.totalCategories > 0 && <span className="inv_tab_count">{stats.totalCategories}</span>}
            {key === "items" && stats?.totalItems > 0 && <span className="inv_tab_count">{stats.totalItems}</span>}
            {key === "items" && stats?.lowStockItems > 0 && (
              <span className="inv_tab_count" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", borderColor: "rgba(239,68,68,0.25)", display: "inline-flex", alignItems: "center", gap: 3 }}>
                <MdOutlineWarning size={10} /> {stats.lowStockItems}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "locations" && <LocationsTab />}
      {activeTab === "categories" && <CategoriesTab />}
      {activeTab === "items" && <ItemsTab locations={locations} categories={categories} />}
      {activeTab === "history" && <HistoryTab locations={locations} />}
    </div>
  );
}
