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
import { MdOutlineFastfood, MdUpload } from "react-icons/md";
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.image || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

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
    if (imageFile) fd.append("image", imageFile);

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

  useEffect(() => {
    if (item) {
      fetchDetail();
    } else {
      setDetail(null);
    }
  }, [item?.id]);

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
