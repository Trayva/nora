import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  LuTrash2,
  LuPlus,
  LuChevronDown,
  LuChevronRight,
  LuPencil,
  LuX,
} from "react-icons/lu";
import {
  MdOutlineFastfood,
  MdUpload,
  MdBuild,
  MdPublic,
  MdImage,
} from "react-icons/md";
import Drawer from "../../../components/Drawer";
import RecipeStepForm from "../../../components/RecipeStepForm";
import RecipeStepsList from "../../../components/RecipeStepsList";
import IngredientSearchInput from "../../../components/IngredientSearchInput";
import {
  getMenuItem,
  addMenuRecipe,
  updateMenuRecipe,
  deleteMenuRecipe,
  addMenuVariant,
  removeMenuVariant,
  addMenuExtra,
  removeMenuExtra,
  uploadMenuTutorial,
  updateMenuItem,
} from "../../../api/vendor";
import { useAppState } from "../../../contexts/StateContext";
import Modal from "../../../components/Modal";
import api from "../../../api/axios";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria",
  "Bangladesh","Belgium","Bolivia","Brazil","Cameroon","Canada","Chile","China",
  "Colombia","Congo","Côte d'Ivoire","Croatia","Czech Republic","Denmark",
  "Ecuador","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece",
  "Guatemala","Honduras","Hungary","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait",
  "Lebanon","Libya","Malaysia","Mexico","Morocco","Mozambique","Myanmar","Nepal",
  "Netherlands","New Zealand","Nicaragua","Niger","Nigeria","Norway","Pakistan",
  "Panama","Peru","Philippines","Poland","Portugal","Romania","Russia",
  "Saudi Arabia","Senegal","Sierra Leone","Somalia","South Africa","South Korea",
  "Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Tanzania","Thailand",
  "Tunisia","Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom",
  "United States","Uruguay","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const UNIT_OPTIONS = ["g","kg","ml","L","unit","pcs","oz","lb","cup","tbsp","tsp"];

