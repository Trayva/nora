import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuPlus, LuTrash2, LuChefHat } from "react-icons/lu";
import { MdOutlineFastfood } from "react-icons/md";
import Drawer from "../../../components/Drawer";
import Modal from "../../../components/Modal";
import {
  getConcept,
  createMenuItem,
  deleteMenuItem,
} from "../../../api/vendor";
import MenuItemDrawer from "./MenuItemDrawer";
import { MdOutlineRestaurantMenu, MdOutlineSettings } from "react-icons/md";
import MachinerySearchInput from "../../../components/MachinerySearchInput";
import {
  getMachineriesForConcept,
  addMachineryToConcept,
  removeMachineryFromConcept,
} from "../../../api/library";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";

export default function ConceptDrawer({ concept, onClose, onUpdate }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [machineries, setMachineries] = useState([]);
  const [machOpen, setMachOpen] = useState(false); // collapsible
  const [showMachForm, setShowMachForm] = useState(false);
  const [selectedMach, setSelectedMach] = useState(null);
  const [machQty, setMachQty] = useState("1");
  const [savingMach, setSavingMach] = useState(false);
  const [deletingMach, setDeletingMach] = useState(null);

  const fetchDetail = async () => {
    if (!concept) return;
    setLoading(true);
    try {
      const res = await getConcept(concept.id);
      setDetail(res.data.data);
      try {
        const machRes = await getMachineriesForConcept(concept.id);
        const machData = machRes.data.data;
        // handle both array and paginated { items: [] } shape
        setMachineries(machRes.data.data?.data || []); // ← same fix
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

  const handleDeleteItem = async (itemId, e) => {
    e.stopPropagation();
    setDeleting(itemId);
    try {
      await deleteMenuItem(itemId);
      toast.success("Item deleted");
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
      setMachineries(machRes.data.data?.data || []); // ← same fix here
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
            {/* Meta grid */}
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

            {/* Menu items */}
            <div className="drawer_section">
              <div className="drawer_section_header">
                <span className="wallet_section_title">Menu Items</span>
                <button
                  className="app_btn app_btn_confirm biz_add_btn"
                  onClick={() => setShowAddItem(true)}
                >
                  <LuPlus size={14} />
                  Add Item
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
                          className={`biz_icon_btn biz_icon_btn_danger`}
                          title="Delete"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          disabled={deleting === item.id}
                          style={{ position: "relative" }}
                        >
                          {deleting === item.id ? (
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
                            <LuTrash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Machineries (collapsible) ── */}
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
                              onClick={() => handleRemoveMachinery(mId)}
                              disabled={deletingMach === mId}
                              style={{ position: "relative" }}
                            >
                              {deletingMach === mId ? (
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
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </Drawer>

      {/* Add item modal — small form, stays as modal */}
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

      {/* Recipe detail — nested drawer */}
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
  const [form, setForm] = useState({ name: "", description: "" });
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
