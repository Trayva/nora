import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuPlus, LuTrash2, LuChefHat } from "react-icons/lu";
import { MdOutlineFastfood } from "react-icons/md";
import { getMenuByConcept, deleteMenuItem } from "../../../api/vendor";
import CreateMenuItemModal from "./CreateMenuItemModal";
import MenuItemDrawer from "./MenuItemDrawer";
import Modal from "../../../components/Modal";

export default function MenuTab({
  concepts,
  selectedConcept,
  onSelectConcept,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchMenu = async (conceptId) => {
    if (!conceptId) return;
    setLoading(true);
    try {
      const res = await getMenuByConcept(conceptId);
      setItems(res.data.data || []);
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedConcept) fetchMenu(selectedConcept.id);
  }, [selectedConcept]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteMenuItem(id);
      toast.success("Item deleted");
      setConfirmDelete(null);
      fetchMenu(selectedConcept.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="biz_tab_panel">
      {/* Concept selector pills */}
      {concepts.length > 0 && (
        <div className="menu_concept_pills">
          {concepts.map((c) => (
            <button
              key={c.id}
              className={`menu_concept_pill ${selectedConcept?.id === c.id ? "menu_concept_pill_active" : ""}`}
              onClick={() => onSelectConcept(c)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="biz_panel_header">
        <span className="biz_panel_count">
          {selectedConcept
            ? `${items.length} item${items.length !== 1 ? "s" : ""} in ${selectedConcept.name}`
            : "Select a concept"}
        </span>
        {selectedConcept && (
          <button
            className="app_btn app_btn_confirm biz_add_btn"
            onClick={() => setShowCreate(true)}
          >
            <LuPlus size={15} />
            Add Item
          </button>
        )}
      </div>

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : !selectedConcept ? (
        <div className="biz_empty">
          <MdOutlineFastfood size={28} />
          <p>Select a concept above to view its menu.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="biz_empty">
          <MdOutlineFastfood size={28} />
          <p>No menu items yet for this concept.</p>
        </div>
      ) : (
        <div className="drawer_items_list">
          {items.map((item) => (
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
                  <MdOutlineFastfood size={16} />
                </div>
              )}

              <div className="drawer_item_info">
                <span className="concept_item_name">{item.name}</span>
                {item.description && (
                  <span className="concept_item_desc">{item.description}</span>
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

      {selectedConcept && (
        <CreateMenuItemModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetchMenu(selectedConcept.id);
          }}
          conceptId={selectedConcept.id}
        />
      )}

      <MenuItemDrawer
        item={selectedItem}
        onClose={() => {
          setSelectedItem(null);
          fetchMenu(selectedConcept?.id);
        }}
      />

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
              onClick={() => handleDelete(confirmDelete.id)}
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
    </div>
  );
}
