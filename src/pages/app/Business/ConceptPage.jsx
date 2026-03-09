import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LuPlus, LuTrash2, LuArrowLeft, LuChefHat } from "react-icons/lu";
import { MdOutlineFastfood, MdOutlineRestaurantMenu } from "react-icons/md";
import {
  getConcept,
  createMenuItem,
  deleteMenuItem,
} from "../../../api/vendor";
import MenuItemDetail from "./MenuItemDetail";
import CreateConceptModal from "./CreateConceptModal";
import Modal from "../../../components/Modal";

export default function ConceptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchDetail = async () => {
    try {
      const res = await getConcept(id);
      setDetail(res.data.data);
    } catch {
      toast.error("Failed to load concept");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDelete = async (itemId) => {
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

  if (loading) {
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="page_wrapper">
      {/* Back nav */}
      <button
        className="concept_page_back"
        onClick={() => navigate("/app/business")}
      >
        <LuArrowLeft size={16} />
        Business
      </button>

      {/* Concept header */}
      <div className="concept_page_header">
        {detail.banner ? (
          <img
            src={detail.banner}
            alt={detail.name}
            className="concept_page_banner"
          />
        ) : (
          <div className="concept_page_banner concept_page_banner_placeholder">
            <MdOutlineRestaurantMenu size={36} />
          </div>
        )}
        <div className="concept_page_meta">
          <div>
            <h2 className="page_title_big m-0">{detail.name}</h2>
            {detail.description && (
              <p className="welcome_message">{detail.description}</p>
            )}
          </div>
          <div className="concept_page_badges">
            <span
              className={`email_badge ${detail.status === "ACTIVE" ? "email_badge_verified" : "email_badge_unverified"}`}
            >
              {detail.status}
            </span>
            {detail.origin && (
              <span className="concept_meta_pill">🌍 {detail.origin}</span>
            )}
            {detail.serveTo && (
              <span className="concept_meta_pill">👥 {detail.serveTo}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="concept_page_stats">
        <div className="concept_stat_card">
          <span className="concept_stat_label">Total Items</span>
          <span className="concept_stat_value">
            {detail.menuItems?.length || 0}
          </span>
        </div>
        <div className="concept_stat_card">
          <span className="concept_stat_label">Ingredients</span>
          <span className="concept_stat_value">
            {detail.ingredients?.length || 0}
          </span>
        </div>
        <div className="concept_stat_card">
          <span className="concept_stat_label">Status</span>
          <span className="concept_stat_value">{detail.status}</span>
        </div>
      </div>

      {/* Menu items */}
      <div className="concept_page_section">
        <div className="biz_panel_header">
          <h3 className="section_card_title">Menu Items</h3>
          <button
            className="app_btn app_btn_confirm biz_add_btn"
            onClick={() => setShowAddItem(true)}
          >
            <LuPlus size={15} />
            Add Item
          </button>
        </div>

        {!detail.menuItems || detail.menuItems.length === 0 ? (
          <div className="biz_empty">
            <MdOutlineFastfood size={28} />
            <p>No menu items yet. Add your first item.</p>
          </div>
        ) : (
          <div className="menu_items_grid">
            {detail.menuItems.map((item) => (
              <div
                key={item.id}
                className="menu_item_card"
                onClick={() => setSelectedItem(item)}
              >
                {/* Image */}
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="menu_item_card_img"
                  />
                ) : (
                  <div className="menu_item_card_img menu_item_card_placeholder">
                    <MdOutlineFastfood size={22} />
                  </div>
                )}

                <div className="menu_item_card_body">
                  <div className="concept_header_row">
                    <div>
                      <h4 className="concept_name">{item.name}</h4>
                      {item.description && (
                        <p className="concept_location">{item.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Price row */}
                  <div className="concept_info_row">
                    <span className="concept_info_label">Selling Price</span>
                    <span className="concept_info_value">
                      ₦{Number(item.sellingPrice || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="concept_info_row">
                    <span className="concept_info_label">Recipe Cost</span>
                    <span className="concept_info_value">
                      ₦{Number(item.recipeCost || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="concept_total_row">
                    <span className="concept_total_label">Recipes</span>
                    <span className="concept_total_value">View →</span>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button
                      className="concept_select_btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                      style={{ flex: 1 }}
                    >
                      <LuChefHat size={14} />
                      View Recipes
                    </button>
                    <button
                      className={`biz_icon_btn biz_icon_btn_danger ${deleting === item.id ? "btn_loading" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      disabled={deleting === item.id}
                      style={{ position: "relative", height: 38, width: 38 }}
                    >
                      {deleting === item.id ? (
                        <span
                          className="btn_loader"
                          style={{
                            width: 14,
                            height: 14,
                            borderColor: "#ef4444",
                            borderTopColor: "transparent",
                          }}
                        />
                      ) : (
                        <LuTrash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add item modal */}
      {showAddItem && (
        <AddItemModal
          conceptId={id}
          onClose={() => setShowAddItem(false)}
          onSuccess={() => {
            setShowAddItem(false);
            fetchDetail();
          }}
        />
      )}

      {/* Menu item recipe detail — also a page-style modal (full recipe mgmt) */}
      {selectedItem && (
        <MenuItemDetail
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null);
            fetchDetail();
          }}
        />
      )}
    </div>
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
              placeholder="Describe the item..."
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              style={{ resize: "none" }}
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
