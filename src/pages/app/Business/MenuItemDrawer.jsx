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
import MachinerySearchInput from "../../../components/MachinerySearchInput";
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

/* ── Collapsible section wrapper ─────────────────────────────────────────── */
function Section({ title, count, defaultOpen = true, children, action }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="drawer_section">
      <button
        type="button"
        className="drawer_collapsible_header"
        onClick={() => setOpen((v) => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {open ? (
            <LuChevronDown size={14} style={{ color: "var(--text-muted)" }} />
          ) : (
            <LuChevronRight size={14} style={{ color: "var(--text-muted)" }} />
          )}
          <span className="wallet_section_title">{title}</span>
          {count !== undefined && (
            <span className="drawer_section_count">{count}</span>
          )}
        </div>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
      </button>
      {open && <div className="drawer_section_body">{children}</div>}
    </div>
  );
}

/* ── Edit Menu Item Form ──────────────────────────────────────────────────── */
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
  const [packImgPreview, setPackImgPreview] = useState(
    item?.packagingImage || null,
  );
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const packRef = useRef(null);

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--text-heading)",
          }}
        >
          Edit Menu Item
        </span>
        <button className="biz_icon_btn" onClick={onCancel}>
          <LuX size={14} />
        </button>
      </div>

      {/* Image upload */}
      <div className="form-field">
        <label className="modal-label">Image</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            background: "var(--bg-hover)",
            border: "1px dashed var(--border)",
            borderRadius: 10,
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--border)")
          }
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt=""
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--bg-active)",
                border: "1px solid rgba(203,108,220,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MdUpload size={16} style={{ color: "var(--accent)" }} />
            </div>
          )}
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {imageFile ? imageFile.name : "Click to upload image"}
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
      </div>

      <div className="form-field">
        <label className="modal-label">Name *</label>
        <input
          className="modal-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label className="modal-label">Description</label>
        <textarea
          className="modal-input"
          rows={3}
          style={{ resize: "vertical" }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label className="modal-label">Ticket Time (minutes)</label>
        <input
          className="modal-input"
          type="number"
          placeholder="e.g. 15"
          value={ticketTime}
          onChange={(e) => setTicketTime(e.target.value)}
        />
      </div>

      <div className="register_row">
        <div className="form-field">
          <label className="modal-label">Origin</label>
          <input
            className="modal-input"
            placeholder="e.g. Nigeria"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Serves</label>
          <input
            className="modal-input"
            placeholder="e.g. All ages"
            value={serveTo}
            onChange={(e) => setServeTo(e.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="modal-label">Packaging Details</label>
        <textarea
          className="modal-input"
          rows={2}
          style={{ resize: "none" }}
          placeholder="e.g. Sealed paper bag"
          value={packaging}
          onChange={(e) => setPackaging(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label className="modal-label">Packaging Image</label>
        <div
          onClick={() => packRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            background: "var(--bg-hover)",
            border: "1px dashed var(--border)",
            borderRadius: 10,
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--border)")
          }
        >
          {packImgPreview ? (
            <img
              src={packImgPreview}
              alt=""
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--bg-active)",
                border: "1px solid rgba(203,108,220,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MdUpload size={16} style={{ color: "var(--accent)" }} />
            </div>
          )}
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {packImgFile ? packImgFile.name : "Click to upload packaging image"}
          </span>
        </div>
        <input
          ref={packRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files[0];
            if (f) {
              setPackImgFile(f);
              setPackImgPreview(URL.createObjectURL(f));
            }
          }}
        />
      </div>

      <div className="recipe_add_actions">
        <button className="app_btn app_btn_cancel" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`}
          onClick={handleSubmit}
          disabled={saving}
          style={{ position: "relative", minWidth: 100 }}
        >
          <span className="btn_text">Save Changes</span>
          {saving && (
            <span className="btn_loader" style={{ width: 13, height: 13 }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function MenuItemDrawer({ item, onClose, onUpdated }) {
  const { selectedState } = useAppState();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(false);

  // Recipe
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [deletingStep, setDeletingStep] = useState(null);

  // Variants
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantForm, setVariantForm] = useState({
    name: "",
    instruction: "",
    quantity: "",
  });
  const [selectedVariantPrep, setSelectedVariantPrep] = useState(null);
  const [savingVariant, setSavingVariant] = useState(false);
  const [deletingVariant, setDeletingVariant] = useState(null);
  const [confirmVariant, setConfirmVariant] = useState(null);

  // Extras
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [selectedExtra, setSelectedExtra] = useState(null);
  const [savingExtra, setSavingExtra] = useState(false);
  const [deletingExtra, setDeletingExtra] = useState(null);
  const [confirmExtra, setConfirmExtra] = useState(null);

  // Tutorial
  const [tutorialFile, setTutorialFile] = useState(null);
  const [uploadingTutorial, setUploadingTutorial] = useState(false);

  // Machineries
  const [machineries, setMachineries] = useState([]);
  const [machLoading, setMachLoading] = useState(false);
  const [showMachForm, setShowMachForm] = useState(false);
  const [selectedMach, setSelectedMach] = useState(null);
  const [machQty, setMachQty] = useState("1");
  const [savingMach, setSavingMach] = useState(false);
  const [confirmDeleteMach, setConfirmDeleteMach] = useState(null);
  const [deletingMach, setDeletingMach] = useState(null);

  // Markups
  const [markups, setMarkups] = useState([]);
  const [markupsLoading, setMarkupsLoading] = useState(false);
  const [showMarkupForm, setShowMarkupForm] = useState(false);
  const [markupCountry, setMarkupCountry] = useState("");
  const [markupValue, setMarkupValue] = useState("");
  const [savingMarkup, setSavingMarkup] = useState(false);
  const [deletingMarkup, setDeletingMarkup] = useState(null);

  const fetchDetail = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const res = await getMenuItem(item.id);
      setDetail(res.data.data);
    } catch {
      toast.error("Failed to load item");
    } finally {
      setLoading(false);
    }
  };

  const fetchMachineries = async () => {
    if (!item) return;
    setMachLoading(true);
    try {
      const r = await api.get(`/vendor/menu/${item.id}/machineries`);
      const d = r.data.data;
      setMachineries(Array.isArray(d) ? d : d?.data || d?.machineries || []);
    } catch {
      /* silent */
    } finally {
      setMachLoading(false);
    }
  };

  const fetchMarkups = async () => {
    if (!item) return;
    setMarkupsLoading(true);
    try {
      const r = await api.get(`/vendor/menu/${item.id}/markups`);
      const d = r.data.data;
      setMarkups(Array.isArray(d) ? d : d?.data || d?.markups || []);
    } catch {
      /* silent */
    } finally {
      setMarkupsLoading(false);
    }
  };

  useEffect(() => {
    if (item) {
      fetchDetail();
      fetchMachineries();
      fetchMarkups();
    } else {
      setDetail(null);
      setMachineries([]);
      setMarkups([]);
    }
  }, [item?.id]);

  // ── Machineries ──────────────────────────────────────────────────────────
  const handleAddMachinery = async (e) => {
    e.preventDefault();
    if (!selectedMach) return;
    setSavingMach(true);
    try {
      await api.post(`/vendor/menu/${item.id}/machineries`, {
        machineryId: selectedMach.id,
        quantity: Number(machQty) || 1,
      });
      toast.success("Machinery added");
      setSelectedMach(null);
      setMachQty("1");
      setShowMachForm(false);
      fetchMachineries();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add machinery");
    } finally {
      setSavingMach(false);
    }
  };

  const handleRemoveMachinery = async (machineryId) => {
    setDeletingMach(machineryId);
    try {
      await api.delete(`/vendor/menu/${item.id}/machineries`, {
        data: { machineryId },
      });
      toast.success("Machinery removed");
      setConfirmDeleteMach(null);
      setMachineries((p) =>
        p.filter((m) => (m.machineryId || m.id) !== machineryId),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove");
    } finally {
      setDeletingMach(null);
    }
  };

  // ── Markups ───────────────────────────────────────────────────────────────
  const handleAddMarkup = async (e) => {
    e.preventDefault();
    if (!markupCountry.trim()) return toast.error("Select a country");
    if (!markupValue || isNaN(Number(markupValue)))
      return toast.error("Enter a valid markup %");
    setSavingMarkup(true);
    try {
      await api.post("/vendor/menu/markups", {
        menuItemId: item.id,
        country: markupCountry.trim(),
        markup: Number(markupValue),
      });
      toast.success("Markup saved");
      setMarkupCountry("");
      setMarkupValue("");
      setShowMarkupForm(false);
      fetchMarkups();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save markup");
    } finally {
      setSavingMarkup(false);
    }
  };

  const handleDeleteMarkup = async (markupId) => {
    setDeletingMarkup(markupId);
    try {
      await api.delete(`/vendor/menu/markups/${markupId}`);
      toast.success("Markup removed");
      setMarkups((p) => p.filter((m) => m.id !== markupId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove markup");
    } finally {
      setDeletingMarkup(null);
    }
  };

  // ── Recipe ─────────────────────────────────────────────────────────────────
  const handleAddStep = async (stepData) => {
    try {
      await addMenuRecipe(item.id, stepData);
      toast.success("Step added");
      setShowRecipeForm(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add step");
    }
  };

  const handleUpdateStep = async (stepId, body) => {
    await updateMenuRecipe(stepId, body);
    fetchDetail();
  };

  const handleDeleteStep = async (stepId) => {
    setDeletingStep(stepId);
    try {
      await deleteMenuRecipe(stepId);
      toast.success("Step removed");
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove step");
    } finally {
      setDeletingStep(null);
    }
  };

  // ── Variants ───────────────────────────────────────────────────────────────
  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.name.trim() || !selectedVariantPrep) return;
    setSavingVariant(true);
    try {
      await addMenuVariant(item.id, {
        name: variantForm.name.trim(),
        prepItemId: selectedVariantPrep.id,
        ...(variantForm.quantity && { quantity: Number(variantForm.quantity) }),
        ...(variantForm.instruction && {
          instruction: variantForm.instruction,
        }),
      });
      toast.success("Variant added");
      setVariantForm({ name: "", instruction: "", quantity: "" });
      setSelectedVariantPrep(null);
      setShowVariantForm(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add variant");
    } finally {
      setSavingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    setDeletingVariant(variantId);
    try {
      await removeMenuVariant(variantId);
      toast.success("Variant removed");
      setConfirmVariant(null);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove variant");
    } finally {
      setDeletingVariant(null);
    }
  };

  // ── Extras ─────────────────────────────────────────────────────────────────
  const handleAddExtra = async (e) => {
    e.preventDefault();
    if (!selectedExtra) return;
    setSavingExtra(true);
    try {
      await addMenuExtra(item.id, { prepItemId: selectedExtra.id });
      toast.success("Extra added");
      setSelectedExtra(null);
      setShowExtraForm(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add extra");
    } finally {
      setSavingExtra(false);
    }
  };

  const handleDeleteExtra = async (extraId) => {
    setDeletingExtra(extraId);
    try {
      await removeMenuExtra(extraId);
      toast.success("Extra removed");
      setConfirmExtra(null);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove extra");
    } finally {
      setDeletingExtra(null);
    }
  };

  // ── Tutorial ───────────────────────────────────────────────────────────────
  const handleUploadTutorial = async (e) => {
    e.preventDefault();
    if (!tutorialFile) return;
    setUploadingTutorial(true);
    try {
      await uploadMenuTutorial(item.id, tutorialFile);
      toast.success("Tutorial uploaded");
      setTutorialFile(null);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload tutorial");
    } finally {
      setUploadingTutorial(false);
    }
  };

  const steps = detail?.menuRecipes || [];
  const variants = detail?.variants || [];
  const extras = detail?.extras || [];

  return (
    <Drawer
      isOpen={!!item}
      onClose={onClose}
      title={item?.name || ""}
      description={item?.description || "Menu item details"}
      width={480}
    >
      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : detail ? (
        <>
          {/* ── Hero (always visible) ── */}
          <div className="drawer_item_hero">
            <div>
              {detail.image ? (
                <img
                  src={detail.image}
                  alt={detail.name}
                  className="drawer_hero_img"
                />
              ) : (
                <div className="drawer_hero_img drawer_hero_placeholder">
                  <MdOutlineFastfood size={28} />
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="drawer_meta_item">
                <span className="wallet_info_label">Ticket Time</span>
                <span className="wallet_info_value">
                  {detail.ticketTime ? `${detail.ticketTime} min` : "—"}
                </span>
              </div>
              {detail.description && (
                <div className="drawer_meta_item" style={{ marginTop: 4 }}>
                  <span className="wallet_info_label">Description</span>
                  <span
                    className="wallet_info_value"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {detail.description}
                  </span>
                </div>
              )}
            </div>
            <button
              className="biz_icon_btn"
              title="Edit menu item"
              onClick={() => setEditingMenuItem((v) => !v)}
              style={{
                alignSelf: "flex-start",
                color: editingMenuItem ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              <LuPencil size={14} />
            </button>
          </div>

          {/* ── Inline edit form — shown below hero when editing ── */}
          {editingMenuItem && (
            <EditMenuItemForm
              item={detail}
              onSaved={() => {
                setEditingMenuItem(false);
                fetchDetail();
                onUpdated?.();
              }}
              onCancel={() => setEditingMenuItem(false)}
            />
          )}

          {/* ── Recipe Steps ── */}
          <Section
            title="Recipe Steps"
            count={steps.length}
            action={
              <button
                className="app_btn app_btn_confirm biz_add_btn"
                onClick={() => setShowRecipeForm((v) => !v)}
              >
                <LuPlus size={13} /> Add Step
              </button>
            }
          >
            {showRecipeForm && (
              <RecipeStepForm
                onAdd={handleAddStep}
                onCancel={() => setShowRecipeForm(false)}
              />
            )}
            <RecipeStepsList
              steps={steps}
              onDelete={handleDeleteStep}
              deletingId={deletingStep}
              onUpdate={handleUpdateStep}
            />
          </Section>

          {/* ── Variants ── */}
          <Section
            title="Variants"
            count={variants.length}
            defaultOpen={false}
            action={
              <button
                className="app_btn app_btn_confirm biz_add_btn"
                onClick={() => setShowVariantForm((v) => !v)}
              >
                <LuPlus size={13} /> Add
              </button>
            }
          >
            {showVariantForm && (
              <form onSubmit={handleAddVariant} className="recipe_add_form">
                <div className="form-field">
                  <label className="modal-label">Variant Name *</label>
                  <input
                    className="modal-input"
                    placeholder="e.g. Small, Large"
                    value={variantForm.name}
                    onChange={(e) =>
                      setVariantForm((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="modal-label">Prep Item *</label>
                  <IngredientSearchInput
                    placeholder="Search prep items..."
                    onSelect={(item) => {
                      if (item.type === "prep") setSelectedVariantPrep(item);
                      else toast.error("Please select a prep item");
                    }}
                  />
                  {selectedVariantPrep && (
                    <div className="ing_selected_chip" style={{ marginTop: 8 }}>
                      <span className="ing_type_badge ing_type_prep">prep</span>
                      <span>{selectedVariantPrep.name}</span>
                    </div>
                  )}
                </div>
                <div className="register_row">
                  <div className="form-field">
                    <label className="modal-label">Quantity</label>
                    <input
                      className="modal-input"
                      type="number"
                      placeholder="e.g. 2"
                      value={variantForm.quantity}
                      onChange={(e) =>
                        setVariantForm((p) => ({
                          ...p,
                          quantity: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label className="modal-label">Instruction</label>
                    <input
                      className="modal-input"
                      placeholder="e.g. Serve with rice"
                      value={variantForm.instruction}
                      onChange={(e) =>
                        setVariantForm((p) => ({
                          ...p,
                          instruction: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="recipe_add_actions">
                  <button
                    className="app_btn app_btn_cancel"
                    type="button"
                    onClick={() => {
                      setShowVariantForm(false);
                      setSelectedVariantPrep(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`app_btn app_btn_confirm ${savingVariant ? "btn_loading" : ""}`}
                    type="submit"
                    disabled={savingVariant || !selectedVariantPrep}
                    style={{ position: "relative", minWidth: 90 }}
                  >
                    <span className="btn_text">Add</span>
                    {savingVariant && (
                      <span
                        className="btn_loader"
                        style={{ width: 13, height: 13 }}
                      />
                    )}
                  </button>
                </div>
              </form>
            )}
            {variants.length === 0 ? (
              <div className="biz_empty" style={{ padding: "20px 0" }}>
                <p>No variants yet.</p>
              </div>
            ) : (
              <div className="drawer_tag_list">
                {variants.map((v) => (
                  <div key={v.id} className="drawer_tag_chip">
                    <span>{v.name}</span>
                    <button
                      type="button"
                      className="drawer_tag_remove"
                      onClick={() => setConfirmVariant(v)}
                      disabled={deletingVariant === v.id}
                    >
                      {deletingVariant === v.id ? (
                        <span
                          className="btn_loader"
                          style={{
                            width: 11,
                            height: 11,
                            borderColor: "#ef4444",
                            borderTopColor: "transparent",
                          }}
                        />
                      ) : (
                        <LuTrash2 size={11} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Extras ── */}
          <Section
            title="Extras"
            count={extras.length}
            defaultOpen={false}
            action={
              <button
                className="app_btn app_btn_confirm biz_add_btn"
                onClick={() => setShowExtraForm((v) => !v)}
              >
                <LuPlus size={13} /> Add
              </button>
            }
          >
            {showExtraForm && (
              <form onSubmit={handleAddExtra} className="recipe_add_form">
                <div className="form-field">
                  <label className="modal-label">
                    Select Prep Item / Extra *
                  </label>
                  <IngredientSearchInput
                    placeholder="Search prep items..."
                    onSelect={(item) => {
                      if (item.type === "prep") setSelectedExtra(item);
                      else
                        toast.error(
                          "Please select a prep item, not a raw ingredient",
                        );
                    }}
                  />
                  {selectedExtra && (
                    <div className="ing_selected_chip" style={{ marginTop: 8 }}>
                      <span className="ing_type_badge ing_type_prep">prep</span>
                      <span>{selectedExtra.name}</span>
                    </div>
                  )}
                </div>
                <div className="recipe_add_actions">
                  <button
                    className="app_btn app_btn_cancel"
                    type="button"
                    onClick={() => {
                      setShowExtraForm(false);
                      setSelectedExtra(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`app_btn app_btn_confirm ${savingExtra ? "btn_loading" : ""}`}
                    type="submit"
                    disabled={savingExtra || !selectedExtra}
                    style={{ position: "relative", minWidth: 90 }}
                  >
                    <span className="btn_text">Add</span>
                    {savingExtra && (
                      <span
                        className="btn_loader"
                        style={{ width: 13, height: 13 }}
                      />
                    )}
                  </button>
                </div>
              </form>
            )}
            {extras.length === 0 ? (
              <div className="biz_empty" style={{ padding: "20px 0" }}>
                <p>No extras yet.</p>
              </div>
            ) : (
              <div className="drawer_items_list">
                {extras.map((ex) => (
                  <div key={ex.id} className="recipe_step_row">
                    <div className="recipe_step_info">
                      <span className="recipe_step_type">extra</span>
                      <span className="recipe_step_id">
                        {ex.prepItem?.name || ex.prepItemId}
                      </span>
                    </div>
                    <button
                      className="biz_icon_btn biz_icon_btn_danger"
                      onClick={() => setConfirmExtra(ex)}
                      disabled={deletingExtra === ex.id}
                      style={{ position: "relative" }}
                    >
                      {deletingExtra === ex.id ? (
                        <span
                          className="btn_loader"
                          style={{
                            width: 13,
                            height: 13,
                            borderColor: "#ef4444",
                            borderTopColor: "transparent",
                          }}
                        />
                      ) : (
                        <LuTrash2 size={13} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Machineries / Tools ── */}
          <Section
            title="Machineries & Tools"
            count={machineries.length}
            defaultOpen={false}
            action={
              <button
                className="app_btn app_btn_confirm biz_add_btn"
                onClick={() => setShowMachForm((v) => !v)}
              >
                <LuPlus size={13} /> Add
              </button>
            }
          >
            {showMachForm && (
              <form onSubmit={handleAddMachinery} className="recipe_add_form">
                <div className="form-field">
                  <label className="modal-label">Search Machinery *</label>
                  <MachinerySearchInput
                    placeholder="Search or create machinery..."
                    onSelect={(m) => setSelectedMach(m)}
                  />
                  {selectedMach && (
                    <div className="ing_selected_chip" style={{ marginTop: 8 }}>
                      <span
                        className="ing_type_badge"
                        style={{
                          background: "rgba(100,116,139,0.15)",
                          color: "var(--text-muted)",
                        }}
                      >
                        machine
                      </span>
                      <span>{selectedMach.name}</span>
                    </div>
                  )}
                </div>
                <div className="form-field">
                  <label className="modal-label">Quantity</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="1"
                    value={machQty}
                    onChange={(e) => setMachQty(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="recipe_add_actions">
                  <button
                    className="app_btn app_btn_cancel"
                    type="button"
                    onClick={() => {
                      setShowMachForm(false);
                      setSelectedMach(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`app_btn app_btn_confirm ${savingMach ? "btn_loading" : ""}`}
                    type="submit"
                    disabled={savingMach || !selectedMach}
                    style={{ position: "relative", minWidth: 90 }}
                  >
                    <span className="btn_text">Add</span>
                    {savingMach && (
                      <span
                        className="btn_loader"
                        style={{ width: 13, height: 13 }}
                      />
                    )}
                  </button>
                </div>
              </form>
            )}
            {machLoading ? (
              <div className="drawer_loading">
                <div className="page_loader_spinner" />
              </div>
            ) : machineries.length === 0 ? (
              <div className="biz_empty" style={{ padding: "20px 0" }}>
                <MdBuild size={22} style={{ opacity: 0.3 }} />
                <p>No machineries added yet.</p>
              </div>
            ) : (
              <div className="drawer_items_list">
                {machineries.map((m) => {
                  const mach = m.machinery || m;
                  const mId = m.machineryId || m.id;
                  return (
                    <div key={mId} className="recipe_step_row">
                      {mach.image ? (
                        <img
                          src={mach.image}
                          alt={mach.name}
                          className="ing_option_img"
                          style={{ borderRadius: 8 }}
                        />
                      ) : (
                        <div className="ing_option_img ing_option_img_placeholder">
                          <MdBuild size={12} />
                        </div>
                      )}
                      <div className="recipe_step_info">
                        <span className="recipe_step_id">{mach.name}</span>
                        {mach.manufacturer && (
                          <span className="recipe_step_instruction">
                            {mach.manufacturer}
                          </span>
                        )}
                      </div>
                      {m.quantity > 1 && (
                        <span className="recipe_step_qty">× {m.quantity}</span>
                      )}
                      <button
                        className="biz_icon_btn biz_icon_btn_danger"
                        onClick={() =>
                          setConfirmDeleteMach({ id: mId, name: mach.name })
                        }
                        disabled={deletingMach === mId}
                        style={{ position: "relative" }}
                      >
                        {deletingMach === mId ? (
                          <span
                            className="btn_loader"
                            style={{
                              width: 12,
                              height: 12,
                              borderColor: "#ef4444",
                              borderTopColor: "transparent",
                            }}
                          />
                        ) : (
                          <LuTrash2 size={13} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* ── Markup Management ── */}
          <Section
            title="Markup by Country"
            count={markups.length}
            defaultOpen={false}
            action={
              <button
                className="app_btn app_btn_confirm biz_add_btn"
                onClick={() => setShowMarkupForm((v) => !v)}
              >
                <LuPlus size={13} /> Add
              </button>
            }
          >
            {showMarkupForm && (
              <form onSubmit={handleAddMarkup} className="recipe_add_form">
                <div className="register_row">
                  <div className="form-field">
                    <label className="modal-label">Country *</label>
                    <input
                      className="modal-input"
                      placeholder="e.g. Nigeria"
                      value={markupCountry}
                      onChange={(e) => setMarkupCountry(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="modal-label">Markup % *</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="modal-input"
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="e.g. 20"
                        value={markupValue}
                        onChange={(e) => setMarkupValue(e.target.value)}
                        style={{ paddingRight: 28 }}
                        required
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                          pointerEvents: "none",
                        }}
                      >
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div className="recipe_add_actions">
                  <button
                    className="app_btn app_btn_cancel"
                    type="button"
                    onClick={() => {
                      setShowMarkupForm(false);
                      setMarkupCountry("");
                      setMarkupValue("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`app_btn app_btn_confirm ${savingMarkup ? "btn_loading" : ""}`}
                    type="submit"
                    disabled={savingMarkup}
                    style={{ position: "relative", minWidth: 90 }}
                  >
                    <span className="btn_text">Save</span>
                    {savingMarkup && (
                      <span
                        className="btn_loader"
                        style={{ width: 13, height: 13 }}
                      />
                    )}
                  </button>
                </div>
              </form>
            )}
            {markupsLoading ? (
              <div className="drawer_loading">
                <div className="page_loader_spinner" />
              </div>
            ) : markups.length === 0 ? (
              <div className="biz_empty" style={{ padding: "20px 0" }}>
                <MdPublic size={22} style={{ opacity: 0.3 }} />
                <p>
                  No markups set. Add country-specific markups to adjust
                  pricing.
                </p>
              </div>
            ) : (
              <div className="drawer_items_list">
                {markups.map((mu) => (
                  <div key={mu.id} className="recipe_step_row">
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "var(--bg-active)",
                        border: "1px solid rgba(203,108,220,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MdPublic size={14} style={{ color: "var(--accent)" }} />
                    </div>
                    <div className="recipe_step_info">
                      <span className="recipe_step_id">{mu.country}</span>
                      {mu.state?.name && (
                        <span className="recipe_step_instruction">
                          {mu.state.name}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 900,
                        color: "var(--accent)",
                        flexShrink: 0,
                      }}
                    >
                      {mu.markup}%
                    </span>
                    <button
                      className="biz_icon_btn biz_icon_btn_danger"
                      onClick={() => handleDeleteMarkup(mu.id)}
                      disabled={deletingMarkup === mu.id}
                      style={{ position: "relative" }}
                    >
                      {deletingMarkup === mu.id ? (
                        <span
                          className="btn_loader"
                          style={{
                            width: 12,
                            height: 12,
                            borderColor: "#ef4444",
                            borderTopColor: "transparent",
                          }}
                        />
                      ) : (
                        <LuTrash2 size={13} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Packaging ── */}
          <Section title="Packaging" defaultOpen={false}>
            {detail.packaging || detail.packagingImage ? (
              <div className="pack_preview_row">
                {detail.packagingImage && (
                  <img
                    src={detail.packagingImage}
                    alt="packaging"
                    className="pack_preview_img"
                  />
                )}
                <div className="recipe_step_info">
                  <span className="recipe_step_id">Packaging Details</span>
                  {detail.packaging && (
                    <span className="recipe_step_instruction">
                      {detail.packaging}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="biz_empty" style={{ padding: "16px 0" }}>
                <p>
                  No packaging details. Edit the item above to add packaging
                  info.
                </p>
              </div>
            )}
          </Section>

          {/* ── Tutorial ── */}
          <Section title="Tutorial Video" defaultOpen={false}>
            {detail.tutorialVideo ? (
              <div className="tutorial_preview">
                {detail.tutorialVideo.includes("vimeo.com") ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${detail.tutorialVideo.split("/").pop()}`}
                    className="tutorial_video"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    style={{
                      border: "none",
                      width: "100%",
                      aspectRatio: "16/9",
                      borderRadius: 12,
                    }}
                  />
                ) : (
                  <video
                    src={detail.tutorialVideo}
                    controls
                    className="tutorial_video"
                  />
                )}
                <p className="tutorial_replace_hint">
                  Upload a new file below to replace.
                </p>
              </div>
            ) : (
              <div className="biz_empty" style={{ padding: "16px 0" }}>
                <p>No tutorial video yet.</p>
              </div>
            )}
            <form onSubmit={handleUploadTutorial} className="recipe_add_form">
              <div className="form-field">
                <label className="modal-label">
                  {detail.tutorialVideo
                    ? "Replace Tutorial"
                    : "Upload Tutorial"}{" "}
                  *
                </label>
                <input
                  className="modal-input"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setTutorialFile(e.target.files[0])}
                />
              </div>
              <div className="recipe_add_actions">
                <button
                  className={`app_btn app_btn_confirm ${uploadingTutorial ? "btn_loading" : ""}`}
                  type="submit"
                  disabled={uploadingTutorial || !tutorialFile}
                  style={{ position: "relative", minWidth: 110 }}
                >
                  <span className="btn_text">Upload</span>
                  {uploadingTutorial && (
                    <span
                      className="btn_loader"
                      style={{ width: 13, height: 13 }}
                    />
                  )}
                </button>
              </div>
            </form>
          </Section>

          {/* Confirm delete variant */}
          <Modal
            isOpen={!!confirmVariant}
            onClose={() => setConfirmVariant(null)}
            title="Remove Variant"
            description={`Remove variant "${confirmVariant?.name}"? This cannot be undone.`}
          >
            <div className="modal-body">
              <div className="modal-footer">
                <button
                  className="app_btn app_btn_cancel"
                  onClick={() => setConfirmVariant(null)}
                >
                  Cancel
                </button>
                <button
                  className={`app_btn app_btn_confirm ${deletingVariant ? "btn_loading" : ""}`}
                  style={{
                    background: "#ef4444",
                    position: "relative",
                    minWidth: 110,
                  }}
                  onClick={() => handleDeleteVariant(confirmVariant.id)}
                  disabled={!!deletingVariant}
                >
                  <span className="btn_text">Remove</span>
                  {deletingVariant && (
                    <span
                      className="btn_loader"
                      style={{ width: 14, height: 14 }}
                    />
                  )}
                </button>
              </div>
            </div>
          </Modal>

          {/* Confirm delete machinery */}
          <Modal
            isOpen={!!confirmDeleteMach}
            onClose={() => setConfirmDeleteMach(null)}
            title="Remove Machinery"
            description={`Remove "${confirmDeleteMach?.name}" from this menu item?`}
          >
            <div className="modal-body">
              <div className="modal-footer">
                <button
                  className="app_btn app_btn_cancel"
                  onClick={() => setConfirmDeleteMach(null)}
                >
                  Cancel
                </button>
                <button
                  className={`app_btn app_btn_confirm ${deletingMach ? "btn_loading" : ""}`}
                  style={{
                    background: "#ef4444",
                    position: "relative",
                    minWidth: 110,
                  }}
                  onClick={() => handleRemoveMachinery(confirmDeleteMach.id)}
                  disabled={!!deletingMach}
                >
                  <span className="btn_text">Remove</span>
                  {deletingMach && (
                    <span
                      className="btn_loader"
                      style={{ width: 14, height: 14 }}
                    />
                  )}
                </button>
              </div>
            </div>
          </Modal>

          {/* Confirm delete extra */}
          <Modal
            isOpen={!!confirmExtra}
            onClose={() => setConfirmExtra(null)}
            title="Remove Extra"
            description={`Remove extra "${confirmExtra?.prepItem?.name || "this extra"}"? This cannot be undone.`}
          >
            <div className="modal-body">
              <div className="modal-footer">
                <button
                  className="app_btn app_btn_cancel"
                  onClick={() => setConfirmExtra(null)}
                >
                  Cancel
                </button>
                <button
                  className={`app_btn app_btn_confirm ${deletingExtra ? "btn_loading" : ""}`}
                  style={{
                    background: "#ef4444",
                    position: "relative",
                    minWidth: 110,
                  }}
                  onClick={() => handleDeleteExtra(confirmExtra.id)}
                  disabled={!!deletingExtra}
                >
                  <span className="btn_text">Remove</span>
                  {deletingExtra && (
                    <span
                      className="btn_loader"
                      style={{ width: 14, height: 14 }}
                    />
                  )}
                </button>
              </div>
            </div>
          </Modal>
        </>
      ) : null}
    </Drawer>
  );
}
