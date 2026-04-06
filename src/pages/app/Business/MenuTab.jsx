import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuPlus, LuTrash2, LuChefHat, LuSearch } from "react-icons/lu";
import { MdOutlineFastfood } from "react-icons/md";
import api from "../../../api/axios";
import { deleteMenuItem } from "../../../api/vendor";
import CreateMenuItemModal from "./CreateMenuItemModal";
import MenuItemDrawer from "./MenuItemDrawer";
import Modal from "../../../components/Modal";

export default function MenuTab({ vendorId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const [showCreate, setShowCreate] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchMenu = async (pg = 1, q = "") => {
    setLoading(true);
    try {
      let url = `/vendor/menu?page=${pg}&limit=${LIMIT}&vendorId=${vendorId}`;
      if (q.trim()) url += `&search=${encodeURIComponent(q.trim())}`;
      const res = await api.get(url);
      const d = res.data.data;
      // handle both array and paginated object
      if (Array.isArray(d)) {
        setItems(d);
        setTotal(d.length);
        setTotalPages(1);
      } else {
        setItems(d?.data || d?.items || d?.menuItems || []);
        setTotal(d?.total || 0);
        setTotalPages(d?.totalPages || 1);
      }
    } catch {
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => { fetchMenu(1, ""); }, [vendorId]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchMenu(1, search); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Page change
  useEffect(() => { fetchMenu(page, search); }, [page]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteMenuItem(id);
      toast.success("Item deleted");
      setConfirmDelete(null);
      fetchMenu(page, search);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="biz_tab_panel">
      {/* Header */}
      <div className="biz_panel_header">
        <span className="biz_panel_count">
          {total > 0 ? `${total} item${total !== 1 ? "s" : ""}` : "Menu Items"}
        </span>
        <button
          className="app_btn app_btn_confirm biz_add_btn"
          onClick={() => setShowCreate(true)}
        >
          <LuPlus size={15} /> Add Item
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <LuSearch size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
          className="modal-input"
          style={{ paddingLeft: 32, marginBottom: 0, height: 38 }}
          placeholder="Search menu items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="page_loader"><div className="page_loader_spinner" /></div>
      ) : items.length === 0 ? (
        <div className="biz_empty">
          <MdOutlineFastfood size={28} />
          <p>{search ? "No items match your search." : "No menu items yet. Add your first item."}</p>
        </div>
      ) : (
        <>
          <div className="drawer_items_list">
            {items.map((item) => (
              <div
                key={item.id}
                className="drawer_item_row"
                onClick={() => setSelectedItem(item)}
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} className="drawer_item_img" />
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
                    onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                  >
                    <LuChefHat size={14} />
                  </button>
                  <button
                    className="biz_icon_btn biz_icon_btn_danger"
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(item); }}
                  >
                    <LuTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 }}>
              <button
                className="app_btn app_btn_cancel"
                style={{ height: 32, padding: "0 14px", fontSize: "0.76rem" }}
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                ‹ Prev
              </button>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                {page} / {totalPages}
              </span>
              <button
                className="app_btn app_btn_cancel"
                style={{ height: 32, padding: "0 14px", fontSize: "0.76rem" }}
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next ›
              </button>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      <CreateMenuItemModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); fetchMenu(1, search); }}
      />

      {/* Item detail drawer */}
      <MenuItemDrawer
        item={selectedItem}
        onClose={() => { setSelectedItem(null); fetchMenu(page, search); }}
      />

      {/* Confirm delete */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Menu Item"
        description={`Delete "${confirmDelete?.name}"? This cannot be undone.`}
      >
        <div className="modal-body">
          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm ${deleting ? "btn_loading" : ""}`}
              style={{ background: "#ef4444", position: "relative", minWidth: 110 }}
              onClick={() => handleDelete(confirmDelete.id)}
              disabled={!!deleting}
            >
              <span className="btn_text">Delete</span>
              {deleting && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}