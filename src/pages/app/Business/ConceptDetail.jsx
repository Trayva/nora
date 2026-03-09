import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuPlus, LuTrash2, LuX, LuChefHat } from "react-icons/lu";
import { MdOutlineFastfood, MdOutlineRestaurantMenu } from "react-icons/md";
import Modal from "../../../components/Modal";
import { getConcept, deleteMenuItem, createMenuItem } from "../../../api/vendor";
import MenuItemDetail from "./MenuItemDetail";

export default function ConceptDetail({ concept, onClose, onUpdate }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await getConcept(concept.id);
      setDetail(res.data.data);
    } catch {
      toast.error("Failed to load concept details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [concept.id]);

  const handleDeleteItem = async (itemId, e) => {
    e.stopPropagation();
    try {
      await deleteMenuItem(itemId);
      toast.success("Item deleted");
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={concept.name}
        description={concept.description || "Concept details and menu items"}
      >
        {loading ? (
          <div className="modal-body">
            <div className="page_loader"><div className="page_loader_spinner" /></div>
          </div>
        ) : (
          <div className="modal-body">

            {/* Concept meta info */}
            <div className="concept_detail_meta">
              <div className="concept_detail_meta_row">
                <div className="concept_detail_meta_item">
                  <span className="wallet_info_label">Origin</span>
                  <span className="wallet_info_value">{detail.origin || "—"}</span>
                </div>
                <div className="concept_detail_meta_item">
                  <span className="wallet_info_label">Serves</span>
                  <span className="wallet_info_value">{detail.serveTo || "—"}</span>
                </div>
                <div className="concept_detail_meta_item">
                  <span className="wallet_info_label">Status</span>
                  <span className={`email_badge ${detail.status === "ACTIVE" ? "email_badge_verified" : "email_badge_unverified"}`}>
                    {detail.status}
                  </span>
                </div>
                <div className="concept_detail_meta_item">
                  <span className="wallet_info_label">Items</span>
                  <span className="wallet_info_value">{detail.menuItems?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Menu items section */}
            <div className="concept_detail_section">
              <div className="concept_detail_section_header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="profile_phone_date_icon" style={{ width: 26, height: 26 }}>
                    <MdOutlineRestaurantMenu size={13} />
                  </div>
                  <span className="wallet_section_title">Menu Items</span>
                </div>
                <button
                  className="app_btn app_btn_confirm biz_add_btn"
                  onClick={() => setShowAddItem(true)}
                >
                  <LuPlus size={14} />
                  Add Item
                </button>
              </div>

              {!detail.menuItems || detail.menuItems.length === 0 ? (
                <div className="biz_empty" style={{ padding: "28px 0" }}>
                  <MdOutlineFastfood size={22} />
                  <p>No items yet.</p>
                </div>
              ) : (
                <div className="concept_items_list">
                  {detail.menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="concept_item_row"
                      onClick={() => setSelectedItem(item)}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="concept_item_img" />
                      ) : (
                        <div className="concept_item_img concept_item_img_placeholder">
                          <MdOutlineFastfood size={15} />
                        </div>
                      )}

                      <div className="concept_item_info">
                        <span className="concept_item_name">{item.name}</span>
                        {item.description && (
                          <span className="concept_item_desc">{item.description}</span>
                        )}
                      </div>

                      <div className="concept_item_right">
                        {item.sellingPrice > 0 && (
                          <div className="concept_item_prices">
                            <span className="concept_item_price_label">Price</span>
                            <span className="concept_item_price">
                              ₦{Number(item.sellingPrice).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {item.recipeCost > 0 && (
                          <div className="concept_item_prices">
                            <span className="concept_item_price_label">Cost</span>
                            <span className="concept_item_price" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                              ₦{Number(item.recipeCost).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="concept_item_actions">
                        <button
                          className="biz_icon_btn"
                          title="View recipes"
                          onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                        >
                          <LuChefHat size={14} />
                        </button>
                        <button
                          className="biz_icon_btn biz_icon_btn_danger"
                          title="Delete item"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                        >
                          <LuTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add item modal */}
      {showAddItem && (
        <AddItemInline
          conceptId={concept.id}
          onClose={() => setShowAddItem(false)}
          onSuccess={() => { setShowAddItem(false); fetchDetail(); }}
        />
      )}

      {/* Menu item recipe detail */}
      {selectedItem && (
        <MenuItemDetail
          item={selectedItem}
          onClose={() => { setSelectedItem(null); fetchDetail(); }}
        />
      )}
    </>
  );
}

// Inline add item modal
function AddItemInline({ conceptId, onClose, onSuccess }) {
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
    <Modal isOpen onClose={onClose} title="Add Menu Item" description="Add a new item to this concept.">
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
              placeholder="Describe the item..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              style={{ resize: "none" }}
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Image</label>
            <input className="modal-input" type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
          </div>
          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" type="button" onClick={onClose}>Cancel</button>
            <button
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              type="submit" disabled={loading}
              style={{ position: "relative", minWidth: 110 }}
            >
              <span className="btn_text">Add Item</span>
              {loading && <span className="btn_loader" style={{ width: 15, height: 15 }} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}