import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  LuPlus,
  LuTrash2,
  LuChefHat,
  LuChevronDown,
  LuChevronRight,
  LuPencil,
} from "react-icons/lu";
import {
  MdOutlineFastfood,
  MdOutlineRestaurantMenu,
  MdOutlineSettings,
  MdOutlineInventory2,
} from "react-icons/md";
import Drawer from "../../../components/Drawer";
import Modal from "../../../components/Modal";
import MachinerySearchInput from "../../../components/MachinerySearchInput";
import {
  getConcept,
  createMenuItem,
  deleteMenuItem,
  updateConceptPackaging,
} from "../../../api/vendor";
import MenuItemDrawer from "./MenuItemDrawer";
import ConceptEditForm from "./ConceptEditForm";
import {
  getMachineriesForConcept,
  addMachineryToConcept,
  removeMachineryFromConcept,
} from "../../../api/library";
import api from "../../../api/axios";

export default function ConceptDrawer({ concept, onClose, onUpdate }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [machineries, setMachineries] = useState([]);
  const [machOpen, setMachOpen] = useState(false);
  const [showMachForm, setShowMachForm] = useState(false);
  const [selectedMach, setSelectedMach] = useState(null);
  const [machQty, setMachQty] = useState("1");
  const [savingMach, setSavingMach] = useState(false);
  const [deletingMach, setDeletingMach] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteMach, setConfirmDeleteMach] = useState(null);
  const [packOpen, setPackOpen] = useState(false);
  const [packForm, setPackForm] = useState({ packaging: "" });
  const [packImage, setPackImage] = useState(null);
  const [savingPack, setSavingPack] = useState(false);
  const [showPackForm, setShowPackForm] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [editingConcept, setEditingConcept] = useState(false);

  const fetchDetail = async () => {
    if (!concept) return;
    setLoading(true);
    try {
      const res = await getConcept(concept.id);
      setDetail(res.data.data);
      try {
        const machRes = await getMachineriesForConcept(concept.id);
        setMachineries(machRes.data.data?.data || []);
      } catch {
        /* silent */
      }
    } catch {
      toast.error("Failed to load concept details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (concept) fetchDetail();
    else setDetail(null);
  }, [concept?.id]);

  const handleTogglePublic = async () => {
    if (!detail) return;
    setTogglingPublic(true);
    try {
      await api.patch(`/vendor/concept/${concept.id}/toggle-public`, {
        isPublic: !detail.isPublic,
      });
      setDetail((prev) => ({ ...prev, isPublic: !prev.isPublic }));
      toast.success(
        detail.isPublic ? "Concept set to private" : "Concept is now public",
      );
      if (onUpdate) onUpdate({ ...concept, isPublic: !detail.isPublic });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update visibility");
    } finally {
      setTogglingPublic(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    setDeleting(itemId);
    try {
      await deleteMenuItem(itemId);
      toast.success("Item deleted");
      setConfirmDelete(null);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleAddMachinery = async (e) => {
    e.preventDefault();
    if (!selectedMach) return;
    setSavingMach(true);
    try {
      await addMachineryToConcept(concept.id, {
        machineryId: selectedMach.id,
        quantity: Number(machQty) || 1,
      });
      toast.success("Machinery added");
      setSelectedMach(null);
      setMachQty("1");
      setShowMachForm(false);
      const machRes = await getMachineriesForConcept(concept.id);
      setMachineries(machRes.data.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add machinery");
    } finally {
      setSavingMach(false);
    }
  };

  const handleRemoveMachinery = async (machineryId) => {
    setDeletingMach(machineryId);
    try {
      await removeMachineryFromConcept(concept.id, machineryId);
      toast.success("Machinery removed");
      setConfirmDeleteMach(null);
      setMachineries((prev) =>
        prev.filter(
          (m) => m.id !== machineryId && m.machineryId !== machineryId,
        ),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove");
    } finally {
      setDeletingMach(null);
    }
  };

  const handleUpdatePackaging = async (e) => {
    e.preventDefault();
    if (!packForm.packaging.trim() && !packImage) return;
    setSavingPack(true);
    try {
      const fd = new FormData();
      if (packForm.packaging.trim())
        fd.append("packaging", packForm.packaging.trim());
      if (packImage) fd.append("image", packImage);
      await updateConceptPackaging(concept.id, fd);
      toast.success("Packaging updated");
      setShowPackForm(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update packaging");
    } finally {
      setSavingPack(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={!!concept}
        onClose={onClose}
        title={concept?.name || ""}
        description={concept?.description || "Concept details and menu items"}
        width={540}
      >
        {loading ? (
          <div className="page_loader">
            <div className="page_loader_spinner" />
          </div>
        ) : detail ? (
          <>
            {/* ── Meta grid ── */}
            <div className="drawer_meta_grid">
              <div className="drawer_meta_item">
                <span className="wallet_info_label">Origin</span>
                <span className="wallet_info_value">
                  {detail.origin || "—"}
                </span>
              </div>
              <div className="drawer_meta_item">
                <span className="wallet_info_label">Serves</span>
                <span className="wallet_info_value">
                  {detail.serveTo || "—"}
                </span>
              </div>
              <div className="drawer_meta_item">
                <span className="wallet_info_label">Status</span>
                <span
                  className={`email_badge ${detail.status === "ACTIVE" ? "email_badge_verified" : "email_badge_unverified"}`}
                >
                  {detail.status}
                </span>
              </div>
              <div className="drawer_meta_item">
                <span className="wallet_info_label">Items</span>
                <span className="wallet_info_value">
                  {detail.menuItems?.length || 0}
                </span>
              </div>
            </div>

            {/* ── Edit concept button + inline form ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 8,
              }}
            >
              <button
                className="biz_icon_btn"
                onClick={() => setEditingConcept((v) => !v)}
                title="Edit concept"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  width: "auto",
                  color: editingConcept ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                <LuPencil size={12} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                  Edit Concept
                </span>
              </button>
            </div>

            {editingConcept && (
              <div style={{ marginBottom: 16 }}>
                <ConceptEditForm
                  concept={detail}
                  onSaved={() => {
                    setEditingConcept(false);
                    fetchDetail();
                    if (onUpdate) onUpdate(concept);
                  }}
                  onCancel={() => setEditingConcept(false)}
                />
              </div>
            )}

            {/* ── Public toggle ── */}
            <div className="concept_public_row">
              <div className="concept_public_info">
                <span className="concept_public_label">Public Concept</span>
                <span className="concept_public_sub">
                  Allow this concept to appear in the iCart rental marketplace
                </span>
              </div>
              <button
                className={`concept_public_toggle ${detail.isPublic ? "concept_public_toggle_on" : ""} ${togglingPublic ? "concept_public_toggle_loading" : ""}`}
                onClick={handleTogglePublic}
                disabled={togglingPublic}
                title={detail.isPublic ? "Set to private" : "Make public"}
              >
                <span className="concept_public_toggle_knob" />
              </button>
            </div>

            {/* ── Menu items ── */}
            <div className="drawer_section">
              <div className="drawer_section_header">
                <span className="wallet_section_title">Menu Items</span>
                <button
                  className="app_btn app_btn_confirm biz_add_btn"
                  onClick={() => setShowAddItem(true)}
                >
                  <LuPlus size={14} /> Add Item
                </button>
              </div>

              {!detail.menuItems || detail.menuItems.length === 0 ? (
                <div className="biz_empty" style={{ padding: "32px 0" }}>
                  <MdOutlineFastfood size={24} />
                  <p>No menu items yet.</p>
                </div>
              ) : (
                <div className="drawer_items_list">
                  {detail.menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="drawer_item_row"
                      onClick={() => setSelectedItem(item)}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="drawer_item_img"
                        />
                      ) : (
                        <div className="drawer_item_img drawer_item_img_placeholder">
                          <MdOutlineFastfood size={15} />
                        </div>
                      )}
                      <div className="drawer_item_info">
                        <span className="concept_item_name">{item.name}</span>
                        {item.description && (
                          <span className="concept_item_desc">
                            {item.description}
                          </span>
                        )}
                        <div className="drawer_item_prices">
                          {item.sellingPrice > 0 && (
                            <span className="drawer_price_chip">
                              ₦{Number(item.sellingPrice).toLocaleString()}
                            </span>
                          )}
                          {item.recipeCost > 0 && (
                            <span className="drawer_price_chip drawer_price_chip_muted">
                              Cost ₦{Number(item.recipeCost).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="drawer_item_actions">
                        <button
                          className="biz_icon_btn"
                          title="View recipes"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                        >
                          <LuChefHat size={14} />
                        </button>
                        <button
                          className="biz_icon_btn biz_icon_btn_danger"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(item);
                          }}
                        >
                          <LuTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Machineries ── */}
            <div className="drawer_section">
              <div
                className="drawer_collapsible_header"
                onClick={() => setMachOpen((v) => !v)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {machOpen ? (
                    <LuChevronDown
                      size={14}
                      style={{ color: "var(--text-muted)" }}
                    />
                  ) : (
                    <LuChevronRight
                      size={14}
                      style={{ color: "var(--text-muted)" }}
                    />
                  )}
                  <span className="wallet_section_title">Machineries</span>
                  <span className="drawer_section_count">
                    {machineries.length}
                  </span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    className="app_btn app_btn_confirm biz_add_btn"
                    onClick={() => setShowMachForm((v) => !v)}
                  >
                    <LuPlus size={13} /> Add
                  </button>
                </div>
              </div>

              {machOpen && (
                <div className="drawer_section_body">
                  {showMachForm && (
                    <form
                      onSubmit={handleAddMachinery}
                      className="recipe_add_form"
                    >
                      <div className="form-field">
                        <label className="modal-label">
                          Search Machinery *
                        </label>
                        <MachinerySearchInput
                          placeholder="Search or create machinery..."
                          onSelect={(m) => setSelectedMach(m)}
                        />
                        {selectedMach && (
                          <div
                            className="ing_selected_chip"
                            style={{ marginTop: 8 }}
                          >
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
                  {machineries.length === 0 ? (
                    <div className="biz_empty" style={{ padding: "20px 0" }}>
                      <p>No machineries mapped to this concept yet.</p>
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
                                <MdOutlineSettings size={12} />
                              </div>
                            )}
                            <div className="recipe_step_info">
                              <span className="recipe_step_id">
                                {mach.name}
                              </span>
                              {mach.manufacturer && (
                                <span className="recipe_step_instruction">
                                  {mach.manufacturer}
                                </span>
                              )}
                            </div>
                            {m.quantity > 1 && (
                              <span className="recipe_step_qty">
                                × {m.quantity}
                              </span>
                            )}
                            <button
                              className="biz_icon_btn biz_icon_btn_danger"
                              onClick={() =>
                                setConfirmDeleteMach({
                                  id: mId,
                                  name: mach.name,
                                })
                              }
                              style={{ position: "relative" }}
                            >
                              <LuTrash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Packaging ── */}
            <div className="drawer_section">
              <div
                className="drawer_collapsible_header"
                onClick={() => setPackOpen((v) => !v)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {packOpen ? (
                    <LuChevronDown
                      size={14}
                      style={{ color: "var(--text-muted)" }}
                    />
                  ) : (
                    <LuChevronRight
                      size={14}
                      style={{ color: "var(--text-muted)" }}
                    />
                  )}
                  <span className="wallet_section_title">Packaging</span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    className="app_btn app_btn_confirm biz_add_btn"
                    onClick={() => setShowPackForm((v) => !v)}
                  >
                    <LuPlus size={13} /> {detail.packaging ? "Update" : "Add"}
                  </button>
                </div>
              </div>
              {packOpen && (
                <div className="drawer_section_body">
                  {detail.packaging && !showPackForm && (
                    <div className="pack_preview_row">
                      {detail.packagingImage && (
                        <img
                          src={detail.packagingImage}
                          alt="packaging"
                          className="pack_preview_img"
                        />
                      )}
                      <div className="recipe_step_info">
                        <span className="recipe_step_id">
                          Packaging Details
                        </span>
                        <span className="recipe_step_instruction">
                          {detail.packaging}
                        </span>
                      </div>
                    </div>
                  )}
                  {!detail.packaging && !showPackForm && (
                    <div className="biz_empty" style={{ padding: "20px 0" }}>
                      <MdOutlineInventory2 size={22} />
                      <p>No packaging details yet.</p>
                    </div>
                  )}
                  {showPackForm && (
                    <form
                      onSubmit={handleUpdatePackaging}
                      className="recipe_add_form"
                    >
                      <div className="form-field">
                        <label className="modal-label">
                          Packaging Description *
                        </label>
                        <textarea
                          className="modal-input"
                          rows={3}
                          style={{ resize: "none" }}
                          placeholder="e.g. Sealed paper bag, 500g capacity"
                          value={packForm.packaging}
                          onChange={(e) =>
                            setPackForm({ packaging: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-field">
                        <label className="modal-label">Packaging Image</label>
                        <input
                          className="modal-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPackImage(e.target.files[0])}
                        />
                      </div>
                      <div className="recipe_add_actions">
                        <button
                          className="app_btn app_btn_cancel"
                          type="button"
                          onClick={() => {
                            setShowPackForm(false);
                            setPackImage(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className={`app_btn app_btn_confirm ${savingPack ? "btn_loading" : ""}`}
                          type="submit"
                          disabled={
                            savingPack ||
                            (!packForm.packaging.trim() && !packImage)
                          }
                          style={{ position: "relative", minWidth: 90 }}
                        >
                          <span className="btn_text">Save</span>
                          {savingPack && (
                            <span
                              className="btn_loader"
                              style={{ width: 13, height: 13 }}
                            />
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            <Modal
              isOpen={!!confirmDelete}
              onClose={() => setConfirmDelete(null)}
              title="Delete Menu Item"
              description={`Are you sure you want to delete "${confirmDelete?.name}"? This cannot be undone.`}
            >
              <div className="modal-body">
                <div className="modal-footer">
                  <button
                    className="app_btn app_btn_cancel"
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`app_btn app_btn_confirm ${deleting ? "btn_loading" : ""}`}
                    style={{
                      background: "#ef4444",
                      position: "relative",
                      minWidth: 110,
                    }}
                    onClick={() => handleDeleteItem(confirmDelete.id)}
                    disabled={!!deleting}
                  >
                    <span className="btn_text">Delete</span>
                    {deleting && (
                      <span
                        className="btn_loader"
                        style={{ width: 14, height: 14 }}
                      />
                    )}
                  </button>
                </div>
              </div>
            </Modal>

            <Modal
              isOpen={!!confirmDeleteMach}
              onClose={() => setConfirmDeleteMach(null)}
              title="Remove Machinery"
              description={`Are you sure you want to remove "${confirmDeleteMach?.name}" from this concept?`}
            >
              <div className="modal-body">
                <div className="modal-footer">
                  <button
                    className="app_btn app_btn_cancel"
                    type="button"
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
          </>
        ) : null}
      </Drawer>

      {showAddItem && (
        <AddItemModal
          conceptId={concept?.id}
          onClose={() => setShowAddItem(false)}
          onSuccess={() => {
            setShowAddItem(false);
            fetchDetail();
          }}
        />
      )}

      <MenuItemDrawer
        item={selectedItem}
        onClose={() => {
          setSelectedItem(null);
          fetchDetail();
        }}
      />
    </>
  );
}

function AddItemModal({ conceptId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    ticketTime: "",
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("conceptId", conceptId);
      fd.append("name", form.name);
      if (form.description) fd.append("description", form.description);
      if (form.ticketTime) fd.append("ticketTime", form.ticketTime);
      if (image) fd.append("image", image);
      await createMenuItem(fd);
      toast.success("Item added!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add Menu Item"
      description="Add a new item to this concept."
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-field">
            <label className="modal-label">Item Name *</label>
            <input
              className="modal-input"
              placeholder="e.g. Jollof Rice"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Description</label>
            <textarea
              className="modal-input"
              rows={3}
              style={{ resize: "none" }}
              placeholder="Describe the item..."
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Ticket Time (minutes)</label>
            <input
              className="modal-input"
              type="number"
              min="1"
              placeholder="e.g. 15"
              value={form.ticketTime}
              onChange={(e) =>
                setForm((p) => ({ ...p, ticketTime: e.target.value }))
              }
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Image</label>
            <input
              className="modal-input"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>
          <div className="modal-footer">
            <button
              className="app_btn app_btn_cancel"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              type="submit"
              disabled={loading}
              style={{ position: "relative", minWidth: 110 }}
            >
              <span className="btn_text">Add Item</span>
              {loading && (
                <span
                  className="btn_loader"
                  style={{ width: 15, height: 15 }}
                />
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
