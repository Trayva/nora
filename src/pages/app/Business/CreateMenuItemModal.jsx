import { useState } from "react";
import Modal from "../../../components/Modal";
import { createMenuItem } from "../../../api/vendor";
import { toast } from "react-toastify";

export default function CreateMenuItemModal({ isOpen, onClose, onSuccess, conceptId }) {
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
      toast.success("Menu item created!");
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Menu Item" description="Add a new item to this concept's menu.">
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
            <label className="modal-label">Item Image</label>
            <input
              className="modal-input"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>
          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" type="button" onClick={onClose}>Cancel</button>
            <button
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              type="submit" disabled={loading}
              style={{ position: "relative", minWidth: 120 }}
            >
              <span className="btn_text">Add Item</span>
              {loading && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}