/* ── Collapsible section wrapper ── */
function Section({ title, count, defaultOpen = true, children, action }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="drawer_section">
      <button type="button" className="drawer_collapsible_header" onClick={() => setOpen((v) => !v)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {open ? <LuChevronDown size={14} style={{ color: "var(--text-muted)" }} /> : <LuChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
          <span className="wallet_section_title">{title}</span>
          {count !== undefined && <span className="drawer_section_count">{count}</span>}
        </div>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
      </button>
      {open && <div className="drawer_section_body">{children}</div>}
    </div>
  );
}

/* ── Edit Menu Item Form ── */
function EditMenuItemForm({ item, onSaved, onCancel }) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [ticketTime, setTicketTime] = useState(item?.ticketTime || "");
  const [origin, setOrigin] = useState(item?.origin || "");
  const [serveTo, setServeTo] = useState(item?.serveTo || "");
  const [packaging, setPackaging] = useState(item?.packaging || "");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.image || null);
  const [packImgFile, setPackImgFile] = useState(null);
  const [packImgPreview, setPackImgPreview] = useState(item?.packagingImage || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const packRef = useRef(null);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Name is required");
    const fd = new FormData();
    fd.append("name", name.trim());
    if (description) fd.append("description", description);
    if (ticketTime) fd.append("ticketTime", Number(ticketTime));
    if (origin) fd.append("origin", origin.trim());
    if (serveTo) fd.append("serveTo", serveTo.trim());
    if (packaging) fd.append("packaging", packaging.trim());
    if (imageFile) fd.append("image", imageFile);
    if (packImgFile) fd.append("packagingImage", packImgFile);
    setSaving(true);
    try {
      await updateMenuItem(item.id, fd);
      toast.success("Menu item updated");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="recipe_add_form">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-heading)" }}>Edit Menu Item</span>
        <button className="biz_icon_btn" onClick={onCancel}><LuX size={14} /></button>
      </div>
      <div className="form-field">
        <label className="modal-label">Image</label>
        <div onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-hover)", border: "1px dashed var(--border)", borderRadius: 10, cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
          {imagePreview ? <img src={imagePreview} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdUpload size={16} style={{ color: "var(--accent)" }} /></div>}
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{imageFile ? imageFile.name : "Click to upload image"}</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); }} />
      </div>
      <div className="form-field"><label className="modal-label">Name *</label><input className="modal-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="form-field"><label className="modal-label">Description</label><textarea className="modal-input" rows={3} style={{ resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="form-field"><label className="modal-label">Ticket Time (minutes)</label><input className="modal-input" type="number" placeholder="e.g. 15" value={ticketTime} onChange={(e) => setTicketTime(e.target.value)} /></div>
      <div className="register_row">
        <div className="form-field"><label className="modal-label">Origin</label><input className="modal-input" placeholder="e.g. Nigeria" value={origin} onChange={(e) => setOrigin(e.target.value)} /></div>
        <div className="form-field"><label className="modal-label">Serves</label><input className="modal-input" placeholder="e.g. All ages" value={serveTo} onChange={(e) => setServeTo(e.target.value)} /></div>
      </div>
      <div className="form-field"><label className="modal-label">Packaging Details</label><textarea className="modal-input" rows={2} style={{ resize: "none" }} placeholder="e.g. Sealed paper bag" value={packaging} onChange={(e) => setPackaging(e.target.value)} /></div>
      <div className="form-field">
        <label className="modal-label">Packaging Image</label>
        <div onClick={() => packRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg-hover)", border: "1px dashed var(--border)", borderRadius: 10, cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
          {packImgPreview ? <img src={packImgPreview} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdUpload size={16} style={{ color: "var(--accent)" }} /></div>}
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{packImgFile ? packImgFile.name : "Click to upload packaging image"}</span>
        </div>
        <input ref={packRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) { setPackImgFile(f); setPackImgPreview(URL.createObjectURL(f)); } }} />
      </div>
      <div className="recipe_add_actions">
        <button className="app_btn app_btn_cancel" onClick={onCancel}>Cancel</button>
        <button className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`} onClick={handleSubmit} disabled={saving} style={{ position: "relative", minWidth: 100 }}>
          <span className="btn_text">Save Changes</span>
          {saving && <span className="btn_loader" style={{ width: 13, height: 13 }} />}
        </button>
      </div>
    </div>
  );
}

/* ── Inline Machinery Search + Create ── */
function MachSearchInput({ onSelect, selectedMach }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", manufacturer: "", modelNumber: "", powerConsumption: "" });
  const [createImage, setCreateImage] = useState(null);
  const [createImagePreview, setCreateImagePreview] = useState(null);
  const createImgRef = useRef(null);
  const debRef = useRef(null);

  const search = (q) => {
    if (!q.trim()) { setResults([]); return; }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.get(`/library/machinery?search=${encodeURIComponent(q)}&limit=8`);
        const d = r.data.data;
        setResults(Array.isArray(d) ? d : d?.data || d?.items || []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) return toast.error("Name is required");
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("name", createForm.name.trim());
      if (createForm.description.trim()) fd.append("description", createForm.description.trim());
      if (createForm.manufacturer.trim()) fd.append("manufacturer", createForm.manufacturer.trim());
      if (createForm.modelNumber.trim()) fd.append("modelNumber", createForm.modelNumber.trim());
      if (createForm.powerConsumption.trim()) fd.append("powerConsumption", createForm.powerConsumption.trim());
      if (createImage) fd.append("image", createImage);
      const res = await api.post("/library/machinery", fd, { headers: { "Content-Type": undefined } });
      const created = res.data.data;
      onSelect(created);
      setQuery(created.name);
      setOpen(false);
      setShowCreate(false);
      setCreateForm({ name: "", description: "", manufacturer: "", modelNumber: "", powerConsumption: "" });
      setCreateImage(null);
      setCreateImagePreview(null);
      toast.success(`${created.name} created`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create machinery");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 10px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 9 }}>
        <MdBuild size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <input
          style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "0.82rem", color: "var(--text-body)", fontFamily: "inherit" }}
          placeholder="Search machinery…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onSelect(null); setOpen(true); setShowCreate(false); search(e.target.value); }}
          onFocus={() => setOpen(true)}
        />
        {query && <button onClick={() => { setQuery(""); setResults([]); onSelect(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}><LuX size={12} /></button>}
      </div>

      {open && query && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, zIndex: 60, maxHeight: 320, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
          {searching ? (
            <div style={{ padding: "10px 12px", fontSize: "0.78rem", color: "var(--text-muted)" }}>Searching…</div>
          ) : results.length > 0 ? (
            results.map((m) => (
              <div key={m.id} onClick={() => { onSelect(m); setQuery(m.name); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--border)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                {m.image ? <img src={m.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdBuild size={12} style={{ color: "var(--text-muted)" }} /></div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)" }}>{m.name}</div>
                  {m.manufacturer && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{m.manufacturer}</div>}
                </div>
              </div>
            ))
          ) : null}

          {/* Create section */}
          <div style={{ padding: "8px 12px", borderTop: results.length > 0 ? "1px solid var(--border)" : "none" }}>
            {!showCreate ? (
              <button onClick={() => setShowCreate(true)} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                <LuPlus size={13} /> Create "{query || "new machinery"}"
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}>New Machinery</span>
                  <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}><LuX size={13} /></button>
                </div>

                {/* Image upload */}
                <div onClick={() => createImgRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg-hover)", border: "1px dashed var(--border)", borderRadius: 8, cursor: "pointer" }}>
                  {createImagePreview ? <img src={createImagePreview} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 30, height: 30, borderRadius: 6, background: "var(--bg-active)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdUpload size={13} style={{ color: "var(--accent)" }} /></div>}
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{createImage ? createImage.name : "Upload image (optional)"}</span>
                </div>
                <input ref={createImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) { setCreateImage(f); setCreateImagePreview(URL.createObjectURL(f)); } }} />

                <input className="modal-input" placeholder="Name *" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} style={{ marginBottom: 0 }} />
                <input className="modal-input" placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} style={{ marginBottom: 0 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <input className="modal-input" placeholder="Manufacturer" value={createForm.manufacturer} onChange={(e) => setCreateForm((p) => ({ ...p, manufacturer: e.target.value }))} style={{ marginBottom: 0 }} />
                  <input className="modal-input" placeholder="Model Number" value={createForm.modelNumber} onChange={(e) => setCreateForm((p) => ({ ...p, modelNumber: e.target.value }))} style={{ marginBottom: 0 }} />
                </div>
                <input className="modal-input" placeholder="Power Consumption (e.g. 1500W)" value={createForm.powerConsumption} onChange={(e) => setCreateForm((p) => ({ ...p, powerConsumption: e.target.value }))} style={{ marginBottom: 0 }} />
                <button className={`app_btn app_btn_confirm${creating ? " btn_loading" : ""}`} onClick={handleCreate} disabled={creating || !createForm.name} style={{ height: 32, position: "relative", fontSize: "0.78rem" }}>
                  <span className="btn_text">Create & Select</span>
                  {creating && <span className="btn_loader" style={{ width: 11, height: 11 }} />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedMach && (
        <div className="ing_selected_chip" style={{ marginTop: 8 }}>
          {selectedMach.image && <img src={selectedMach.image} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />}
          <span className="ing_type_badge" style={{ background: "rgba(100,116,139,0.15)", color: "var(--text-muted)" }}>machine</span>
          <span>{selectedMach.name}</span>
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function MenuItemDrawer({ item, onClose, onUpdated }) {
  const { selectedState } = useAppState();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(false);

  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [deletingStep, setDeletingStep] = useState(null);

  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantForm, setVariantForm] = useState({ name: "", instruction: "", quantity: "" });
  const [selectedVariantPrep, setSelectedVariantPrep] = useState(null);
  const [savingVariant, setSavingVariant] = useState(false);
  const [deletingVariant, setDeletingVariant] = useState(null);
  const [confirmVariant, setConfirmVariant] = useState(null);

  const [showExtraForm, setShowExtraForm] = useState(false);
  const [selectedExtra, setSelectedExtra] = useState(null);
  const [savingExtra, setSavingExtra] = useState(false);
  const [deletingExtra, setDeletingExtra] = useState(null);
  const [confirmExtra, setConfirmExtra] = useState(null);

  const [tutorialFile, setTutorialFile] = useState(null);
  const [uploadingTutorial, setUploadingTutorial] = useState(false);

  const [machineries, setMachineries] = useState([]);
  const [machLoading, setMachLoading] = useState(false);
  const [showMachForm, setShowMachForm] = useState(false);
  const [selectedMach, setSelectedMach] = useState(null);
  const [machQty, setMachQty] = useState("1");
  const [savingMach, setSavingMach] = useState(false);
  const [confirmDeleteMach, setConfirmDeleteMach] = useState(null);
  const [deletingMach, setDeletingMach] = useState(null);

  const [markups, setMarkups] = useState([]);
  const [markupsLoading, setMarkupsLoading] = useState(false);
  const [showMarkupForm, setShowMarkupForm] = useState(false);
  const [markupCountry, setMarkupCountry] = useState("");
  const [markupValue, setMarkupValue] = useState("");
  const [savingMarkup, setSavingMarkup] = useState(false);
  const [deletingMarkup, setDeletingMarkup] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateType, setTemplateType] = useState("CHECKLIST");
  const [templateRecurrence, setTemplateRecurrence] = useState("DAILY");
  const [templateTime, setTemplateTime] = useState("");
  const [templateFields, setTemplateFields] = useState([{ type: "checkbox", label: "" }]);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(null);

  const fetchDetail = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const res = await getMenuItem(item.id);
      setDetail(res.data.data);
    } catch { toast.error("Failed to load item"); }
    finally { setLoading(false); }
  };

  const fetchMachineries = async () => {
    if (!item) return;
    setMachLoading(true);
    try {
      const r = await api.get(`/vendor/menu/${item.id}/machineries`);
      const d = r.data.data;
      setMachineries(Array.isArray(d) ? d : d?.data || d?.machineries || []);
    } catch { /* silent */ }
    finally { setMachLoading(false); }
  };

  const fetchMarkups = async () => {
    if (!item) return;
    setMarkupsLoading(true);
    try {
      const r = await api.get(`/vendor/menu/${item.id}/markups`);
      const d = r.data.data;
      setMarkups(Array.isArray(d) ? d : d?.data || d?.markups || []);
    } catch { /* silent */ }
    finally { setMarkupsLoading(false); }
  };

  const fetchTemplates = async () => {
    if (!item) return;
    setTemplatesLoading(true);
    try {
      const r = await api.get(`/icart/tasks/templates?menuId=${item.id}`);
      setTemplates(r.data.data?.items || r.data.data || []);
    } catch { /* silent */ }
    finally { setTemplatesLoading(false); }
  };

  useEffect(() => {
    if (item) { fetchDetail(); fetchMachineries(); fetchMarkups(); fetchTemplates(); }
    else { setDetail(null); setMachineries([]); setMarkups([]); }
  }, [item?.id]);

  const handleAddMachinery = async (e) => {
    e.preventDefault();
    if (!selectedMach) return;
    setSavingMach(true);
    try {
      await api.post(`/vendor/menu/${item.id}/machineries`, { machineryId: selectedMach.id, quantity: Number(machQty) || 1 });
      toast.success("Machinery added");
      setSelectedMach(null); setMachQty("1"); setShowMachForm(false);
      fetchMachineries();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add machinery"); }
    finally { setSavingMach(false); }
  };

  const handleRemoveMachinery = async (machineryId) => {
    setDeletingMach(machineryId);
    try {
      await api.delete(`/vendor/menu/${item.id}/machineries`, { data: { machineryId } });
      toast.success("Machinery removed");
      setConfirmDeleteMach(null);
      setMachineries((p) => p.filter((m) => (m.machineryId || m.id) !== machineryId));
    } catch (err) { toast.error(err.response?.data?.message || "Failed to remove"); }
    finally { setDeletingMach(null); }
  };

  const handleAddMarkup = async (e) => {
    e.preventDefault();
    if (!markupCountry.trim()) return toast.error("Select a country");
    if (!markupValue || isNaN(Number(markupValue))) return toast.error("Enter a valid markup %");
    setSavingMarkup(true);
    try {
      await api.post("/vendor/menu/markups", { menuItemId: item.id, country: markupCountry.trim(), markup: Number(markupValue) });
      toast.success("Markup saved");
      setMarkupCountry(""); setMarkupValue(""); setShowMarkupForm(false);
      fetchMarkups();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save markup"); }
    finally { setSavingMarkup(false); }
  };

  const handleDeleteMarkup = async (markupId) => {
    setDeletingMarkup(markupId);
    try {
      await api.delete(`/vendor/menu/markups/${markupId}`);
      toast.success("Markup removed");
      setMarkups((p) => p.filter((m) => m.id !== markupId));
    } catch (err) { toast.error(err.response?.data?.message || "Failed to remove markup"); }
    finally { setDeletingMarkup(null); }
  };

  const resetTemplateForm = () => {
    setTemplateName(""); setTemplateDesc(""); setTemplateType("CHECKLIST");
    setTemplateRecurrence("DAILY"); setTemplateTime("");
    setTemplateFields([{ type: "checkbox", label: "" }]);
    setEditingTemplate(null); setShowTemplateForm(false);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return toast.error("Template name is required");
    const validFields = templateFields.filter((f) => f.label.trim());
    if (!validFields.length) return toast.error("Add at least one field");
    setSavingTemplate(true);
    const payload = { name: templateName.trim(), description: templateDesc.trim() || undefined, type: templateType, recurrence: templateRecurrence, schema: { fields: validFields }, menuItemId: item.id, time: templateTime || undefined };
    try {
      if (editingTemplate) { await api.patch(`/icart/tasks/templates/${editingTemplate.id}`, payload); toast.success("Template updated"); }
      else { await api.post("/icart/tasks/templates", payload); toast.success("Template created"); }
      resetTemplateForm(); fetchTemplates();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save template"); }
    finally { setSavingTemplate(false); }
  };

  const handleDeleteTemplate = async (tplId) => {
    setDeletingTemplate(tplId);
    try {
      await api.delete(`/icart/tasks/templates/${tplId}`);
      toast.success("Template deleted");
      setTemplates((p) => p.filter((t) => t.id !== tplId));
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setDeletingTemplate(null); }
  };

  const updateTplField = (i, key, val) => setTemplateFields((p) => { const u = [...p]; u[i] = { ...u[i], [key]: val }; return u; });

  const handleAddStep = async (stepData) => {
    try {
      await addMenuRecipe(item.id, stepData);
      toast.success("Step added");
      setShowRecipeForm(false); fetchDetail();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add step"); }
  };

  const handleUpdateStep = async (stepId, body) => { await updateMenuRecipe(stepId, body); fetchDetail(); };

  const handleDeleteStep = async (stepId) => {
    setDeletingStep(stepId);
    try { await deleteMenuRecipe(stepId); toast.success("Step removed"); fetchDetail(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to remove step"); }
    finally { setDeletingStep(null); }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.name.trim() || !selectedVariantPrep) return;
    setSavingVariant(true);
    try {
      await addMenuVariant(item.id, { name: variantForm.name.trim(), prepItemId: selectedVariantPrep.id, ...(variantForm.quantity && { quantity: Number(variantForm.quantity) }), ...(variantForm.instruction && { instruction: variantForm.instruction }) });
      toast.success("Variant added");
      setVariantForm({ name: "", instruction: "", quantity: "" }); setSelectedVariantPrep(null); setShowVariantForm(false); fetchDetail();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add variant"); }
    finally { setSavingVariant(false); }
  };

  const handleDeleteVariant = async (variantId) => {
    setDeletingVariant(variantId);
    try { await removeMenuVariant(variantId); toast.success("Variant removed"); setConfirmVariant(null); fetchDetail(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to remove variant"); }
    finally { setDeletingVariant(null); }
  };

  const handleAddExtra = async (e) => {
    e.preventDefault();
    if (!selectedExtra) return;
    setSavingExtra(true);
    try {
      await addMenuExtra(item.id, { prepItemId: selectedExtra.id });
      toast.success("Extra added"); setSelectedExtra(null); setShowExtraForm(false); fetchDetail();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add extra"); }
    finally { setSavingExtra(false); }
  };

  const handleDeleteExtra = async (extraId) => {
    setDeletingExtra(extraId);
    try { await removeMenuExtra(extraId); toast.success("Extra removed"); setConfirmExtra(null); fetchDetail(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to remove extra"); }
    finally { setDeletingExtra(null); }
  };

  const handleUploadTutorial = async (e) => {
    e.preventDefault();
    if (!tutorialFile) return;
    setUploadingTutorial(true);
    try { await uploadMenuTutorial(item.id, tutorialFile); toast.success("Tutorial uploaded"); setTutorialFile(null); fetchDetail(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed to upload tutorial"); }
    finally { setUploadingTutorial(false); }
  };

  const steps = detail?.menuRecipes || [];
  const variants = detail?.variants || [];
  const extras = detail?.extras || [];

  return (
    <Drawer isOpen={!!item} onClose={onClose} title={item?.name || ""} description={item?.description || "Menu item details"} width={520}>
      {loading ? (
        <div className="page_loader"><div className="page_loader_spinner" /></div>
      ) : detail ? (
        <>
          {/* Hero */}
          <div className="drawer_item_hero">
            <div>
              {detail.image ? <img src={detail.image} alt={detail.name} className="drawer_hero_img" /> : <div className="drawer_hero_img drawer_hero_placeholder"><MdOutlineFastfood size={28} /></div>}
            </div>
            <div style={{ flex: 1 }}>
              <div className="drawer_meta_item">
                <span className="wallet_info_label">Ticket Time</span>
                <span className="wallet_info_value">{detail.ticketTime ? `${detail.ticketTime} min` : "—"}</span>
              </div>
              {detail.description && (
                <div className="drawer_meta_item" style={{ marginTop: 4 }}>
                  <span className="wallet_info_label">Description</span>
                  <span className="wallet_info_value" style={{ fontSize: "0.78rem" }}>{detail.description}</span>
                </div>
              )}
            </div>
            <button className="biz_icon_btn" title="Edit menu item" onClick={() => setEditingMenuItem((v) => !v)} style={{ alignSelf: "flex-start", color: editingMenuItem ? "var(--accent)" : "var(--text-muted)" }}>
              <LuPencil size={14} />
            </button>
          </div>

          {editingMenuItem && (
            <EditMenuItemForm item={detail} onSaved={() => { setEditingMenuItem(false); fetchDetail(); onUpdated?.(); }} onCancel={() => setEditingMenuItem(false)} />
          )}

          {/* Recipe Steps */}
          <Section title="Recipe Steps" count={steps.length} action={<button className="app_btn app_btn_confirm biz_add_btn" onClick={() => setShowRecipeForm((v) => !v)}><LuPlus size={13} /> Add Step</button>}>
            {showRecipeForm && <RecipeStepForm onAdd={handleAddStep} onCancel={() => setShowRecipeForm(false)} />}
            <RecipeStepsList steps={steps} onDelete={handleDeleteStep} deletingId={deletingStep} onUpdate={handleUpdateStep} />
          </Section>

          {/* Machineries */}
          <Section title="Machineries & Tools" count={machineries.length} defaultOpen={false} action={<button className="app_btn app_btn_confirm biz_add_btn" onClick={() => setShowMachForm((v) => !v)}><LuPlus size={13} /> Add</button>}>
            {showMachForm && (
              <form onSubmit={handleAddMachinery} className="recipe_add_form">
                <div className="form-field">
                  <label className="modal-label">Machinery *</label>
                  <MachSearchInput onSelect={(m) => setSelectedMach(m)} selectedMach={selectedMach} />
                </div>
                <div className="form-field">
                  <label className="modal-label">Quantity</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 9, overflow: "hidden", height: 40, width: 140 }}>
                    <button type="button" onClick={() => setMachQty((v) => String(Math.max(1, Number(v) - 1)))} style={{ width: 34, height: 40, background: "var(--bg-hover)", border: "none", borderRight: "1px solid var(--border)", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <input className="modal-input" type="number" min="1" value={machQty} onChange={(e) => setMachQty(e.target.value)} style={{ flex: 1, height: 40, textAlign: "center", marginBottom: 0, fontSize: "0.88rem", fontWeight: 700, border: "none", borderRadius: 0 }} />
                    <button type="button" onClick={() => setMachQty((v) => String(Number(v) + 1))} style={{ width: 34, height: 40, background: "var(--bg-hover)", border: "none", borderLeft: "1px solid var(--border)", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                </div>
                <div className="recipe_add_actions">
                  <button className="app_btn app_btn_cancel" type="button" onClick={() => { setShowMachForm(false); setSelectedMach(null); }}>Cancel</button>
                  <button className={`app_btn app_btn_confirm ${savingMach ? "btn_loading" : ""}`} type="submit" disabled={savingMach || !selectedMach} style={{ position: "relative", minWidth: 90 }}>
                    <span className="btn_text">Add</span>
                    {savingMach && <span className="btn_loader" style={{ width: 13, height: 13 }} />}
                  </button>
                </div>
              </form>
            )}
            {machLoading ? <div className="drawer_loading"><div className="page_loader_spinner" /></div>
              : machineries.length === 0 ? <div className="biz_empty" style={{ padding: "20px 0" }}><MdBuild size={22} style={{ opacity: 0.3 }} /><p>No machineries added yet.</p></div>
              : (
                <div className="drawer_items_list">
                  {machineries.map((m) => {
                    const mach = m.machinery || m;
                    const mId = m.machineryId || m.id;
                    return (
                      <div key={mId} className="recipe_step_row">
                        {mach.image ? <img src={mach.image} alt={mach.name} className="ing_option_img" style={{ borderRadius: 8 }} /> : <div className="ing_option_img ing_option_img_placeholder"><MdBuild size={12} /></div>}
                        <div className="recipe_step_info">
                          <span className="recipe_step_id">{mach.name}</span>
                          {mach.manufacturer && <span className="recipe_step_instruction">{mach.manufacturer}</span>}
                        </div>
                        {m.quantity > 1 && <span className="recipe_step_qty">× {m.quantity}</span>}
                        <button className="biz_icon_btn biz_icon_btn_danger" onClick={() => setConfirmDeleteMach({ id: mId, name: mach.name })} disabled={deletingMach === mId} style={{ position: "relative" }}>
                          {deletingMach === mId ? <span className="btn_loader" style={{ width: 12, height: 12, borderColor: "#ef4444", borderTopColor: "transparent" }} /> : <LuTrash2 size={13} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
          </Section>

          {/* Variants */}
          <Section title="Variants" count={variants.length} defaultOpen={false} action={<button className="app_btn app_btn_confirm biz_add_btn" onClick={() => setShowVariantForm((v) => !v)}><LuPlus size={13} /> Add</button>}>
            {showVariantForm && (
              <form onSubmit={handleAddVariant} className="recipe_add_form">
                <div className="form-field"><label className="modal-label">Variant Name *</label><input className="modal-input" placeholder="e.g. Small, Large" value={variantForm.name} onChange={(e) => setVariantForm((p) => ({ ...p, name: e.target.value }))} required /></div>
                <div className="form-field">
                  <label className="modal-label">Prep Item *</label>
                  <IngredientSearchInput placeholder="Search prep items..." onSelect={(item) => { if (item.type === "prep") setSelectedVariantPrep(item); else toast.error("Please select a prep item"); }} />
                  {selectedVariantPrep && <div className="ing_selected_chip" style={{ marginTop: 8 }}><span className="ing_type_badge ing_type_prep">prep</span><span>{selectedVariantPrep.name}</span></div>}
                </div>
                <div className="register_row">
                  <div className="form-field"><label className="modal-label">Quantity</label><input className="modal-input" type="number" placeholder="e.g. 2" value={variantForm.quantity} onChange={(e) => setVariantForm((p) => ({ ...p, quantity: e.target.value }))} /></div>
                  <div className="form-field"><label className="modal-label">Instruction</label><input className="modal-input" placeholder="e.g. Serve with rice" value={variantForm.instruction} onChange={(e) => setVariantForm((p) => ({ ...p, instruction: e.target.value }))} /></div>
                </div>
                <div className="recipe_add_actions">
                  <button className="app_btn app_btn_cancel" type="button" onClick={() => { setShowVariantForm(false); setSelectedVariantPrep(null); }}>Cancel</button>
                  <button className={`app_btn app_btn_confirm ${savingVariant ? "btn_loading" : ""}`} type="submit" disabled={savingVariant || !selectedVariantPrep} style={{ position: "relative", minWidth: 90 }}>
                    <span className="btn_text">Add</span>
                    {savingVariant && <span className="btn_loader" style={{ width: 13, height: 13 }} />}
                  </button>
                </div>
              </form>
            )}
            {variants.length === 0 ? <div className="biz_empty" style={{ padding: "20px 0" }}><p>No variants yet.</p></div>
              : <div className="drawer_tag_list">{variants.map((v) => (<div key={v.id} className="drawer_tag_chip"><span>{v.name}</span><button type="button" className="drawer_tag_remove" onClick={() => setConfirmVariant(v)} disabled={deletingVariant === v.id}>{deletingVariant === v.id ? <span className="btn_loader" style={{ width: 11, height: 11, borderColor: "#ef4444", borderTopColor: "transparent" }} /> : <LuTrash2 size={11} />}</button></div>))}</div>}
          </Section>

          {/* Extras */}
          <Section title="Extras" count={extras.length} defaultOpen={false} action={<button className="app_btn app_btn_confirm biz_add_btn" onClick={() => setShowExtraForm((v) => !v)}><LuPlus size={13} /> Add</button>}>
            {showExtraForm && (
              <form onSubmit={handleAddExtra} className="recipe_add_form">
                <div className="form-field">
                  <label className="modal-label">Select Prep Item / Extra *</label>
                  <IngredientSearchInput placeholder="Search prep items..." onSelect={(item) => { if (item.type === "prep") setSelectedExtra(item); else toast.error("Please select a prep item, not a raw ingredient"); }} />
                  {selectedExtra && <div className="ing_selected_chip" style={{ marginTop: 8 }}><span className="ing_type_badge ing_type_prep">prep</span><span>{selectedExtra.name}</span></div>}
                </div>
                <div className="recipe_add_actions">
                  <button className="app_btn app_btn_cancel" type="button" onClick={() => { setShowExtraForm(false); setSelectedExtra(null); }}>Cancel</button>
                  <button className={`app_btn app_btn_confirm ${savingExtra ? "btn_loading" : ""}`} type="submit" disabled={savingExtra || !selectedExtra} style={{ position: "relative", minWidth: 90 }}>
                    <span className="btn_text">Add</span>
                    {savingExtra && <span className="btn_loader" style={{ width: 13, height: 13 }} />}
                  </button>
                </div>
              </form>
            )}
            {extras.length === 0 ? <div className="biz_empty" style={{ padding: "20px 0" }}><p>No extras yet.</p></div>
              : <div className="drawer_items_list">{extras.map((ex) => (<div key={ex.id} className="recipe_step_row"><div className="recipe_step_info"><span className="recipe_step_type">extra</span><span className="recipe_step_id">{ex.prepItem?.name || ex.prepItemId}</span></div><button className="biz_icon_btn biz_icon_btn_danger" onClick={() => setConfirmExtra(ex)} disabled={deletingExtra === ex.id} style={{ position: "relative" }}>{deletingExtra === ex.id ? <span className="btn_loader" style={{ width: 13, height: 13, borderColor: "#ef4444", borderTopColor: "transparent" }} /> : <LuTrash2 size={13} />}</button></div>))}</div>}
          </Section>

          {/* Markup by Country */}
          <Section title="Markup by Country" count={markups.length} defaultOpen={false} action={<button className="app_btn app_btn_confirm biz_add_btn" onClick={() => setShowMarkupForm((v) => !v)}><LuPlus size={13} /> Add</button>}>
            {showMarkupForm && (
              <form onSubmit={handleAddMarkup} className="recipe_add_form">
                <div className="register_row">
                  <div className="form-field"><label className="modal-label">Country *</label><select className="modal-input" value={markupCountry} onChange={(e) => setMarkupCountry(e.target.value)} required><option value="">Select country…</option>{COUNTRIES.map((co) => <option key={co} value={co}>{co}</option>)}</select></div>
                  <div className="form-field"><label className="modal-label">Markup % *</label><div style={{ position: "relative" }}><input className="modal-input" type="number" min="0" step="0.1" placeholder="e.g. 20" value={markupValue} onChange={(e) => setMarkupValue(e.target.value)} style={{ paddingRight: 28 }} required /><span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, pointerEvents: "none" }}>%</span></div></div>
                </div>
                <div className="recipe_add_actions">
                  <button className="app_btn app_btn_cancel" type="button" onClick={() => { setShowMarkupForm(false); setMarkupCountry(""); setMarkupValue(""); }}>Cancel</button>
                  <button className={`app_btn app_btn_confirm ${savingMarkup ? "btn_loading" : ""}`} type="submit" disabled={savingMarkup} style={{ position: "relative", minWidth: 90 }}><span className="btn_text">Save</span>{savingMarkup && <span className="btn_loader" style={{ width: 13, height: 13 }} />}</button>
                </div>
              </form>
            )}
            {markupsLoading ? <div className="drawer_loading"><div className="page_loader_spinner" /></div>
              : markups.length === 0 ? <div className="biz_empty" style={{ padding: "20px 0" }}><MdPublic size={22} style={{ opacity: 0.3 }} /><p>No markups set. Add country-specific markups to adjust pricing.</p></div>
              : <div className="drawer_items_list">{markups.map((mu) => (<div key={mu.id} className="recipe_step_row"><div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdPublic size={14} style={{ color: "var(--accent)" }} /></div><div className="recipe_step_info"><span className="recipe_step_id">{mu.country}</span>{mu.state?.name && <span className="recipe_step_instruction">{mu.state.name}</span>}</div><span style={{ fontSize: "0.88rem", fontWeight: 900, color: "var(--accent)", flexShrink: 0 }}>{mu.markup}%</span><button className="biz_icon_btn biz_icon_btn_danger" onClick={() => handleDeleteMarkup(mu.id)} disabled={deletingMarkup === mu.id} style={{ position: "relative" }}>{deletingMarkup === mu.id ? <span className="btn_loader" style={{ width: 12, height: 12, borderColor: "#ef4444", borderTopColor: "transparent" }} /> : <LuTrash2 size={13} />}</button></div>))}</div>}
          </Section>

          {/* Packaging */}
          <Section title="Packaging" defaultOpen={false}>
            {detail.packaging || detail.packagingImage ? (
              <div className="pack_preview_row">
                {detail.packagingImage && <img src={detail.packagingImage} alt="packaging" className="pack_preview_img" />}
                <div className="recipe_step_info"><span className="recipe_step_id">Packaging Details</span>{detail.packaging && <span className="recipe_step_instruction">{detail.packaging}</span>}</div>
              </div>
            ) : <div className="biz_empty" style={{ padding: "16px 0" }}><p>No packaging details. Edit the item above to add packaging info.</p></div>}
          </Section>

          {/* Task Templates */}
          <Section title="Task Templates" count={templates.length} defaultOpen={false} action={<button className="app_btn app_btn_confirm biz_add_btn" onClick={() => { resetTemplateForm(); setShowTemplateForm((v) => !v); }}><LuPlus size={13} /> Add</button>}>
            {(showTemplateForm || editingTemplate) && (
              <div className="recipe_add_form">
                {!editingTemplate && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-heading)" }}>New Template</span><button className="biz_icon_btn" onClick={resetTemplateForm}><LuX size={13} /></button></div>}
                <div className="form-field"><label className="modal-label">Template Name *</label><input className="modal-input" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Daily Opening Checklist" /></div>
                <div className="form-field"><label className="modal-label">Description</label><input className="modal-input" value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} placeholder="Optional" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Type</label><select className="modal-input" value={templateType} onChange={(e) => setTemplateType(e.target.value)}><option value="CHECKLIST">Checklist</option><option value="LOG">Log</option><option value="PROCESS">Process</option></select></div>
                  <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Recurrence</label><select className="modal-input" value={templateRecurrence} onChange={(e) => setTemplateRecurrence(e.target.value)}><option value="DAILY">Daily</option><option value="PER_SHIFT">Per Shift</option><option value="WEEKLY">Weekly</option><option value="AS_NEEDED">As Needed</option></select></div>
                </div>
                <div className="form-field"><label className="modal-label">Scheduled Time (optional)</label><input className="modal-input" type="time" value={templateTime} onChange={(e) => setTemplateTime(e.target.value)} /></div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}><label className="modal-label" style={{ margin: 0 }}>Fields *</label><button className="biz_icon_btn" onClick={() => setTemplateFields((p) => [...p, { type: "checkbox", label: "" }])}><LuPlus size={13} /></button></div>
                {templateFields.map((field, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                    <select className="modal-input" style={{ width: 105, flexShrink: 0 }} value={field.type} onChange={(e) => updateTplField(i, "type", e.target.value)}><option value="checkbox">Checkbox</option><option value="number">Number</option><option value="text">Text</option></select>
                    <input className="modal-input" style={{ flex: 1 }} placeholder="Field label" value={field.label} onChange={(e) => updateTplField(i, "label", e.target.value)} />
                    <button className="biz_icon_btn biz_icon_btn_danger" onClick={() => setTemplateFields((p) => p.filter((_, idx) => idx !== i))} disabled={templateFields.length === 1}><LuX size={13} /></button>
                  </div>
                ))}
                <div className="recipe_add_actions" style={{ marginTop: 10 }}>
                  <button className="app_btn app_btn_cancel" onClick={resetTemplateForm}>Cancel</button>
                  <button className={`app_btn app_btn_confirm ${savingTemplate ? "btn_loading" : ""}`} onClick={handleSaveTemplate} disabled={savingTemplate} style={{ position: "relative", minWidth: 90 }}><span className="btn_text">{editingTemplate ? "Save" : "Create"}</span>{savingTemplate && <span className="btn_loader" style={{ width: 13, height: 13 }} />}</button>
                </div>
              </div>
            )}
            {templatesLoading ? <div className="drawer_loading"><div className="page_loader_spinner" /></div>
              : templates.length === 0 && !showTemplateForm ? <div className="biz_empty" style={{ padding: "16px 0" }}><p>No task templates for this menu item yet.</p></div>
              : <div className="drawer_items_list" style={{ marginTop: 8 }}>{templates.map((tpl) => (<div key={tpl.id} className="recipe_step_row" style={{ opacity: editingTemplate?.id === tpl.id ? 0.4 : 1 }}><div className="recipe_step_info"><span className="recipe_step_id">{tpl.name}</span><span className="recipe_step_instruction">{tpl.type} · {tpl.recurrence}{tpl.time ? ` · ${tpl.time}` : ""}</span></div><span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-muted)", flexShrink: 0 }}>{tpl.schema?.fields?.length || 0} fields</span><button className="biz_icon_btn" onClick={() => { setEditingTemplate(tpl); setTemplateName(tpl.name); setTemplateDesc(tpl.description || ""); setTemplateType(tpl.type || "CHECKLIST"); setTemplateRecurrence(tpl.recurrence || "DAILY"); setTemplateTime(tpl.time || ""); setTemplateFields(tpl.schema?.fields || [{ type: "checkbox", label: "" }]); setShowTemplateForm(false); }} title="Edit"><LuPencil size={13} /></button><button className="biz_icon_btn biz_icon_btn_danger" onClick={() => handleDeleteTemplate(tpl.id)} disabled={deletingTemplate === tpl.id} style={{ position: "relative" }}>{deletingTemplate === tpl.id ? <span className="btn_loader" style={{ width: 12, height: 12, borderColor: "#ef4444", borderTopColor: "transparent" }} /> : <LuTrash2 size={13} />}</button></div>))}</div>}
          </Section>

          {/* Tutorial */}
          <Section title="Tutorial Video" defaultOpen={false}>
            {detail.tutorialVideo ? (
              <div className="tutorial_preview">
                {detail.tutorialVideo.includes("vimeo.com") ? (
                  <iframe src={`https://player.vimeo.com/video/${detail.tutorialVideo.split("/").pop()}`} className="tutorial_video" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style={{ border: "none", width: "100%", aspectRatio: "16/9", borderRadius: 12 }} />
                ) : (
                  <video src={detail.tutorialVideo} controls className="tutorial_video" />
                )}
                <p className="tutorial_replace_hint">Upload a new file below to replace.</p>
              </div>
            ) : <div className="biz_empty" style={{ padding: "16px 0" }}><p>No tutorial video yet.</p></div>}
            <form onSubmit={handleUploadTutorial} className="recipe_add_form">
              <div className="form-field"><label className="modal-label">{detail.tutorialVideo ? "Replace Tutorial" : "Upload Tutorial"} *</label><input className="modal-input" type="file" accept="video/*" onChange={(e) => setTutorialFile(e.target.files[0])} /></div>
              <div className="recipe_add_actions"><button className={`app_btn app_btn_confirm ${uploadingTutorial ? "btn_loading" : ""}`} type="submit" disabled={uploadingTutorial || !tutorialFile} style={{ position: "relative", minWidth: 110 }}><span className="btn_text">Upload</span>{uploadingTutorial && <span className="btn_loader" style={{ width: 13, height: 13 }} />}</button></div>
            </form>
          </Section>

          {/* Modals */}
          <Modal isOpen={!!confirmVariant} onClose={() => setConfirmVariant(null)} title="Remove Variant" description={`Remove variant "${confirmVariant?.name}"? This cannot be undone.`}>
            <div className="modal-body"><div className="modal-footer"><button className="app_btn app_btn_cancel" onClick={() => setConfirmVariant(null)}>Cancel</button><button className={`app_btn app_btn_confirm ${deletingVariant ? "btn_loading" : ""}`} style={{ background: "#ef4444", position: "relative", minWidth: 110 }} onClick={() => handleDeleteVariant(confirmVariant.id)} disabled={!!deletingVariant}><span className="btn_text">Remove</span>{deletingVariant && <span className="btn_loader" style={{ width: 14, height: 14 }} />}</button></div></div>
          </Modal>
          <Modal isOpen={!!confirmDeleteMach} onClose={() => setConfirmDeleteMach(null)} title="Remove Machinery" description={`Remove "${confirmDeleteMach?.name}" from this menu item?`}>
            <div className="modal-body"><div className="modal-footer"><button className="app_btn app_btn_cancel" onClick={() => setConfirmDeleteMach(null)}>Cancel</button><button className={`app_btn app_btn_confirm ${deletingMach ? "btn_loading" : ""}`} style={{ background: "#ef4444", position: "relative", minWidth: 110 }} onClick={() => handleRemoveMachinery(confirmDeleteMach.id)} disabled={!!deletingMach}><span className="btn_text">Remove</span>{deletingMach && <span className="btn_loader" style={{ width: 14, height: 14 }} />}</button></div></div>
          </Modal>
          <Modal isOpen={!!confirmExtra} onClose={() => setConfirmExtra(null)} title="Remove Extra" description={`Remove extra "${confirmExtra?.prepItem?.name || "this extra"}"? This cannot be undone.`}>
            <div className="modal-body"><div className="modal-footer"><button className="app_btn app_btn_cancel" onClick={() => setConfirmExtra(null)}>Cancel</button><button className={`app_btn app_btn_confirm ${deletingExtra ? "btn_loading" : ""}`} style={{ background: "#ef4444", position: "relative", minWidth: 110 }} onClick={() => handleDeleteExtra(confirmExtra.id)} disabled={!!deletingExtra}><span className="btn_text">Remove</span>{deletingExtra && <span className="btn_loader" style={{ width: 14, height: 14 }} />}</button></div></div>
          </Modal>
        </>
      ) : null}
    </Drawer>
  );
}